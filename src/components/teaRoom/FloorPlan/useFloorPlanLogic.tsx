/* eslint-disable react-hooks/purity */
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TableProps } from "../components/table/Table";
import { initial_floor_plan } from "./initialFloorPlan";
import type { ChairProps } from "../components/chair/Chair";
import { useLayoutsQuery } from "../../../core/api/layouts.hooks";
import { useOrdersQuery } from "../../../core/api/orders.hooks";
import { getApiErrorMessage } from "../../../core/api/apiError";
import { layoutsService } from "../../../core/api/layouts.service";
import { useTablesQuery } from "../../../core/api/tables.hooks";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import type {
  RestaurantTable,
  SaveLayoutSnapshotPayload,
  TableStatus,
} from "../../../core/api/types";

interface FloorPlanData {
  name?: string;
  gridSize: {
    rows: number;
    cols: number;
  };
  tables: TableProps[];
}

interface EditDraftSnapshot {
  tables: TableProps[];
  chairs: ChairProps[];
  gridSize: {
    rows: number;
    cols: number;
  };
}

interface PersistedChair {
  id: string;
  position: { x: number; y: number };
  rotation: number;
}

interface FloorLayoutMetadata {
  version: 1;
  gridSize: {
    rows: number;
    cols: number;
  };
  chairs: PersistedChair[];
}

const CELL_SIZE = 80; // Tamaño de cada cuadro en píxeles
const DEFAULT_GRID_SIZE = { rows: 5, cols: 8 };
const DEFAULT_LAYOUT_NAME = "Plano Principal";

const createTempId = () => `tmp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const inferTableType = (table: RestaurantTable): "small" | "large" => {
  if (table.width >= 120 || table.height >= 120) {
    return "large";
  }

  return "small";
};

const inferTableRotation = (table: RestaurantTable): boolean => {
  if (Math.abs(table.rotation) % 180 === 90) {
    return true;
  }

  return table.height > table.width;
};

const parseLayoutMetadata = (
  description: string | null | undefined,
): FloorLayoutMetadata | null => {
  if (!description) {
    return null;
  }

  try {
    const parsed = JSON.parse(description) as Partial<FloorLayoutMetadata>;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const rows = Number(parsed.gridSize?.rows);
    const cols = Number(parsed.gridSize?.cols);
    const chairs = Array.isArray(parsed.chairs)
      ? parsed.chairs
          .filter(
            (chair): chair is PersistedChair =>
              Boolean(chair?.id) &&
              typeof chair?.position?.x === "number" &&
              typeof chair?.position?.y === "number",
          )
          .map((chair) => ({
            id: chair.id,
            position: chair.position,
            rotation: Number(chair.rotation) || 0,
          }))
      : [];

    return {
      version: 1,
      gridSize: {
        rows: Number.isFinite(rows) && rows > 0 ? rows : DEFAULT_GRID_SIZE.rows,
        cols: Number.isFinite(cols) && cols > 0 ? cols : DEFAULT_GRID_SIZE.cols,
      },
      chairs,
    };
  } catch {
    return null;
  }
};

const normalizeMesaLabel = (value: string | undefined, index: number): string => {
  const normalizedValue = value?.trim().toUpperCase();
  const matchedNumber = normalizedValue?.match(/MESA[_\-\s]?(\d+)/)?.[1];
  const fallbackNumber = String(index + 1);
  const mesaNumber = matchedNumber
    ? String(Number.parseInt(matchedNumber, 10))
    : fallbackNumber;

  return `MESA_${mesaNumber}`;
};

const ensureUniqueCode = (baseCode: string, usedCodes: Set<string>): string => {
  if (!usedCodes.has(baseCode)) {
    usedCodes.add(baseCode);
    return baseCode;
  }

  let counter = 1;
  while (counter < 9999) {
    const suffix = `_${counter}`;
    const candidate = `${baseCode.slice(0, 40 - suffix.length)}${suffix}`;
    if (!usedCodes.has(candidate)) {
      usedCodes.add(candidate);
      return candidate;
    }
    counter += 1;
  }

  const fallback = `${baseCode.slice(0, 30)}_${Date.now().toString().slice(-8)}`;
  usedCodes.add(fallback);
  return fallback;
};

const isPersistedTableId = (id: string | undefined): id is string => {
  if (!id || id.startsWith("tmp-")) {
    return false;
  }

  return UUID_REGEX.test(id);
};

export const useFloorPlanLogic = () => {
  const queryClient = useQueryClient();
  const { data: layouts = [] } = useLayoutsQuery();

  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [tables, setTables] = useState<TableProps[]>([]);
  const [chairs, setChairs] = useState<ChairProps[]>([]);
  // Estado para controlar el tamaño de la grilla
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraftSnapshot, setEditDraftSnapshot] = useState<EditDraftSnapshot | null>(null);
  const [layoutState, setLayoutState] = useState<FloorPlanData>({
    name: DEFAULT_LAYOUT_NAME,
    gridSize: DEFAULT_GRID_SIZE,
    tables: [],
  });

  const buildTablesSnapshot = (source: TableProps[]): TableProps[] => {
    return source.map((table) => ({
      ...table,
      position: table.position
        ? {
            x: table.position.x,
            y: table.position.y,
          }
        : undefined,
      onDragStop: handleDragStop,
      onRotate: handleRotate,
      onChangeStatus: handleChangeTableStatus,
    }));
  };

  const buildChairsSnapshot = (source: ChairProps[]): ChairProps[] => {
    return source.map((chair) => ({
      ...chair,
      position: chair.position
        ? {
            x: chair.position.x,
            y: chair.position.y,
          }
        : undefined,
      onDragStop: handleDragStop,
      onRotate: handleRotate,
    }));
  };

  const activeLayout = useMemo(() => {
    if (selectedLayoutId) {
      const selectedLayout = layouts.find((layout) => layout.id === selectedLayoutId);
      if (selectedLayout) {
        return selectedLayout;
      }
    }

    return layouts.find((layout) => layout.isActive) ?? layouts[0] ?? null;
  }, [layouts, selectedLayoutId]);

  const activeLayoutId = activeLayout?.id;
  const { data: persistedTables = [] } = useTablesQuery(activeLayoutId, Boolean(activeLayoutId));
  const { data: openOrders = [] } = useOrdersQuery({
    status: "OPEN",
  });

  const openOrderTableIds = useMemo(() => {
    const ids = new Set<string>();

    for (const order of openOrders) {
      if (order.tableId) {
        ids.add(order.tableId);
      }
    }

    return ids;
  }, [openOrders]);

  useEffect(() => {
    if (!activeLayout || isEditing) {
      return;
    }

    const parsedMetadata = parseLayoutMetadata(activeLayout.description);
    const nextGridSize = parsedMetadata?.gridSize ?? DEFAULT_GRID_SIZE;
    const nextTables = persistedTables.map((table, index) => ({
      id: table.id,
      code: table.code,
      label: normalizeMesaLabel(table.label ?? table.code, index),
      type: inferTableType(table),
      position: {
        x: table.positionX,
        y: table.positionY,
      },
      isRotated: inferTableRotation(table),
      status: table.status,
      onDragStop: handleDragStop,
      onRotate: handleRotate,
      onChangeStatus: handleChangeTableStatus,
    }));
    const nextChairs = (parsedMetadata?.chairs ?? []).map((chair) => ({
      ...chair,
      onDragStop: handleDragStop,
      onRotate: handleRotate,
    }));

    setGridSize(nextGridSize);
    setTables(nextTables);
    setChairs(nextChairs);
    setLayoutState({
      name: activeLayout.name,
      gridSize: nextGridSize,
      tables: nextTables,
    });
  }, [activeLayout, isEditing, persistedTables]);

  const handleAddTable = (type: "small" | "large") => {
    const id = createTempId();
    const mesaLabel = normalizeMesaLabel(undefined, tables.length);
    const newTable: TableProps = {
      id,
      code: mesaLabel,
      label: mesaLabel,
      type,
      position: { x: 0, y: 0 },
      isRotated: false,
      status: "AVAILABLE",
      onDragStop: handleDragStop,
      onRotate: handleRotate, // Pasamos la función de rotar
      onChangeStatus: handleChangeTableStatus,
    };
    setTables([...tables, newTable]);
  };

  const handleAddChair = () => {
    const id = createTempId();
    const newChair: ChairProps = {
      id,
      position: { x: 0, y: 0 },
      rotation: 0, // AHORA ES UN NÚMERO (grados)
      onDragStop: handleDragStop,
      onRotate: handleRotate,
    };
    setChairs([...chairs, newChair]);
  };
  
  const handleDeleteTable = (id: string) => {
    setTables((prevTables) => prevTables.filter((table) => table.id !== id));
  };

  const handleDeleteChair = (id: string) => {
    setChairs((prevChairs) => prevChairs.filter((chair) => chair.id !== id));
  };

  const handleDragStop = (id: string, x: number, y: number) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id ? { ...table, position: { x, y } } : table,
      ),
    );
    setChairs((prevChairs) =>
      prevChairs.map((chair) =>
        chair.id === id ? { ...chair, position: { x, y } } : chair,
      ),
    );
  };

  // Función para invertir el estado de rotación
  const handleRotate = (id: string) => {
    // Las mesas se mantienen con su booleano
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id ? { ...table, isRotated: !table.isRotated } : table,
      ),
    );
    // Las sillas ahora suman 90 grados, volviendo a 0 al llegar a 360
    setChairs((prevChairs) =>
      prevChairs.map((chair) =>
        chair.id === id
          ? { ...chair, rotation: ((chair.rotation || 0) + 90) % 360 }
          : chair,
      ),
    );
  };

  const handleChangeTableStatus = (id: string, status: TableStatus) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id ? { ...table, status } : table,
      ),
    );
  };

  const handleSwapTableLabels = (firstTableId: string, secondTableId: string) => {
    if (!firstTableId || !secondTableId || firstTableId === secondTableId) {
      return;
    }

    setTables((prevTables) => {
      const firstTable = prevTables.find((table) => table.id === firstTableId);
      const secondTable = prevTables.find((table) => table.id === secondTableId);

      if (!firstTable || !secondTable) {
        return prevTables;
      }

      const firstLabel = firstTable.label ?? firstTable.code ?? "";
      const secondLabel = secondTable.label ?? secondTable.code ?? "";

      return prevTables.map((table) => {
        if (table.id === firstTableId) {
          return {
            ...table,
            label: secondLabel,
          };
        }

        if (table.id === secondTableId) {
          return {
            ...table,
            label: firstLabel,
          };
        }

        return table;
      });
    });
  };

  // Función para agregar/quitar tamaño al plano
  const modifyGrid = (dimension: "rows" | "cols", amount: number) => {
    setGridSize((prev) => ({
      ...prev,
      // Evitamos que baje de 1 fila/columna
      [dimension]: Math.max(1, prev[dimension] + amount),
    }));
  };

  const buildLayoutMetadata = (): FloorLayoutMetadata => {
    return {
      version: 1,
      gridSize,
      chairs: chairs.map((chair) => ({
        id: chair.id || createTempId(),
        position: {
          x: chair.position?.x ?? 0,
          y: chair.position?.y ?? 0,
        },
        rotation: chair.rotation ?? 0,
      })),
    };
  };

  const buildTablePayload = (
    table: TableProps,
    code: string,
    label: string,
  ) => {
    const isLarge = table.type === "large";
    const rotated = Boolean(table.isRotated);

    let width = 70;
    let height = 70;
    let capacity = 4;

    if (isLarge) {
      width = rotated ? 80 : 150;
      height = rotated ? 160 : 70;
      capacity = 6;
    }

    return {
      code,
      label,
      capacity,
      positionX: table.position?.x ?? 0,
      positionY: table.position?.y ?? 0,
      width,
      height,
      rotation: rotated ? 90 : 0,
      status: table.status ?? "AVAILABLE",
    };
  };

  const buildSnapshotTablesPayload = (): SaveLayoutSnapshotPayload["tables"] => {
    const usedCodes = new Set<string>();
    return tables.map((table, index) => {
      const baseCode = normalizeMesaLabel(table.label ?? table.code, index);
      const normalizedLabel = normalizeMesaLabel(table.label ?? table.code, index);
      const code = ensureUniqueCode(baseCode, usedCodes);
      const payload = buildTablePayload(table, code, normalizedLabel);

      return {
        ...(isPersistedTableId(table.id) ? { id: table.id } : {}),
        ...payload,
      };
    });
  };

  const handleSaveLayout = () => {
    return (async () => {
      const metadata = buildLayoutMetadata();
      const layoutName = activeLayout?.name || layoutState.name || DEFAULT_LAYOUT_NAME;
      const snapshotPayload: SaveLayoutSnapshotPayload = {
        name: layoutName,
        isActive: true,
        gridSize: metadata.gridSize,
        chairs: metadata.chairs,
        tables: buildSnapshotTablesPayload(),
      };

      const savedLayout = activeLayoutId
        ? await layoutsService.saveSnapshot(activeLayoutId, snapshotPayload)
        : await layoutsService.createSnapshot(snapshotPayload);

      const parsedMetadata = parseLayoutMetadata(savedLayout.description);
      const nextGridSize = parsedMetadata?.gridSize ?? gridSize;
      const syncedTables = (savedLayout.tables ?? []).map((table, index) => ({
        id: table.id,
        code: table.code,
        label: normalizeMesaLabel(table.label ?? table.code, index),
        type: inferTableType(table),
        position: {
          x: table.positionX,
          y: table.positionY,
        },
        isRotated: inferTableRotation(table),
        status: table.status,
        onDragStop: handleDragStop,
        onRotate: handleRotate,
        onChangeStatus: handleChangeTableStatus,
      }));
      const nextChairs = (parsedMetadata?.chairs ?? metadata.chairs).map((chair) => ({
        ...chair,
        onDragStop: handleDragStop,
        onRotate: handleRotate,
      }));

      setSelectedLayoutId(savedLayout.id);
      setGridSize(nextGridSize);
      setTables(syncedTables);
      setChairs(nextChairs);
      setLayoutState({
        name: savedLayout.name,
        gridSize: nextGridSize,
        tables: syncedTables,
      });

      useSnackBarResponseStore
        .getState()
        .openSnackbar("Layout guardado correctamente", "success");

      await queryClient.invalidateQueries({ queryKey: ["tables"] });
      await queryClient.invalidateQueries({ queryKey: ["layouts"] });
    })().catch((error: unknown) => {
      useSnackBarResponseStore
        .getState()
        .openSnackbar(getApiErrorMessage(error, "No se pudo guardar el layout"), "error");

      throw error;
    });
  };

  const resetLayout = () => {
    setGridSize(DEFAULT_GRID_SIZE);
    setTables([]);
    setChairs([]);
  };

  const loadFabricLayout = () => {
    const savedLayout = initial_floor_plan as FloorPlanData;
    setGridSize(savedLayout.gridSize);
    setTables(
      savedLayout.tables.map((table) => ({
        ...table,
        onDragStop: handleDragStop,
        onRotate: handleRotate,
        onChangeStatus: handleChangeTableStatus,
      })),
    );
  };

  const handleEdit = () => {
    if (!isEditing) {
      setEditDraftSnapshot({
        gridSize: {
          rows: gridSize.rows,
          cols: gridSize.cols,
        },
        tables: buildTablesSnapshot(tables),
        chairs: buildChairsSnapshot(chairs),
      });
      setIsEditing(true);
      return;
    }

    handleSaveLayout()
      .then(() => {
        setEditDraftSnapshot(null);
        setIsEditing(false);
      })
      .catch(() => {
        // Keep editing mode when save fails.
      });
  };

  const handleCancelEdit = () => {
    if (editDraftSnapshot) {
      setGridSize({
        rows: editDraftSnapshot.gridSize.rows,
        cols: editDraftSnapshot.gridSize.cols,
      });
      setTables(buildTablesSnapshot(editDraftSnapshot.tables));
      setChairs(buildChairsSnapshot(editDraftSnapshot.chairs));
    }

    setEditDraftSnapshot(null);
    setIsEditing(false);
  };

  return {
    CELL_SIZE,
    tables,
    chairs,
    gridSize,
    layoutState,
    handleAddTable,
    handleDeleteTable,
    handleAddChair,
    handleDeleteChair,
    handleDragStop,
    handleRotate,
    handleChangeTableStatus,
    handleSwapTableLabels,
    modifyGrid,
    handleSaveLayout,
    resetLayout,
    loadFabricLayout,
    isEditing,
    handleEdit,
    handleCancelEdit,
    openOrderTableIds,
  };
};
