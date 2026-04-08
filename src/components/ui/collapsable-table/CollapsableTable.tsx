// React
import React, { useState } from "react";
// Styles
import style from "./CollapsableTable.module.css";
import CaretIcon from "../Icons/CaretIcon";
import OrderIcon from "../Icons/OrderIcon";
import type { Client } from "../../../service/client.interface";
import LoadingSpinner from "../loading/Loading";
import { Checkbox } from "@mui/material";

export interface TableHeader {
  label: string;
  key: string;
  icon?: React.ReactNode;
  showOrder?: boolean;
  minWidth?: string;
  maxWidth?: string;
  className?: string;
}

interface CollapsableTableProps {
  titlesTable: TableHeader[];
  data: Record<string, Client[]>;
  renderRow: (
    item: Client,
    index: number,
    isSelected: boolean,
    onSelect: (selected: boolean) => void
  ) => React.ReactNode;
  emptyMessage?: React.ReactNode | string;
  loading?: boolean;
  className?: string;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
  onOrderChange?: (key: string, order: "ASC" | "DESC") => void;
  showCheckBoxes?: boolean;
  selectedItems?: Client[];
  onItemSelection?: (
    groupKey: string,
    itemId: string,
    selected: boolean
  ) => void;
  onSelectAllInGroup?: (groupKey: string, groupItems: Client[]) => void;
}

const CollapsableTable: React.FC<CollapsableTableProps> = ({
  titlesTable,
  data,
  renderRow,
  emptyMessage = "No results found",
  loading = false,
  className = "",
  orderBy = "",
  orderDirection = "ASC",
  onOrderChange,
  showCheckBoxes,
  selectedItems,
  onItemSelection,
  onSelectAllInGroup,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const toggleCollapse = (group: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleOrderChange = (key: string) => {
    if (!onOrderChange) return;

    let direction: "ASC" | "DESC" = "ASC";
    if (orderBy === key && orderDirection === "ASC") {
      direction = "DESC";
    }

    onOrderChange(key, direction);
  };

  const isGroupAllSelected = (groupItems: Client[]) => {
    if (!selectedItems || selectedItems.length === 0) return false;
    if (!groupItems || groupItems.length === 0) return false;

    const selectedIds = new Set(selectedItems.map((item) => item.id));

    return groupItems.every((item) => item.id && selectedIds.has(item.id));
  };

  const toggleSelectAllInGroup = (groupKey: string, groupItems: Client[]) => {
    if (onSelectAllInGroup) {
      onSelectAllInGroup(groupKey, groupItems);
    }
  };

  const handleItemSelection = (
    groupKey: string,
    item: Client,
    selected: boolean
  ) => {
    if (onItemSelection && item.id) {
      onItemSelection(groupKey, item.id, selected);
    }
  };

  const renderGroupSection = (
    groupKey: string,
    label: string,
    showCheckBoxes: boolean
  ) => {
    const groupItems = data[groupKey] || [];
    const isCollapsed = collapsedGroups[groupKey] || false;

    if (groupItems.length === 0) return null;

    const groupAllSelected = isGroupAllSelected(groupItems);

    return (
      <React.Fragment key={groupKey}>
        <tr className={style.collapsableTable_groupRow}>
          <td
            colSpan={titlesTable.length}
            className={`${style.collapsableTable_groupCell} ${
              isCollapsed ? style.collapsableTable_groupCell_collapsed : ""
            }`}
          >
            <div className={style.collapsableTable_groupContentContainer}>
              <div className="flex items-center mr-2">
                {showCheckBoxes && (
                  <Checkbox
                    checked={groupAllSelected}
                    onChange={() => {
                      toggleSelectAllInGroup(groupKey, groupItems);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className={style.collapsableTable_checkbox}
                    indeterminate={
                      !groupAllSelected &&
                      selectedItems !== undefined &&
                      selectedItems.some((selected) =>
                        groupItems.some((item) => item.id === selected.id)
                      )
                    }
                  />
                )}
              </div>
              <span
                onClick={() => toggleCollapse(groupKey)}
                className={`${style.collapsableTable_groupContent} cursor-pointer w-full select-none`}
              >
                <div className="flex items-center gap-2 text-sm font-bold uppercase">
                  {label} ({groupItems.length})
                  <CaretIcon
                    color="currentColor"
                    className={style.collapsableTable_caretIcon}
                    direction={isCollapsed ? "down" : "up"}
                    size={16}
                  />
                </div>
              </span>
            </div>
          </td>
        </tr>
        {!isCollapsed && (
          <>
            {groupItems.map((item, index) =>
              renderRow(
                item,
                index,
                selectedItems
                  ? selectedItems.some((selected) => selected.id === item.id)
                  : false,
                (selected) => handleItemSelection(groupKey, item, selected)
              )
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  const hasData = data && Object.keys(data).length > 0;

  return (
    <div
      className={`${style.collapsableTable_container} ${className} custom-scrollbar`}
    >
      {hasData && !loading ? (
        <table className={style.collapsableTable_element}>
          <thead className={style.collapsableTable_header}>
            <tr className={style.collapsableTable_headerRow}>
              {titlesTable.map((title, index) => (
                <th
                  key={index}
                  className={`${style.collapsableTable_headerCell} ${
                    title.className || ""
                  }`}
                  style={{
                    minWidth: title.minWidth || "",
                    maxWidth: title.maxWidth || "",
                  }}
                >
                  <span className={style.collapsableTable_headerText}>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={style.collapsableTable_body}>
            {Object.keys(data).map((groupKey) =>
              renderGroupSection(groupKey, groupKey, showCheckBoxes!)
            )}
          </tbody>
        </table>
      ) : (
        <div className="text-center p-4 text-gray-500">
          {loading ? <LoadingSpinner /> : emptyMessage}
        </div>
      )}
    </div>
  );
};

export default CollapsableTable;
