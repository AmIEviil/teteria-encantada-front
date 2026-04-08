import React from "react";
import style from "./TableStyle.module.css";
import CircularProgress from "@mui/material/CircularProgress";
import CaretIcon from "../icons/CaretIcon";
import OrderIcon from "../icons/OrderIcon";
interface Title {
  label: string;
  key: string;
  icon?: React.ReactNode;
  showOrder?: boolean;
  minWidth?: string;
  maxWidth?: string;
  className?: string;
}

interface TableGenericProps<T> {
  titles: Title[];
  data: T[];
  renderHeader?: (title: Title, index: number) => React.ReactNode;
  renderRow: (item: T) => React.ReactNode;
  loading?: boolean;
  textNotFound?: string;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
  onOrderChange?: (key: string, order: "ASC" | "DESC") => void;
}

const TableGeneric = <T,>({
  titles,
  data,
  renderRow,
  loading,
  textNotFound = "Sin Resultados",
  renderHeader,
  orderBy,
  orderDirection,
  onOrderChange,
}: TableGenericProps<T>) => {
  const handleOrderChange = (key: string) => {
    if (!onOrderChange) return;

    let direction: "ASC" | "DESC" = "ASC";
    if (orderBy === key && orderDirection === "ASC") {
      direction = "DESC";
    }

    onOrderChange(key, direction);
  };

  return (
    <div className={`${style.tableContainer} custom-scrollbar`}>
      <div>
        <table>
          <thead>
            <tr>
              {titles.map((title, index) =>
                renderHeader ? (
                  renderHeader(title, index)
                ) : (
                  <th key={title.label + index}>
                    <span className="flex flex-row items-center gap-2">
                      {title.label}
                      {title.showOrder && (
                        <button
                          onClick={() => handleOrderChange(title.key)}
                          className="focus:outline-none normal"
                        >
                          {orderBy === title.key ? (
                            <CaretIcon
                              direction={
                                orderDirection === "ASC" ? "up" : "down"
                              }
                              size={14}
                              className="ml-1"
                              color="#00B398"
                            />
                          ) : (
                            <OrderIcon
                              className={`${style.orderIcon} text-gray-400`}
                              size={16}
                            />
                          )}
                        </button>
                      )}
                    </span>
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>{data.length > 0 && !loading && data.map(renderRow)}</tbody>
        </table>
        {loading && <CircularProgress className={style.iconTd} />}
        {!data.length && !loading && (
          <ul className={style.noData}>
            <span>{textNotFound}</span>
            <li>Revisa la ortografia</li>
            <li>Intenta buscar por otra palabra</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default TableGeneric;
