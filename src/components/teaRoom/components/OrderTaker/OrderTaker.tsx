import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import {
  useCreateOrderMutation,
  useOrdersQuery,
  useUpdateOrderMutation,
} from "../../../../core/api/orders.hooks";
import { useReservationsQuery } from "../../../../core/api/reservations.hooks";
import type { Order, Reservation, TableStatus } from "../../../../core/api/types";
import { useProductsQuery } from "../../../../core/api/products.hooks";
import { useTablesQuery } from "../../../../core/api/tables.hooks";
import { useSnackBarResponseStore } from "../../../../store/snackBarStore";
import CustomPagination from "../../../ui/pagination/Pagination";
import CaretIcon from "../../../ui/icons/CaretIcon";
import "./OrderTaker.css";

interface OrderItemDraft {
  key: string;
  productId: string;
  quantity: number;
  notes: string;
}

const NO_TABLE_VALUE = "__NO_TABLE__";
const DEFAULT_RESERVATION_WAIT_WINDOW_MS = 15 * 60 * 1000;

type OrderOrigin = "DIRECT" | "RESERVATION";

const sanitizeInteger = (value: number, min = 1) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.round(value));
};

const buildOrderItem = (): OrderItemDraft => ({
  key: crypto.randomUUID(),
  productId: "",
  quantity: 1,
  notes: "",
});

const normalizeMesaLabel = (tableLabel?: string | null, tableCode?: string) => {
  const source = (tableLabel || tableCode || "").trim().toUpperCase();
  const numberMatch = /MESA[_\-\s]?(\d+)/.exec(source)?.[1];

  if (!numberMatch) {
    return source || "MESA";
  }

  return `MESA_${Number.parseInt(numberMatch, 10)}`;
};

const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  AVAILABLE: "Habilitada",
  OCCUPIED: "Ocupada",
  RESERVED: "Reservada",
  OUT_OF_SERVICE: "No disponible",
};

const ORDER_STATUS_LABELS: Record<Order["status"], string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  SERVED: "Servida",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

const CLOSED_ORDER_STATUSES = new Set<Order["status"]>(["PAID", "CANCELLED"]);
const ORDER_CARD_BASE_HEIGHT_PX = 194;
const ORDER_CARD_ITEM_ROW_HEIGHT_PX = 34;
const ORDER_CARD_NOTE_HEIGHT_PX = 16;
const ORDER_DAY_PAGE_MAX_HEIGHT_PX = 560;

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const toSafeTimestamp = (value: string) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const isSameCalendarDay = (value: string, referenceMs: number) => {
  const targetDate = new Date(value);

  if (!Number.isFinite(targetDate.getTime())) {
    return false;
  }

  const referenceDate = new Date(referenceMs);
  return (
    targetDate.getFullYear() === referenceDate.getFullYear()
    && targetDate.getMonth() === referenceDate.getMonth()
    && targetDate.getDate() === referenceDate.getDate()
  );
};

const estimateOrderCardHeight = (order: Order): number => {
  const itemRows = Math.max(1, order.items.length);
  const noteRows = order.items.reduce(
    (accumulator, item) => accumulator + (item.notes ? 1 : 0),
    0,
  );

  return (
    ORDER_CARD_BASE_HEIGHT_PX
    + itemRows * ORDER_CARD_ITEM_ROW_HEIGHT_PX
    + noteRows * ORDER_CARD_NOTE_HEIGHT_PX
  );
};

const buildDayOrderPages = (orders: Order[]): Order[][] => {
  if (orders.length === 0) {
    return [];
  }

  const pages: Order[][] = [];
  let currentPage: Order[] = [];
  let currentPageHeight = 0;

  for (const order of orders) {
    const orderHeight = estimateOrderCardHeight(order);

    if (currentPage.length === 0) {
      currentPage = [order];
      currentPageHeight = orderHeight;
      continue;
    }

    const canAddSecondCard = currentPage.length < 2;
    const fitsByHeight = currentPageHeight + orderHeight <= ORDER_DAY_PAGE_MAX_HEIGHT_PX;

    if (canAddSecondCard && fitsByHeight) {
      currentPage.push(order);
      currentPageHeight += orderHeight;
      continue;
    }

    pages.push(currentPage);
    currentPage = [order];
    currentPageHeight = orderHeight;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
};

const getReservationWaitingDeadline = (reservation: Reservation): Date => {
  if (reservation.waitingUntil) {
    return new Date(reservation.waitingUntil);
  }

  const reservationStart = new Date(reservation.reservedFor);
  return new Date(reservationStart.getTime() + DEFAULT_RESERVATION_WAIT_WINDOW_MS);
};

const getEligibleReservations = (
  reservations: Reservation[],
  nowMs: number,
): Reservation[] => {
  if (nowMs <= 0) {
    return [];
  }

  return reservations
    .filter((reservation) => {
      const startTime = new Date(reservation.reservedFor).getTime();
      const deadlineTime = getReservationWaitingDeadline(reservation).getTime();

      return Number.isFinite(startTime) && Number.isFinite(deadlineTime) && nowMs >= startTime && nowMs <= deadlineTime;
    })
    .sort(
      (left, right) =>
        new Date(left.reservedFor).getTime() - new Date(right.reservedFor).getTime(),
    );
};

const getUpcomingReservations = (
  reservations: Reservation[],
  nowMs: number,
): Reservation[] => {
  if (nowMs <= 0) {
    return [];
  }

  return reservations
    .filter((reservation) => new Date(reservation.reservedFor).getTime() > nowMs)
    .sort(
      (left, right) =>
        new Date(left.reservedFor).getTime() - new Date(right.reservedFor).getTime(),
    );
};

const resolveEffectiveOrderOrigin = (
  isTableSelected: boolean,
  orderOrigin: OrderOrigin,
  eligibleReservationsLength: number,
): OrderOrigin => {
  if (!isTableSelected || eligibleReservationsLength === 0) {
    return "DIRECT";
  }

  return orderOrigin;
};

const resolveEffectiveReservationId = (
  effectiveOrderOrigin: OrderOrigin,
  eligibleReservations: Reservation[],
  selectedReservationId: string,
): string => {
  if (effectiveOrderOrigin !== "RESERVATION") {
    return "";
  }

  const selectedReservationIsValid = eligibleReservations.some(
    (reservation) => reservation.id === selectedReservationId,
  );

  if (selectedReservationIsValid) {
    return selectedReservationId;
  }

  return eligibleReservations[0]?.id ?? "";
};

interface OrderTakerProps {
  selectedTableId?: string;
  onTableSelected?: (tableId: string) => void;
  isModal?: boolean;
}

interface NumericStepperProps {
  label: string;
  value: number;
  min?: number;
  maxWidth?: number;
  onChange: (value: number) => void;
}

const NumericStepper = ({
  label,
  value,
  min = 1,
  maxWidth = 200,
  onChange,
}: NumericStepperProps) => {
  const handleInputValueChange = (rawValue: string) => {
    if (rawValue.trim() === "") {
      onChange(min);
      return;
    }

    onChange(sanitizeInteger(Number(rawValue), min));
  };

  return (
    <Stack spacing={0.75} sx={{ width: "100%", maxWidth }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          type="button"
          variant="outlined"
          className="orderTakerStepperButton"
          onClick={() => onChange(sanitizeInteger(value - 1, min))}
          aria-label={`Reducir ${label.toLowerCase()}`}
        >
          -
        </Button>
        <TextField
          type="number"
          value={sanitizeInteger(value, min)}
          onChange={(event) => handleInputValueChange(event.target.value)}
          className="orderTakerNumberInput"
          size="small"
          fullWidth
          slotProps={{
            htmlInput: {
              min,
              step: 1,
              inputMode: "numeric",
            },
          }}
        />
        <Button
          type="button"
          variant="outlined"
          className="orderTakerStepperButton"
          onClick={() => onChange(sanitizeInteger(value + 1, min))}
          aria-label={`Aumentar ${label.toLowerCase()}`}
        >
          +
        </Button>
      </Stack>
    </Stack>
  );
};

interface OrderHistorySectionProps {
  isNoTableSelected: boolean;
  isTableSelected: boolean;
  loadingOrders: boolean;
  isSubmitting: boolean;
  visibleOrders: Order[];
  nowMs: number;
  formatCurrency: (amount: number) => string;
  onMarkOrderAsPaid: (orderId: string) => void;
}

const OrderHistorySection = ({
  isNoTableSelected,
  isTableSelected,
  loadingOrders,
  isSubmitting,
  visibleOrders,
  nowMs,
  formatCurrency,
  onMarkOrderAsPaid,
}: OrderHistorySectionProps) => {
  const [isDayOrdersExpanded, setIsDayOrdersExpanded] = useState(false);
  const [dayOrdersPage, setDayOrdersPage] = useState(1);

  const sortedVisibleOrders = useMemo(() => {
    return [...visibleOrders].sort(
      (left, right) => toSafeTimestamp(right.createdAt) - toSafeTimestamp(left.createdAt),
    );
  }, [visibleOrders]);

  const latestActiveOrder = useMemo(() => {
    return (
      sortedVisibleOrders.find((order) => !CLOSED_ORDER_STATUSES.has(order.status)) ?? null
    );
  }, [sortedVisibleOrders]);

  const dayOrders = useMemo(() => {
    return sortedVisibleOrders.filter((order) => isSameCalendarDay(order.createdAt, nowMs));
  }, [nowMs, sortedVisibleOrders]);

  const dayOrderPages = useMemo(() => buildDayOrderPages(dayOrders), [dayOrders]);
  const totalDayOrderPages = Math.max(1, dayOrderPages.length);

  const paginatedDayOrders = useMemo(() => {
    return dayOrderPages[dayOrdersPage - 1] ?? [];
  }, [dayOrderPages, dayOrdersPage]);

  useEffect(() => {
    setDayOrdersPage(1);
  }, [dayOrderPages.length]);

  useEffect(() => {
    if (latestActiveOrder) {
      setIsDayOrdersExpanded(false);
    }
  }, [latestActiveOrder]);

  const renderOrderCard = (order: Order) => {
    const isPaidOrder = order.status === "PAID";

    return (
      <Paper key={order.id} variant="outlined" className="orderTakerOrderCard" sx={{ p: 1.5 }}>
        <Stack spacing={1.2}>
          <Box className="orderTakerOrderCardHeader">
            <Typography fontWeight={600}>Orden #{order.id.slice(0, 8)}</Typography>
            <Typography
              component="span"
              className={`orderTakerStatusBadge ${isPaidOrder ? "orderTakerStatusBadge--paid" : "orderTakerStatusBadge--unpaid"}`}
            >
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </Typography>
          </Box>

          <Box className="orderTakerOrderMetaRow">
            <Typography variant="body2">Personas: {order.peopleCount ?? 1}</Typography>
            <Typography variant="body2">Fecha/Hora: {formatDateTime(order.createdAt)}</Typography>
          </Box>

          <Box className="orderTakerOrderCardBody">
            <Box component="table" className="orderTakerItemsTable">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="orderTakerItemsTable__empty">
                      Sin items
                    </td>
                  </tr>
                ) : (
                  order.items.map((item) => (
                    <tr key={item.id || `${order.id}-${item.productId}`}>
                      <td>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">
                            {item.product?.name || item.productId}
                          </Typography>
                          {item.notes && (
                            <Typography variant="caption" color="text.secondary">
                              Nota: {item.notes}
                            </Typography>
                          )}
                        </Stack>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Box>
          </Box>

          <Box className="orderTakerOrderCardFooter">
            <Typography variant="body2" fontWeight={700}>
              TOTAL: {formatCurrency(order.total)}
            </Typography>
          </Box>

          {!CLOSED_ORDER_STATUSES.has(order.status) && (
            <Box className="orderTakerOrderCardActions">
              <Button
                variant="outlined"
                className="orderTakerPaidButton"
                onClick={() => onMarkOrderAsPaid(order.id)}
              >
                Marcar Pagada
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="h6" mb={1}>
        {isNoTableSelected ? "Ordenes sin mesa" : "Ordenes de la Mesa"}
      </Typography>

      {!isNoTableSelected && !isTableSelected && (
        <Typography variant="body2" color="text.secondary">
          Selecciona una mesa para ver sus ordenes
        </Typography>
      )}

      {(loadingOrders || isSubmitting) && (
        <Box display="flex" justifyContent="center" py={1}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loadingOrders && sortedVisibleOrders.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {isNoTableSelected ? "No hay ordenes sin mesa" : "No hay ordenes para esta mesa"}
        </Typography>
      )}

      {!loadingOrders && sortedVisibleOrders.length > 0 && (
        <Stack spacing={1}>
          {isNoTableSelected && sortedVisibleOrders.map((order) => renderOrderCard(order))}

          {!isNoTableSelected && latestActiveOrder && renderOrderCard(latestActiveOrder)}

          {!isNoTableSelected && !latestActiveOrder && (
            <>
              <Button
                variant="text"
                onClick={() => setIsDayOrdersExpanded((previousState) => !previousState)}
                className="orderTakerDayOrdersToggle"
                endIcon={
                  <CaretIcon
                    direction={isDayOrdersExpanded ? "down" : "right"}
                    size={10}
                    color="#4e5d39"
                  />
                }
              >
                Ver ordenes del dia
              </Button>

              {isDayOrdersExpanded && (
                <Stack spacing={1}>
                  {paginatedDayOrders.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No hay ordenes del dia para mostrar.
                    </Typography>
                  )}

                  {paginatedDayOrders.map((order) => renderOrderCard(order))}

                  {dayOrderPages.length > 1 && (
                    <Box display="flex" justifyContent="center" pt={0.5}>
                      <CustomPagination
                        actualPage={dayOrdersPage}
                        totalPages={totalDayOrderPages}
                        disabled={loadingOrders || isSubmitting}
                        onPageChange={setDayOrdersPage}
                      />
                    </Box>
                  )}
                </Stack>
              )}
            </>
          )}
        </Stack>
      )}
    </Box>
  );
};

export const OrderTaker = ({
  selectedTableId: selectedTableIdProp,
  onTableSelected,
  isModal = false,
}: OrderTakerProps) => {
  const isCompactViewport = useMediaQuery("(max-width: 1080px)");
  const { data: tables, isLoading: loadingTables } = useTablesQuery();
  const {
    data: products,
    isLoading: loadingProducts,
    refetch: refetchProducts,
  } = useProductsQuery();
  const createOrderMutation = useCreateOrderMutation();
  const updateOrderMutation = useUpdateOrderMutation();

  const [internalSelectedTableId, setInternalSelectedTableId] = useState<string>(
    NO_TABLE_VALUE,
  );
  const [peopleCountOverrides, setPeopleCountOverrides] = useState<Record<string, number>>({
    [NO_TABLE_VALUE]: 1,
  });
  const [orderNotes, setOrderNotes] = useState("");
  const [items, setItems] = useState<OrderItemDraft[]>([buildOrderItem()]);
  const [orderOrigin, setOrderOrigin] = useState<OrderOrigin>("DIRECT");
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const selectedTableId = selectedTableIdProp ?? internalSelectedTableId;

  const safeTables = useMemo(() => (Array.isArray(tables) ? tables : []), [tables]);

  const activeProducts = useMemo(
    () => (Array.isArray(products) ? products : []).filter((product) => product.isActive),
    [products],
  );

  const productsMap = useMemo(
    () => new Map(activeProducts.map((product) => [product.id, product])),
    [activeProducts],
  );

  const isNoTableSelected = selectedTableId === NO_TABLE_VALUE;
  const isTableSelected = Boolean(selectedTableId) && !isNoTableSelected;

  const { data: tableOrders, isLoading: loadingOrders } = useOrdersQuery({
    tableId: isTableSelected ? selectedTableId : undefined,
    enabled: isNoTableSelected || isTableSelected,
  });

  const visibleOrders = useMemo(() => {
    const orders = Array.isArray(tableOrders) ? tableOrders : [];

    if (isNoTableSelected) {
      return orders.filter((order) => !order.tableId);
    }

    return orders;
  }, [tableOrders, isNoTableSelected]);

  const hasValidItem = items.some((item) => item.productId);

  const estimatedTotal = useMemo(() => {
    return items.reduce((accumulator, item) => {
      const product = productsMap.get(item.productId);

      if (!product) {
        return accumulator;
      }

      return accumulator + product.price * item.quantity;
    }, 0);
  }, [items, productsMap]);

  const selectedTable = isTableSelected
    ? safeTables.find((table) => table.id === selectedTableId)
    : undefined;

  const { data: reservations = [], isLoading: loadingReservations } = useReservationsQuery(
    {
      tableId: isTableSelected ? selectedTableId : undefined,
      status: "ACTIVE",
    },
    isTableSelected,
  );

  const tableActiveReservations = useMemo(() => {
    return isTableSelected && Array.isArray(reservations) ? reservations : [];
  }, [isTableSelected, reservations]);

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, []);

  const eligibleReservations = useMemo(() => {
    return getEligibleReservations(tableActiveReservations, nowMs);
  }, [nowMs, tableActiveReservations]);

  const upcomingReservations = useMemo(() => {
    return getUpcomingReservations(tableActiveReservations, nowMs);
  }, [nowMs, tableActiveReservations]);

  const selectedTableStatus = selectedTable?.status ?? "AVAILABLE";
  const isSelectedTableUnavailable = selectedTableStatus === "OUT_OF_SERVICE";
  const effectiveOrderOrigin = resolveEffectiveOrderOrigin(
    isTableSelected,
    orderOrigin,
    eligibleReservations.length,
  );
  const effectiveSelectedReservationId = resolveEffectiveReservationId(
    effectiveOrderOrigin,
    eligibleReservations,
    selectedReservationId,
  );
  const isReservationOrigin = isTableSelected && effectiveOrderOrigin === "RESERVATION";
  const selectedReservation = isReservationOrigin
    ? eligibleReservations.find(
        (reservation) => reservation.id === effectiveSelectedReservationId,
      )
    : undefined;
  const canSubmit =
    hasValidItem &&
    !isSelectedTableUnavailable &&
    (!isReservationOrigin || Boolean(selectedReservation));
  const selectedTableKey = isTableSelected ? selectedTableId : NO_TABLE_VALUE;
  const defaultPeopleCount = sanitizeInteger(selectedTable ? selectedTable.capacity : 1);
  const peopleCount = sanitizeInteger(
    peopleCountOverrides[selectedTableKey] ?? defaultPeopleCount,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, buildOrderItem()]);
  };

  const handleDeleteItem = (key: string) => {
    setItems((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter((item) => item.key !== key);
    });
  };

  const updateItem = <K extends keyof Omit<OrderItemDraft, "key">>(
    key: string,
    field: K,
    value: OrderItemDraft[K],
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const handleCreateOrder = async () => {
    const normalizedItems = items
      .filter((item) => item.productId)
      .map((item) => ({
        productId: item.productId,
        quantity: sanitizeInteger(item.quantity),
        notes: item.notes.trim() || undefined,
      }));

    const latestProductsResult = await refetchProducts();
    const latestProducts = Array.isArray(latestProductsResult.data)
      ? latestProductsResult.data
      : [];

    const requestedQuantitiesByProduct = normalizedItems.reduce<Map<string, number>>(
      (accumulator, item) => {
        const currentQuantity = accumulator.get(item.productId) ?? 0;
        accumulator.set(item.productId, currentQuantity + item.quantity);
        return accumulator;
      },
      new Map<string, number>(),
    );

    const productsById = new Map(latestProducts.map((product) => [product.id, product]));
    const insufficientProducts = [...requestedQuantitiesByProduct.entries()]
      .map(([productId, requiredQuantity]) => {
        const product = productsById.get(productId);
        const stock = product?.currentQuantity ?? 0;

        return {
          productName: product?.name ?? productId,
          requiredQuantity,
          stock,
          hasStock: stock >= requiredQuantity,
        };
      })
      .filter((entry) => !entry.hasStock);

    if (insufficientProducts.length > 0) {
      const stockMessage = insufficientProducts
        .map(
          (entry) =>
            `${entry.productName} (stock: ${entry.stock}, solicitado: ${entry.requiredQuantity})`,
        )
        .join(" | ");

      useSnackBarResponseStore
        .getState()
        .openSnackbar(`Stock insuficiente. ${stockMessage}`, "error", 5000);
      return;
    }

    await createOrderMutation.mutateAsync({
      tableId: isTableSelected ? selectedTableId : undefined,
      reservationId: selectedReservation?.id,
      peopleCount,
      notes: orderNotes.trim() || undefined,
      items: normalizedItems,
    });

    setItems([buildOrderItem()]);
    setOrderNotes("");
    setPeopleCountOverrides((previousState) => {
      const nextState = { ...previousState };
      delete nextState[selectedTableKey];
      nextState[NO_TABLE_VALUE] = 1;
      return nextState;
    });

    await refetchProducts();
  };

  const handleTableChange = (tableId: string) => {
    setOrderOrigin("DIRECT");
    setSelectedReservationId("");

    onTableSelected?.(tableId);
    setInternalSelectedTableId(tableId);
  };

  const handleMarkOrderAsPaid = async (orderId: string) => {
    await updateOrderMutation.mutateAsync({
      id: orderId,
      payload: {
        status: "PAID",
      },
    });
  };

  const isSubmitting = createOrderMutation.isPending || updateOrderMutation.isPending;

  return (
    <Paper
      className={`orderTakerPaper ${isModal ? "orderTakerPaper--modal" : ""}`}
      sx={{
        p: { xs: 1.5, sm: 2 },
        minHeight: isModal ? "auto" : "70vh",
        boxShadow: isModal ? "none" : undefined,
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={600}>
          Tomar Orden
        </Typography>

        <TextField
          select
          label="Mesa"
          value={selectedTableId}
          onChange={(event) => handleTableChange(event.target.value)}
          fullWidth
          disabled={loadingTables}
        >
          <MenuItem value={NO_TABLE_VALUE}>Consumo sin mesa</MenuItem>
          {safeTables.map((table) => (
            <MenuItem
              key={table.id}
              value={table.id}
              disabled={table.status === "OUT_OF_SERVICE"}
            >
              {normalizeMesaLabel(table.label, table.code)} ({TABLE_STATUS_LABELS[table.status]})
            </MenuItem>
          ))}
        </TextField>

        {selectedTable && (
          <Typography variant="body2" color="text.secondary">
            Capacidad: {selectedTable.capacity} personas | Estado: {TABLE_STATUS_LABELS[selectedTableStatus]}
          </Typography>
        )}

        {isTableSelected && (
          <Paper variant="outlined" sx={{ p: 1.25 }}>
            <Stack spacing={1}>
              <TextField
                select
                label="Origen de la orden"
                value={effectiveOrderOrigin}
                onChange={(event) =>
                  setOrderOrigin(event.target.value as OrderOrigin)
                }
                fullWidth
              >
                <MenuItem value="DIRECT">Otra orden (sin reserva)</MenuItem>
                <MenuItem
                  value="RESERVATION"
                  disabled={eligibleReservations.length === 0}
                >
                  Desde reserva activa
                </MenuItem>
              </TextField>

              {isReservationOrigin && (
                <TextField
                  select
                  label="Reserva activa"
                  value={effectiveSelectedReservationId}
                  onChange={(event) => setSelectedReservationId(event.target.value)}
                  fullWidth
                  disabled={eligibleReservations.length === 0}
                >
                  {eligibleReservations.map((reservation) => (
                    <MenuItem key={reservation.id} value={reservation.id}>
                      {`${formatDateTime(reservation.reservedFor)} | ${reservation.holderName || "Sin titular"} (${reservation.peopleCount} pers.)`}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {isReservationOrigin && selectedReservation && (
                <Typography variant="body2" color="text.secondary">
                  Se asociara esta orden a la reserva seleccionada para seguimiento de consumo.
                </Typography>
              )}

              {!loadingReservations && eligibleReservations.length === 0 && upcomingReservations.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  La proxima reserva de esta mesa inicia a las {formatDateTime(upcomingReservations[0].reservedFor)}.
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        {isSelectedTableUnavailable && (
          <Typography variant="body2" color="error">
            Esta mesa esta marcada como no disponible y no permite tomar ordenes.
          </Typography>
        )}

        <Box className="orderTakerPeopleAndNotesRow">
          <div className="orderTakerPeopleField">
            <NumericStepper
              label="Cantidad de personas"
              value={peopleCount}
              maxWidth={isCompactViewport ? 220 : 230}
              onChange={(value) =>
                setPeopleCountOverrides((previousState) => ({
                  ...previousState,
                  [selectedTableKey]: sanitizeInteger(value),
                }))
              }
            />
          </div>

          <TextField
            label="Notas de la orden"
            value={orderNotes}
            onChange={(event) => setOrderNotes(event.target.value)}
            className="orderTakerOrderNotesField"
            multiline
            minRows={2}
            size="small"
            fullWidth
          />
        </Box>

        <Paper variant="outlined" className="orderTakerItemsSection">
          <Stack spacing={1.2}>
            <Typography variant="subtitle1" fontWeight={700}>
              Productos de la orden
            </Typography>

            {items.map((item, index) => (
              <Paper key={item.key} variant="outlined" className="orderTakerItemCard">
                <Stack spacing={1.1}>
                  <Typography variant="subtitle2" className="orderTakerItemTitle">
                    Item {index + 1}
                  </Typography>

                  <Box className="orderTakerItemRow">
                    <TextField
                      select
                      label="Producto"
                      value={item.productId}
                      onChange={(event) =>
                        updateItem(item.key, "productId", event.target.value)
                      }
                      className="orderTakerProductSelect"
                      fullWidth
                      size="small"
                      disabled={loadingProducts}
                    >
                      {activeProducts.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name} - Stock: {product.currentQuantity}
                        </MenuItem>
                      ))}
                    </TextField>

                    <div className="orderTakerItemQuantity">
                      <NumericStepper
                        label="Cantidad"
                        value={item.quantity}
                        maxWidth={isCompactViewport ? 148 : 166}
                        onChange={(value) =>
                          updateItem(item.key, "quantity", sanitizeInteger(value))
                        }
                      />
                    </div>

                    <IconButton
                      className="orderTakerDangerButton orderTakerItemDeleteButton"
                      onClick={() => handleDeleteItem(item.key)}
                      disabled={items.length === 1}
                      aria-label={`Quitar item ${index + 1}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <TextField
                    label="Notas del item"
                    value={item.notes}
                    onChange={(event) => updateItem(item.key, "notes", event.target.value)}
                    size="small"
                    fullWidth
                  />
                </Stack>
              </Paper>
            ))}

            <Button
              variant="outlined"
              className="orderTakerAddItemButton"
              onClick={handleAddItem}
              startIcon={<AddIcon />}
            >
              Agregar Item
            </Button>
          </Stack>
        </Paper>

        <Typography fontWeight={600}>
          Total estimado: {" "}
          {formatCurrency(estimatedTotal)}
        </Typography>

        <Button
          variant="contained"
          className="orderTakerSubmitButton"
          startIcon={<PointOfSaleIcon />}
          disabled={!canSubmit || isSubmitting}
          onClick={handleCreateOrder}
        >
          Enviar Orden
        </Button>

        <OrderHistorySection
          isNoTableSelected={isNoTableSelected}
          isTableSelected={isTableSelected}
          loadingOrders={loadingOrders}
          isSubmitting={isSubmitting}
          visibleOrders={visibleOrders}
          nowMs={nowMs}
          formatCurrency={formatCurrency}
          onMarkOrderAsPaid={(orderId) => {
            void handleMarkOrderAsPaid(orderId);
          }}
        />
      </Stack>
    </Paper>
  );
};
