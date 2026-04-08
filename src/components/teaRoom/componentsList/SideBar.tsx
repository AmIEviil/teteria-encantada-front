import s from "./SideBar.module.css";
import { Table } from "../components/table/Table";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import PlusIcon from "../../ui/icons/PlusIcon";
import { Tooltip } from "@mui/material";
import { Chair } from "../components/chair/Chair";

interface SideBarFloorPlanProps {
  onAddTable: (type: "small" | "large") => void;
  onAddChair: () => void;
  onModifyGrid: (dimension: "rows" | "cols", amount: number) => void;
  onInitialLayout: () => void;
  onResetLayout: () => void;
}

export const SideBarFloorPlan = ({
  onAddTable,
  onAddChair,
  onModifyGrid,
  onInitialLayout,
  onResetLayout,
}: SideBarFloorPlanProps) => {
  const elements = [
    {
      label: "Agregar Mesa Pequeña",
      onClick: () => onAddTable("small"),
      component: <Table type="small" position={{ x: 0, y: 0 }} onlyView />,
    },
    {
      label: "Agregar Mesa Grande",
      onClick: () => onAddTable("large"),
      component: <Table type="large" position={{ x: 0, y: 100 }} onlyView />,
    },
    {
      label: "Agregar Silla",
      onClick: () => onAddChair(),
      component: <Chair position={{ x: 0, y: 0 }} onlyView />,
    },
  ];

  return (
    <div className={s.sideBarContainer}>
      <div className={`${s.componentsList}`}>
        <div className={s.content}>
          {/* <SeeMoreButton
            customClassName={s.toggleButton}
            labelTooltip="Ver Elementos"
            customIcon={<PlusIcon />}
          /> */}
          <div className={s.elements}>
            {elements.map((el, index) => (
              <Tooltip key={index + el.label} title={el.label} arrow>
                <button
                  key={index + el.label}
                  onClick={el.onClick}
                  className={s.elementButton}
                >
                  {el.component}
                </button>
              </Tooltip>
            ))}
          </div>
          <div className={s.gridControlsContainer}>
            <div className={s.gridControls}>
              <button
                className={`secondary ${s.saveButton}`}
                onClick={() => onModifyGrid("cols", 1)}
              >
                <PlusIcon size="22" />
                Columna
              </button>
              <button
                className={`secondary ${s.saveButton}`}
                onClick={() => onModifyGrid("cols", -1)}
              >
                <ClearIcon />
                Columna
              </button>
              <button
                className={`secondary ${s.saveButton}`}
                onClick={() => onModifyGrid("rows", 1)}
              >
                <PlusIcon size="22" />
                Fila
              </button>
              <button
                className={`secondary ${s.saveButton}`}
                onClick={() => onModifyGrid("rows", -1)}
              >
                <ClearIcon />
                Fila
              </button>
            </div>
          </div>
          <div className={s.layoutControls}>
            <button
              onClick={onInitialLayout}
              className={`secondary ${s.saveButton}`}
            >
              <EditIcon style={{ marginRight: "4px" }} />
              Plano Inicial
            </button>
            <button
              onClick={onResetLayout}
              className={`secondary ${s.saveButton}`}
            >
              <ClearIcon style={{ marginRight: "4px" }} />
              Limpiar Plano
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
