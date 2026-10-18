import { useEffect, useMemo, useState } from "react";
import {
  Box,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import TableGeneric from "../../components/ui/table/Table";
import CustomPagination from "../../components/ui/pagination/Pagination";
import { CustomCalendarV2 } from "../../components/ui/calendar/CustomCalendarV2";
import { useEventPurchasesQuery } from "../../core/api/eventPurchases.hooks";
import { useEventsQuery } from "../../core/api/events.hooks";
import type { EventPurchaseStatus } from "../../core/api/types";
import {
  dateToKey,
  formatCurrency,
  formatDateTime,
} from "../../utils/sales.utils";
import { EventPurchaseDetailDialog } from "./EventPurchaseDetailDialog";
import { PURCHASE_STATUS_LABEL } from "./purchaseStatus.constants";

type StatusFilter = EventPurchaseStatus | "ALL";

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Todas", value: "ALL" },
  ...(Object.keys(PURCHASE_STATUS_LABEL) as EventPurchaseStatus[]).map(
    (value) => ({ label: PURCHASE_STATUS_LABEL[value], value }),
  ),
];

const SEARCH_DEBOUNCE_MS = 250;
const PAGE_LIMIT = 10;

const tableTitles = [
  { label: "Fecha", key: "createdAt" },
  { label: "Comprador", key: "buyer" },
  { label: "Evento", key: "event" },
  { label: "Entradas", key: "tickets" },
  { label: "Total", key: "total" },
  { label: "Estado", key: "status" },
  { label: "Accion", key: "action" },
];

export const EventPurchasesTab = () => {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("PAID");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: events = [] } = useEventsQuery();

  const filters = useMemo(
    () => ({
      search: search || undefined,
      eventId: eventId || undefined,
      status: status === "ALL" ? undefined : status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      limit: PAGE_LIMIT,
    }),
    [search, eventId, status, startDate, endDate, page],
  );

  const { data, isLoading, isFetching } = useEventPurchasesQuery(filters);
  const totals = data?.totals;

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Buscar"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Nombre o email del comprador"
            fullWidth
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              select
              label="Evento"
              value={eventId}
              onChange={(event) => {
                setEventId(event.target.value);
                setPage(1);
              }}
              fullWidth
            >
              <MenuItem value="">Todos los eventos</MenuItem>
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.title}
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
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <CustomCalendarV2
              label="Desde"
              onSave={(value) => {
                setStartDate(value ? dateToKey(value) : "");
                setPage(1);
              }}
            />
            <CustomCalendarV2
              label="Hasta"
              onSave={(value) => {
                setEndDate(value ? dateToKey(value) : "");
                setPage(1);
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} useFlexGap>
        <Box className="sales-kpi-card">
          <span>Compras</span>
          <strong>{totals?.totalPurchases ?? 0}</strong>
        </Box>
        <Box className="sales-kpi-card">
          <span>Pagadas</span>
          <strong>{totals?.paidPurchases ?? 0}</strong>
        </Box>
        <Box className="sales-kpi-card">
          <span>Total pagado</span>
          <strong>{formatCurrency(totals?.paidAmount ?? 0)}</strong>
        </Box>
      </Stack>

      <Paper sx={{ p: 2, minWidth: 0 }}>
        <Stack spacing={1.25}>
          <TableGeneric
            titles={tableTitles}
            data={data?.items ?? []}
            loading={isLoading || isFetching}
            textNotFound="No hay compras para estos filtros"
            renderRow={(purchase) => (
              <tr key={purchase.id}>
                <td>{formatDateTime(purchase.createdAt)}</td>
                <td>
                  <div>{purchase.buyerDisplayName ?? purchase.buyerEmail}</div>
                  {purchase.buyerDisplayName && (
                    <Typography variant="caption" color="text.secondary">
                      {purchase.buyerEmail}
                    </Typography>
                  )}
                </td>
                <td>{purchase.eventTitle ?? "-"}</td>
                <td>{purchase.ticketsCount}</td>
                <td>{formatCurrency(purchase.total)}</td>
                <td>
                  <span className="sales-status-chip">
                    {PURCHASE_STATUS_LABEL[purchase.status]}
                  </span>
                </td>
                <td>
                  <button
                    className="secondary"
                    onClick={() => setSelectedId(purchase.id)}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            )}
          />
          <Stack direction="row" justifyContent="center">
            <CustomPagination
              actualPage={page}
              totalPages={data?.pagination.totalPages ?? 1}
              disabled={isLoading || isFetching}
              onPageChange={setPage}
            />
          </Stack>
        </Stack>
      </Paper>

      <EventPurchaseDetailDialog
        purchaseId={selectedId}
        onClose={() => setSelectedId(null)}
        onOpenPurchase={setSelectedId}
      />
    </Stack>
  );
};
