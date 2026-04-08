import s from "./FloorPlan.module.css";
import { Table } from "../components/table/Table";
import { SideBarFloorPlan } from "../componentsList/SideBar";
import { useFloorPlanLogic } from "./useFloorPlanLogic";
import PencilIcon from "../../ui/icons/PencilIcon";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { Tooltip } from "@mui/material";
import { Chair } from "../components/chair/Chair";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const workspaceRef = useRef<HTMLDivElement | null>(null);

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
  const isPhoneViewport = viewportSize.width <= 680;
  const isNarrowPhoneViewport = viewportSize.width <= 430;
  const isVeryNarrowViewport = viewportSize.width <= 375;
  const isTabletViewport = viewportSize.width <= 1080;

  const workspaceScale = useMemo(() => {
    if (!isWideMode) {
      return 1;
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

    const availableWidth = Math.max(240, viewportSize.width - horizontalPadding);
    const availableHeight = Math.max(240, viewportSize.height - verticalPadding);

    const scaleByWidth = availableWidth / baseWorkspaceWidth;
    const scaleByHeight = availableHeight / baseWorkspaceHeight;
    const fittedScale = Math.min(scaleByWidth, scaleByHeight);

    return Math.max(minScale, Math.min(2.2, fittedScale));
  }, [
    baseWorkspaceHeight,
    baseWorkspaceWidth,
    isWideMode,
    isPhoneViewport,
    isNarrowPhoneViewport,
    isTabletViewport,
    isVeryNarrowViewport,
    viewportSize.height,
    viewportSize.width,
  ]);

  const scaledWorkspaceWidth = baseWorkspaceWidth * workspaceScale;
  const scaledWorkspaceHeight = baseWorkspaceHeight * workspaceScale;

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
        className={`${s.workspaceContainer} ${isWideMode ? s.workspaceContainerWide : ""} ${previewOnly ? s.workspaceContainerPreview : ""}`}
      >
        <div
          className={s.workspaceScaleWrapper}
          style={{
            width: `${scaledWorkspaceWidth}px`,
            height: `${scaledWorkspaceHeight}px`,
          }}
        >
          <div
            ref={workspaceRef}
            className={s.workspace}
            style={{
              width: `${baseWorkspaceWidth}px`,
              height: `${baseWorkspaceHeight}px`,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
              transform: `scale(${workspaceScale})`,
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
                position={table.position}
                isRotated={table.isRotated}
                status={table.status}
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
                menuAreaElement={workspaceRef.current}
              />
            ))}
            {chairs.map((chair) => (
              <Chair
                key={chair.id}
                id={chair.id}
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
        {!previewOnly && <div className={s.editAction}>
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
