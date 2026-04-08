import { useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import TableGeneric from "../components/ui/table/Table";
import CustomPagination from "../components/ui/pagination/Pagination";
import { CustomCalendarV2 } from "../components/ui/calendar/CustomCalendarV2";
import { useOrdersReportQuery } from "../core/api/orders.hooks";
import { useTablesQuery } from "../core/api/tables.hooks";
import type {
  Order,
  OrderReportOrderDirection,
  OrderReportSortBy,
  OrderStatus,
} from "../core/api/types";
import "./SalesReportView.css";

type StatusFilter = OrderStatus | "ALL";

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Todas", value: "ALL" },
  { label: "Abierta", value: "OPEN" },
  { label: "En progreso", value: "IN_PROGRESS" },
  { label: "Servida", value: "SERVED" },
  { label: "Pagada", value: "PAID" },
  { label: "Cancelada", value: "CANCELLED" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  SERVED: "Servida",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

const formatDateForInput = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const parseInputDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const getCurrentMonthRange = (): { start: string; end: string } => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return {
    start: formatDateForInput(start),
    end: formatDateForInput(now),
  };
};

const normalizeTableLabel = (
  tableLabel?: string | null,
  tableCode?: string,
): string => {
  const source = (tableLabel || tableCode || "").trim().toUpperCase();
  const numberMatch = /MESA[_\-\s]?(\d+)/.exec(source)?.[1];

  if (!numberMatch) {
    return source || "SIN_MESA";
  }

  return `MESA_${Number.parseInt(numberMatch, 10)}`;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatMonthLabel = (month: string): string => {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);

  if (!year || !monthNumber) {
    return month;
  }

  const monthDate = new Date(Date.UTC(year, monthNumber - 1, 1));
  const label = new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(monthDate);

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

const tableTitles = [
  { label: "Fecha", key: "createdAt", showOrder: true },
  { label: "Mes", key: "month" },
  { label: "Mesa", key: "table", showOrder: true },
  { label: "Estado", key: "status", showOrder: true },
  { label: "Personas", key: "peopleCount", showOrder: true },
  { label: "Items", key: "items" },
  { label: "Total", key: "total", showOrder: true },
  { label: "Accion", key: "action" },
];

export const SalesReportView = () => {
  const defaultRange = getCurrentMonthRange();

  const [tableId, setTableId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("PAID");
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [orderBy, setOrderBy] = useState<OrderReportSortBy>("createdAt");
  const [orderDirection, setOrderDirection] =
    useState<OrderReportOrderDirection>("DESC");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: tables = [] } = useTablesQuery();

  const reportFilters = useMemo(
    () => ({
      tableId: tableId || undefined,
      status: status === "ALL" ? undefined : status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search.trim() || undefined,
      page,
      limit,
      orderBy,
      orderDirection,
    }),
    [tableId, status, startDate, endDate, search, page, limit, orderBy, orderDirection],
  );

  const { data: report, isLoading, isFetching } = useOrdersReportQuery({
    filters: reportFilters,
  });

  const currentOrders = report?.items ?? [];
  const monthlySummary = report?.monthlySummary ?? [];
  const totals = report?.totals;
  const totalPages = report?.pagination.totalPages ?? 1;

  const handleOrderChange = (key: string, direction: "ASC" | "DESC") => {
    const orderByMap: Record<string, OrderReportSortBy> = {
      createdAt: "createdAt",
      table: "table",
      status: "status",
      peopleCount: "peopleCount",
      total: "total",
    };

    const mappedOrderBy = orderByMap[key];

    if (!mappedOrderBy) {
      return;
    }

    setOrderBy(mappedOrderBy);
    setOrderDirection(direction);
    setPage(1);
  };

  const handleResetFilters = () => {
    const range = getCurrentMonthRange();
    setTableId("");
    setStatus("PAID");
    setStartDate(range.start);
    setEndDate(range.end);
    setSearch("");
    setPage(1);
    setLimit(10);
    setOrderBy("createdAt");
    setOrderDirection("DESC");
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={600}>
          Ventas por Mesa
        </Typography>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Filtros</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              select
              label="Mesa"
              value={tableId}
              onChange={(event) => {
                setTableId(event.target.value);
                setPage(1);
              }}
              fullWidth
            >
              <MenuItem value="">Todas las mesas</MenuItem>
              {tables.map((table) => (
                <MenuItem key={table.id} value={table.id}>
                  {normalizeTableLabel(table.label, table.code)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Estado"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
              fullWidth
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Buscar"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="ID, mesa o nota"
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <CustomCalendarV2
              label="Desde"
              initialDate={parseInputDate(startDate) ?? undefined}
              onSave={(value) => {
                setStartDate(value ? formatDateForInput(value) : "");
                setPage(1);
              }}
            />
            <CustomCalendarV2
              label="Hasta"
              initialDate={parseInputDate(endDate) ?? undefined}
              onSave={(value) => {
                setEndDate(value ? formatDateForInput(value) : "");
                setPage(1);
              }}
            />

            <TextField
              select
              label="Resultados por pagina"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              sx={{ minWidth: 220 }}
            >
              {ROWS_PER_PAGE_OPTIONS.map((rows) => (
                <MenuItem key={rows} value={rows}>
                  {rows}
                </MenuItem>
              ))}
            </TextField>

            <button className="secondary sales-reset-button" onClick={handleResetFilters}>
              Limpiar filtros
            </button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="h6">Resumen del periodo</Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
            <Box className="sales-kpi-card">
              <span>Total ordenes</span>
              <strong>{totals?.totalOrders ?? 0}</strong>
            </Box>
            <Box className="sales-kpi-card">
              <span>Ordenes pagadas</span>
              <strong>{totals?.paidOrders ?? 0}</strong>
            </Box>
            <Box className="sales-kpi-card">
              <span>Venta total</span>
              <strong>{formatCurrency(totals?.totalSales ?? 0)}</strong>
            </Box>
            <Box className="sales-kpi-card">
              <span>Venta pagada</span>
              <strong>{formatCurrency(totals?.paidSales ?? 0)}</strong>
            </Box>
          </Stack>

          <div className="sales-month-grid">
            {monthlySummary.map((summary) => (
              <article className="sales-month-card" key={summary.month}>
                <h3>{formatMonthLabel(summary.month)}</h3>
                <p>Ordenes: {summary.totalOrders}</p>
                <p>Pagadas: {summary.paidOrders}</p>
                <p>Canceladas: {summary.cancelledOrders}</p>
                <p>Venta total: {formatCurrency(summary.totalSales)}</p>
                <p>Venta pagada: {formatCurrency(summary.paidSales)}</p>
              </article>
            ))}

            {monthlySummary.length === 0 && (
              <Typography color="text.secondary">
                No hay resumen mensual para los filtros seleccionados.
              </Typography>
            )}
          </div>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Ordenes</Typography>
            {(isLoading || isFetching) && (
              <Typography color="text.secondary">Cargando...</Typography>
            )}
          </Stack>

          <TableGeneric
            titles={tableTitles}
            data={currentOrders}
            loading={isLoading || isFetching}
            textNotFound="No hay ordenes para estos filtros"
            orderBy={orderBy}
            orderDirection={orderDirection}
            onOrderChange={handleOrderChange}
            renderRow={(order) => {
              const totalItems = order.items.reduce(
                (accumulator, item) => accumulator + item.quantity,
                0,
              );

              return (
                <tr key={order.id}>
                  <td>{formatDateTime(order.createdAt)}</td>
                  <td>{formatMonthLabel(order.createdAt.slice(0, 7))}</td>
                  <td>{normalizeTableLabel(order.table?.label, order.table?.code)}</td>
                  <td>
                    <span className="sales-status-chip">
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td>{order.peopleCount}</td>
                  <td>{totalItems}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <button
                      className="secondary"
                      onClick={() => setSelectedOrder(order)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              );
            }}
          />

          <Stack direction="row" justifyContent="center">
            <CustomPagination
              actualPage={page}
              totalPages={totalPages}
              disabled={isLoading || isFetching}
              onPageChange={setPage}
            />
          </Stack>
        </Stack>
      </Paper>

      <Dialog
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Detalle de orden</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Stack spacing={1.5} mt={1}>
              <Typography>
                <strong>ID:</strong> {selectedOrder.id}
              </Typography>
              <Typography>
                <strong>Fecha:</strong> {formatDateTime(selectedOrder.createdAt)}
              </Typography>
              <Typography>
                <strong>Mesa:</strong>{" "}
                {normalizeTableLabel(
                  selectedOrder.table?.label,
                  selectedOrder.table?.code,
                )}
              </Typography>
              <Typography>
                <strong>Estado:</strong> {STATUS_LABEL[selectedOrder.status]}
              </Typography>
              <Typography>
                <strong>Personas:</strong> {selectedOrder.peopleCount}
              </Typography>
              <Typography>
                <strong>Total:</strong> {formatCurrency(selectedOrder.total)}
              </Typography>
              <Typography>
                <strong>Notas:</strong> {selectedOrder.notes || "-"}
              </Typography>

              <Typography variant="h6" mt={1}>
                Items
              </Typography>

              {selectedOrder.items.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Typography>
                    <strong>Producto:</strong> {item.product?.name || item.productId}
                  </Typography>
                  <Typography>
                    <strong>Cantidad:</strong> {item.quantity}
                  </Typography>
                  <Typography>
                    <strong>Precio unitario:</strong> {formatCurrency(item.unitPrice)}
                  </Typography>
                  <Typography>
                    <strong>Subtotal:</strong> {formatCurrency(item.subtotal)}
                  </Typography>
                  <Typography>
                    <strong>Nota:</strong> {item.notes || "-"}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <button className="secondary" onClick={() => setSelectedOrder(null)}>
            Cerrar
          </button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
