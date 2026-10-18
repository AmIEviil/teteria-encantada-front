import s from "./FloorPlan.module.css";
import { Table } from "../components/table/Table";
import { SideBarFloorPlan } from "../componentsList/SideBar";
import { useFloorPlanLogic } from "./useFloorPlanLogic";
import PencilIcon from "../../ui/icons/PencilIcon";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { Tooltip } from "@mui/material";
import { Chair } from "../components/chair/Chair";
import { useEffect, useMemo, useState } from "react";

interface FloorPlanProps {
  selectedTableId?: string;
  onSelectTable?: (tableId: string) => void;
  isWideMode?: boolean;
  previewOnly?: boolean;
}

export const FloorPlan = ({
  selectedTableId,
  onSelectTable,
  isWideMode = false,
  previewOnly = false,
}: FloorPlanProps) => {
  const canUseWindow = typeof globalThis.window === "object";

  const {
    CELL_SIZE,
    tables,
    chairs,
    gridSize,
    handleAddTable,
    handleDragStop,
    handleAddChair,
    handleDeleteChair,
    handleRotate,
    handleDeleteTable,
    handleChangeTableStatus,
    handleSwapTableLabels,
    modifyGrid,
    resetLayout,
    loadFabricLayout,
    isEditing,
    handleEdit,
    handleCancelEdit,
    openOrderTableIds,
  } = useFloorPlanLogic();

  const [viewportSize, setViewportSize] = useState({
    width: canUseWindow ? globalThis.window.innerWidth : 1280,
    height: canUseWindow ? globalThis.window.innerHeight : 720,
  });
  const [workspaceEl, setWorkspaceEl] = useState<HTMLDivElement | null>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  // Medidas reales del layout:
  // - containerInnerWidth: estimarlo como "viewport - padding fijo" se queda
  //   corto (el layout mete padding propio) y el plano termina cortado.
  // - workspaceBorderWidth: .workspace es content-box con borde propio (2px,
  //   1px en pantallas chicas) que escala junto al transform, asi que hay que
  //   contarlo o el grid desborda al wrapper.
  const [layoutMetrics, setLayoutMetrics] = useState({
    containerInnerWidth: 0,
    workspaceBorderWidth: 2,
  });

  useEffect(() => {
    if (!containerEl) {
      return;
    }

    const readMetrics = () => {
      const containerStyles = globalThis.getComputedStyle(containerEl);
      const horizontalPadding =
        Number.parseFloat(containerStyles.paddingLeft) +
        Number.parseFloat(containerStyles.paddingRight);
      const nextInnerWidth = Math.max(
        0,
        containerEl.clientWidth - horizontalPadding,
      );
      const measuredBorder = workspaceEl
        ? Number.parseFloat(
            globalThis.getComputedStyle(workspaceEl).borderLeftWidth,
          )
        : Number.NaN;

      setLayoutMetrics((current) => {
        const nextBorder = Number.isFinite(measuredBorder)
          ? measuredBorder
          : current.workspaceBorderWidth;

        if (
          Math.abs(current.containerInnerWidth - nextInnerWidth) < 0.5 &&
          current.workspaceBorderWidth === nextBorder
        ) {
          return current;
        }

        return {
          containerInnerWidth: nextInnerWidth,
          workspaceBorderWidth: nextBorder,
        };
      });
    };

    readMetrics();

    const observer = new ResizeObserver(readMetrics);
    observer.observe(containerEl);

    return () => {
      observer.disconnect();
    };
  }, [containerEl, workspaceEl]);

  const { containerInnerWidth, workspaceBorderWidth } = layoutMetrics;

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const baseWorkspaceWidth = gridSize.cols * CELL_SIZE;
  const baseWorkspaceHeight = gridSize.rows * CELL_SIZE;
  const outerWorkspaceWidth = baseWorkspaceWidth + workspaceBorderWidth * 2;
  const outerWorkspaceHeight = baseWorkspaceHeight + workspaceBorderWidth * 2;
  const isPhoneViewport = viewportSize.width <= 680;
  const isNarrowPhoneViewport = viewportSize.width <= 430;
  const isVeryNarrowViewport = viewportSize.width <= 375;
  const isTabletViewport = viewportSize.width <= 1080;

  // Un plano apaisado (mas columnas que filas) dentro de una pantalla vertical
  // desperdicia casi todo el alto: queda una franja chica arriba. En ese caso
  // rotamos el plano completo 90deg para que use el alto disponible. Solo en
  // modo vista: en edicion el drag trabaja en coordenadas sin rotar.
  const fitScale = (
    availableWidth: number,
    availableHeight: number,
    contentWidth: number,
    contentHeight: number,
  ) => Math.min(availableWidth / contentWidth, availableHeight / contentHeight);

  const { workspaceScale, isRotatedLayout } = useMemo(() => {
    if (!isWideMode) {
      return { workspaceScale: 1, isRotatedLayout: false };
    }

    let horizontalPadding = 130;
    let verticalPadding = 240;
    let minScale = 1;

    if (isTabletViewport) {
      horizontalPadding = 72;
      verticalPadding = 250;
      minScale = 0.62;
    }

    if (isPhoneViewport) {
      horizontalPadding = 36;
      verticalPadding = 230;
      minScale = 0.5;
    }

    if (isNarrowPhoneViewport) {
      horizontalPadding = 22;
      verticalPadding = 214;
      minScale = 0.45;
    }

    if (isVeryNarrowViewport) {
      horizontalPadding = 14;
      verticalPadding = 204;
      minScale = 0.4;
    }

    const availableWidth = Math.max(
      240,
      containerInnerWidth || viewportSize.width - horizontalPadding,
    );
    const availableHeight = Math.max(240, viewportSize.height - verticalPadding);

    const fittedScale = fitScale(
      availableWidth,
      availableHeight,
      outerWorkspaceWidth,
      outerWorkspaceHeight,
    );

    // Al rotar, el plano necesita el alto donde antes pedia ancho: se compara
    // contra el mismo hueco con las medidas del contenido intercambiadas.
    const rotatedScale = fitScale(
      availableWidth,
      availableHeight,
      outerWorkspaceHeight,
      outerWorkspaceWidth,
    );

    const isPortraitViewport = availableHeight > availableWidth;
    const isLandscapeLayout = outerWorkspaceWidth > outerWorkspaceHeight;
    // El 15% evita rotar cuando la ganancia es marginal y solo desorienta.
    const rotationPaysOff = rotatedScale > fittedScale * 1.15;
    const shouldRotate =
      !isEditing && isPortraitViewport && isLandscapeLayout && rotationPaysOff;

    const chosenScale = shouldRotate ? rotatedScale : fittedScale;

    return {
      workspaceScale: Math.max(minScale, Math.min(2.2, chosenScale)),
      isRotatedLayout: shouldRotate,
    };
  }, [
    containerInnerWidth,
    outerWorkspaceHeight,
    outerWorkspaceWidth,
    isEditing,
    isWideMode,
    isPhoneViewport,
    isNarrowPhoneViewport,
    isTabletViewport,
    isVeryNarrowViewport,
    viewportSize.height,
    viewportSize.width,
  ]);

  const scaledWorkspaceWidth = outerWorkspaceWidth * workspaceScale;
  const scaledWorkspaceHeight = outerWorkspaceHeight * workspaceScale;
  // Rotado con transform-origin top-left, el plano cae sobre las X negativas:
  // el translate lo devuelve al cuadrante visible.
  const workspaceTransform = isRotatedLayout
    ? `translateX(${scaledWorkspaceHeight}px) rotate(90deg) scale(${workspaceScale})`
    : `scale(${workspaceScale})`;
  const wrapperWidth = isRotatedLayout
    ? scaledWorkspaceHeight
    : scaledWorkspaceWidth;
  const wrapperHeight = isRotatedLayout
    ? scaledWorkspaceWidth
    : scaledWorkspaceHeight;

  return (
    <div className={`${s.layout} ${isWideMode ? s.layoutWide : ""} ${previewOnly ? s.layoutPreview : ""}`}>
      {!previewOnly && isEditing && (
        <SideBarFloorPlan
          onAddTable={handleAddTable}
          onAddChair={handleAddChair}
          onModifyGrid={modifyGrid}
          onResetLayout={resetLayout}
          onInitialLayout={loadFabricLayout}
        />
      )}

      <div
        ref={setContainerEl}
        className={`${s.workspaceContainer} ${isWideMode ? s.workspaceContainerWide : ""} ${previewOnly ? s.workspaceContainerPreview : ""}`}
      >
        <div
          className={s.workspaceScaleWrapper}
          style={{
            width: `${wrapperWidth}px`,
            height: `${wrapperHeight}px`,
          }}
        >
          <div
            ref={setWorkspaceEl}
            className={s.workspace}
            style={{
              width: `${baseWorkspaceWidth}px`,
              height: `${baseWorkspaceHeight}px`,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              transform: workspaceTransform,
              transformOrigin: "top left",
            }}
          >
            {tables.map((table) => (
              <Table
                key={table.id}
                id={table.id}
                code={table.code}
                label={table.label}
                type={table.type}
                cellSize={CELL_SIZE}
                scale={workspaceScale}
                contentRotation={isRotatedLayout ? -90 : 0}
                position={table.position}
                isRotated={table.isRotated}
                status={table.status}
                confirmationStatus={table.confirmationStatus}
                isSelected={Boolean(selectedTableId && table.id === selectedTableId)}
                hasOpenOrder={table.id ? openOrderTableIds.has(table.id) : false}
                onSelectTable={isEditing ? undefined : onSelectTable}
                onChangeStatus={handleChangeTableStatus}
                onSwapLabels={handleSwapTableLabels}
                onDragStop={handleDragStop}
                onRotate={handleRotate}
                onDelete={handleDeleteTable}
                onlyView={previewOnly}
                usePositionInView={previewOnly}
                showOptions={isEditing}
                allTables={tables}
                menuAreaElement={workspaceEl}
              />
            ))}
            {chairs.map((chair) => (
              <Chair
                key={chair.id}
                id={chair.id}
                cellSize={CELL_SIZE}
                scale={workspaceScale}
                position={chair.position}
                rotation={chair.rotation}
                onDragStop={handleDragStop}
                onRotate={handleRotate}
                onDelete={handleDeleteChair}
                onlyView={previewOnly}
                usePositionInView={previewOnly}
                showOptions={isEditing}
              />
            ))}
          </div>
        </div>
        {!previewOnly && viewportSize.width >= 768 && <div className={s.editAction}>
          {isEditing && (
            <Tooltip title="Cancelar edicion" arrow>
              <button className={s.buttonCancel} onClick={handleCancelEdit}>
                <CloseIcon />
              </button>
            </Tooltip>
          )}
          <Tooltip title={isEditing ? "Guardar Plano" : "Editar Plano"} arrow>
            <button className={s.buttonEdit} onClick={handleEdit}>
              {isEditing ? <SaveIcon /> : <PencilIcon />}
            </button>
          </Tooltip>
        </div>}
      </div>
    </div>
  );
};
