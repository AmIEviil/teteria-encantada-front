import Draggable from "react-draggable";
import s from "./Chair.module.css";
import { useRef } from "react";
import CustomDropmenuV2 from "../../../ui/customdropmenu/CustomDropmenuV2";

export interface ChairProps {
  id?: string;
  position?: { x: number; y: number };
  rotation?: number; // Cuidado de actualizar esto a número
  onlyView?: boolean;
  usePositionInView?: boolean;
  showOptions?: boolean;
  onDragStop?: (id: string, x: number, y: number) => void;
  onRotate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const Chair = ({
  id,
  position,
  rotation = 0,
  onlyView = false,
  usePositionInView = false,
  showOptions = true,
  onDragStop,
  onRotate,
  onDelete,
}: ChairProps) => {
  const nodeRef = useRef(null);
  const chairPosition = position ?? { x: 0, y: 0 };
  const isDraggable = !onlyView && showOptions;

  const options = [
    {
      label: "Girar",
      onClick: () => onRotate?.(id || ""),
    },
    {
      label: "Eliminar",
      onClick: () => onDelete?.(id || ""),
    },
  ];

  if (onlyView) {
    if (!usePositionInView) {
      return (
        <div
          ref={nodeRef}
          style={{
            width: 80,
            height: 80,
          }}
        >
          <div className={s.chair} style={{ rotate: `${rotation}deg` }}>
            <div className={s.headerTable}></div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={nodeRef}
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          left: `${chairPosition.x}px`,
          top: `${chairPosition.y}px`,
        }}
      >
        <div className={s.chair} style={{ rotate: `${rotation}deg` }}>
          <div className={s.headerTable}></div>
        </div>
      </div>
    );
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      position={position}
      bounds="parent"
      grid={[80, 80]}
      onStop={(_, data) => onDragStop?.(id || "", data.x, data.y)}
      disabled={!isDraggable}
    >
      <div
        ref={nodeRef}
        style={{ position: "absolute", width: 80, height: 80 }}
        className={isDraggable ? s.grabCursor : ""}
      >
        <div className={s.chair} style={{ rotate: `${rotation}deg` }}>
          <div className={s.headerTable}></div>
        </div>

        {showOptions && (
          <div style={{ position: "absolute", top: 4, right: 4, zIndex: 10 }}>
            <CustomDropmenuV2
              options={options}
              icon={<span className={s.menuIcon}>⋮</span>}
              typeClass="ghost"
            />
          </div>
        )}
      </div>
    </Draggable>
  );
};
