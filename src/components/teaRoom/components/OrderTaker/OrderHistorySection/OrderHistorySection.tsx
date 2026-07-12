import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { Order } from "../../../../../core/api/types";
import { formatDateTime } from "../../../../../utils/formatText.utils";
import type {
  OrderHistorySectionProps,
  OrderPaymentSelection,
} from "../../../../../service/teaRoom/orderTaker.interface";
import CustomPagination from "../../../../ui/pagination/Pagination";
import CaretIcon from "../../../../ui/icons/CaretIcon";
import { MarkOrderPaidModal } from "./MarkOrderPaidModal/MarkOrderPaidModal";

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

export const OrderHistorySection = ({
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
  const [orderPendingPayment, setOrderPendingPayment] = useState<Order | null>(null);

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

  // Reinicia a la primera página cuando cambia la cantidad de páginas.
  const [prevDayOrderPagesLength, setPrevDayOrderPagesLength] = useState(
    dayOrderPages.length,
  );
  if (prevDayOrderPagesLength !== dayOrderPages.length) {
    setPrevDayOrderPagesLength(dayOrderPages.length);
    setDayOrdersPage(1);
  }

  // Colapsa el historial cuando aparece una nueva orden activa.
  const [prevLatestActiveOrder, setPrevLatestActiveOrder] = useState(latestActiveOrder);
  if (prevLatestActiveOrder !== latestActiveOrder) {
    setPrevLatestActiveOrder(latestActiveOrder);
    if (latestActiveOrder) {
      setIsDayOrdersExpanded(false);
    }
  }

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
                onClick={() => setOrderPendingPayment(order)}
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

      <MarkOrderPaidModal
        order={orderPendingPayment}
        isSubmitting={isSubmitting}
        formatCurrency={formatCurrency}
        onClose={() => setOrderPendingPayment(null)}
        onConfirm={(payment: OrderPaymentSelection) => {
          if (orderPendingPayment) {
            onMarkOrderAsPaid(orderPendingPayment.id, payment);
          }
          setOrderPendingPayment(null);
        }}
      />
    </Box>
  );
};
