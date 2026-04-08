import Draggable from "react-draggable";
import s from "./Table.module.css";
import { useRef } from "react";
import CustomDropmenuV2 from "../../../ui/customdropmenu/CustomDropmenuV2";
import type { TableStatus } from "../../../../core/api/types";

type BasicTableRef = {
  id?: string;
  label?: string;
  code?: string;
};

export interface TableProps {
  id?: string;
  code?: string;
  label?: string;
  numberOfSeats?: number;
  type?: "small" | "large";
  position?: { x: number; y: number };
  isRotated?: boolean; // Propiedad para saber si está rotada
  isSelected?: boolean;
  hasOpenOrder?: boolean;
  status?: TableStatus;
  onlyView?: boolean;
  usePositionInView?: boolean;
  showOptions?: boolean;
  onSelectTable?: (id: string) => void;
  onChangeStatus?: (id: string, status: TableStatus) => void;
  onSwapLabels?: (sourceTableId: string, targetTableId: string) => void;
  onDragStop?: (id: string, x: number, y: number) => void;
  onRotate?: (id: string) => void; // Función para rotarla
  onDelete?: (id: string) => void; // Función para eliminarla
  allTables?: BasicTableRef[];
  menuAreaElement?: HTMLElement | null;
}

const getTableTypeClass = (
  type: TableProps["type"],
  isRotated: boolean | undefined,
): string => {
  if (type !== "large") {
    return s.smallTable;
  }

  return isRotated ? s.largeTableRotated : s.largeTable;
};

const buildSwapNameOptions = (
  currentTableId: string | undefined,
  allTables: BasicTableRef[] | undefined,
  onSwapLabels: TableProps["onSwapLabels"],
) => {
  return (allTables ?? [])
    .filter((table) => table.id && currentTableId && table.id !== currentTableId)
    .map((table) => ({
      label: table.label || table.code || "Mesa",
      onClick: () => onSwapLabels?.(currentTableId || "", table.id || ""),
    }));
};

export const Table = ({
  id,
  code,
  label,
  numberOfSeats,
  type,
  position,
  isRotated,
  isSelected = false,
  hasOpenOrder = false,
  status = "AVAILABLE",
  onlyView = false,
  usePositionInView = false,
  showOptions = true,
  onSelectTable,
  onChangeStatus,
  onSwapLabels,
  onDragStop,
  onRotate,
  onDelete,
  allTables,
  menuAreaElement,
}: TableProps) => {
  const nodeRef = useRef(null);
  const tablePosition = position ?? { x: 0, y: 0 };
  const tableName = label || code || (type === "large" ? "Grande" : "Chica");
  const openOrderClass = hasOpenOrder ? s.openOrder : "";
  const selectedClass = isSelected ? s.selected : "";
  const reservedClass = status === "RESERVED" ? s.reserved : "";
  const outOfServiceClass = status === "OUT_OF_SERVICE" ? s.outOfService : "";
  const isSelectable = Boolean(onSelectTable);
  const isDraggable = !onlyView && showOptions;
  const isOutOfService = status === "OUT_OF_SERVICE";
  const onlyViewPositionStyle = usePositionInView
    ? {
        position: "absolute" as const,
        left: `${tablePosition.x}px`,
        top: `${tablePosition.y}px`,
      }
    : undefined;

  const handleSelectTable = () => {
    if (isOutOfService) {
      return;
    }

    if (id && onSelectTable) {
      onSelectTable(id);
    }
  };

  const tableTypeClass = getTableTypeClass(type, isRotated);
  const swapNameOptions = buildSwapNameOptions(id, allTables, onSwapLabels);

  const options = [
    {
      label: isOutOfService ? "Marcar Habilitada" : "Marcar No Disponible",
      onClick: () =>
        onChangeStatus?.(
          id || "",
          isOutOfService ? "AVAILABLE" : "OUT_OF_SERVICE",
        ),
    },
    {
      label: "Girar",
      onClick: () => onRotate?.(id || ""),
    },
    {
      label: "Eliminar",
      onClick: () => onDelete?.(id || ""),
    },
    ...(swapNameOptions.length > 0
      ? [
          {
            label: "Alternar nombre",
            subOptions: swapNameOptions,
          },
        ]
      : []),
  ];

  if (onlyView) {
    if (isSelectable) {
      return (
        <button
          type="button"
          ref={nodeRef}
          onClick={handleSelectTable}
          className={`${s.onlyView} ${tableTypeClass} ${openOrderClass} ${reservedClass} ${outOfServiceClass} ${selectedClass}`}
          style={onlyViewPositionStyle}
          disabled={isOutOfService}
        >
          <div className={s.headerTable}>
            <p>{tableName}</p>
            {numberOfSeats !== undefined && <p>{numberOfSeats} asientos</p>}
          </div>
        </button>
      );
    }

    return (
      <div
        ref={nodeRef}
        className={`${s.onlyView} ${tableTypeClass} ${openOrderClass} ${reservedClass} ${outOfServiceClass} ${selectedClass}`}
        style={onlyViewPositionStyle}
      >
        <div className={s.headerTable}>
          <p>{tableName}</p>
          {numberOfSeats !== undefined && <p>{numberOfSeats} asientos</p>}
        </div>
      </div>
    );
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      bounds="parent"
      grid={[80, 80]} // ¡ESTO ES LA MAGIA! Hace que se mueva de a 80px
      onStop={(_, data) => onDragStop?.(id || "", data.x, data.y)}
      disabled={!isDraggable}
    >
      {isSelectable ? (
        <button
          type="button"
          ref={nodeRef}
          onClick={handleSelectTable}
          className={`${s.table} ${tableTypeClass} ${openOrderClass} ${reservedClass} ${outOfServiceClass} ${selectedClass}`}
          disabled={isOutOfService}
        >
          <div className={s.headerTable}>
            <p>{tableName}</p>
            {numberOfSeats !== undefined && <p>{numberOfSeats} asientos</p>}
          </div>
        </button>
      ) : (
        <div
          ref={nodeRef}
          className={`${s.table} ${tableTypeClass} ${openOrderClass} ${reservedClass} ${outOfServiceClass} ${selectedClass}`}
        >
          <div className={s.headerTable}>
            <p>{tableName}</p>
            {numberOfSeats !== undefined && <p>{numberOfSeats} asientos</p>}
          </div>
          {showOptions && (
            <div style={{ position: "absolute", top: 4, right: 4, zIndex: 5000 }}>
              <CustomDropmenuV2
                options={options}
                icon={<span className={s.menuIcon}>⋮</span>}
                typeClass="ghost"
                menuAreaElement={menuAreaElement}
              />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
