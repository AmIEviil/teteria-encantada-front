import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import CloseIcon from "@mui/icons-material/Close";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import { FloorPlan } from "../components/teaRoom/FloorPlan/FloorPlan";
import { OrderTaker } from "../components/teaRoom/components/OrderTaker/OrderTaker";
import {
  useReservationsQuery,
  useUpdateReservationMutation,
} from "../core/api/reservations.hooks";
import type { Reservation } from "../core/api/types";
import "./TeaRoomView.css";

const DEFAULT_WAITING_WINDOW_MS = 15 * 60 * 1000;

const normalizeMesaLabel = (tableLabel?: string | null, tableCode?: string): string => {
  const source = (tableLabel || tableCode || "").trim().toUpperCase();
  const numberMatch = /MESA[_\-\s]?(\d+)/.exec(source)?.[1];

  if (!numberMatch) {
    return source || "MESA";
  }

  return `MESA_${Number.parseInt(numberMatch, 10)}`;
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getReservationDeadline = (reservation: Reservation): Date => {
  if (reservation.waitingUntil) {
    return new Date(reservation.waitingUntil);
  }

  const reservedFor = new Date(reservation.reservedFor);
  return new Date(reservedFor.getTime() + DEFAULT_WAITING_WINDOW_MS);
};

export const TeaRoomView = () => {
  const [selectedOrderTableId, setSelectedOrderTableId] = useState<string>("__NO_TABLE__");
  const [isWideFloorPlanMode, setIsWideFloorPlanMode] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  const isCompactViewport = useMediaQuery("(max-width: 1080px)");
  const isPhoneViewport = useMediaQuery("(max-width: 680px)");
  const effectiveWideFloorPlanMode = isCompactViewport || isWideFloorPlanMode;

  const { data: activeReservations = [], refetch: refetchActiveReservations } = useReservationsQuery({
    status: "ACTIVE",
  });
  const updateReservationMutation = useUpdateReservationMutation();

  const expiredReservations = useMemo(() => {
    if (nowMs <= 0) {
      return [];
    }

    return activeReservations
      .filter((reservation) => getReservationDeadline(reservation).getTime() < nowMs)
      .sort(
        (left, right) =>
          getReservationDeadline(left).getTime() - getReservationDeadline(right).getTime(),
      );
  }, [activeReservations, nowMs]);

  const expiredReservation = expiredReservations[0] ?? null;

  const expirationDelayMinutes = useMemo(() => {
    if (!expiredReservation) {
      return 0;
    }

    const deadline = getReservationDeadline(expiredReservation).getTime();
    return Math.max(0, Math.floor((nowMs - deadline) / 60000));
  }, [expiredReservation, nowMs]);

  useEffect(() => {
    const tick = () => {
      setNowMs(Date.now());
      void refetchActiveReservations();
    };

    tick();
    const intervalId = globalThis.setInterval(tick, 30000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [refetchActiveReservations]);

  useEffect(() => {
    if (!isCompactViewport) {
      return;
    }

    setIsOrderModalOpen(false);
  }, [isCompactViewport]);

  const handleSelectTable = (tableId: string) => {
    setSelectedOrderTableId(tableId);

    if (effectiveWideFloorPlanMode) {
      setIsOrderModalOpen(true);
    }
  };

  const handleTableSelectedFromOrderTaker = (tableId: string) => {
    setSelectedOrderTableId(tableId);
  };

  const handleToggleViewMode = () => {
    if (isCompactViewport) {
      return;
    }

    setIsWideFloorPlanMode((previousMode) => {
      const nextMode = !previousMode;

      if (!nextMode) {
        setIsOrderModalOpen(false);
      }

      return nextMode;
    });
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
  };

  const handleOpenOrderModal = () => {
    setIsOrderModalOpen(true);
  };

  const handleExtendReservationWait = async () => {
    if (!expiredReservation) {
      return;
    }

    const currentDeadline = getReservationDeadline(expiredReservation).getTime();
    const extensionBase = Math.max(currentDeadline, Date.now());

    await updateReservationMutation.mutateAsync({
      id: expiredReservation.id,
      payload: {
        waitingUntil: new Date(extensionBase + DEFAULT_WAITING_WINDOW_MS).toISOString(),
      },
    });
    void refetchActiveReservations();
  };

  const handleCancelReservation = async () => {
    if (!expiredReservation) {
      return;
    }

    await updateReservationMutation.mutateAsync({
      id: expiredReservation.id,
      payload: {
        status: "CANCELLED",
      },
    });
    void refetchActiveReservations();
  };

  const isResolvingExpiredReservation = updateReservationMutation.isPending;

  return (
    <div className={`teaRoomView ${isCompactViewport ? "teaRoomView--compact" : ""}`}>
      <div className={`teaRoomGrid ${effectiveWideFloorPlanMode ? "teaRoomGrid--wide" : ""}`}>
        <div className="teaRoomGrid__floorPlan">
          <FloorPlan
            selectedTableId={selectedOrderTableId}
            onSelectTable={handleSelectTable}
            isWideMode={effectiveWideFloorPlanMode}
          />
        </div>

        {!effectiveWideFloorPlanMode && (
          <div className="teaRoomGrid__orderTaker">
            <OrderTaker
              selectedTableId={selectedOrderTableId}
              onTableSelected={handleTableSelectedFromOrderTaker}
            />
          </div>
        )}
      </div>

      <Dialog
        open={effectiveWideFloorPlanMode && isOrderModalOpen}
        onClose={handleCloseOrderModal}
        maxWidth="lg"
        fullWidth
        fullScreen={isPhoneViewport}
        slotProps={{
          paper: {
            className: "teaRoomOrderDialogPaper",
          },
        }}
      >
        <DialogTitle className="teaRoomModalTitle">
          Gestionar orden
          <IconButton onClick={handleCloseOrderModal} aria-label="Cerrar modal de orden">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="teaRoomModalContent">
          <OrderTaker
            selectedTableId={selectedOrderTableId}
            onTableSelected={handleTableSelectedFromOrderTaker}
            isModal
          />
        </DialogContent>
      </Dialog>

      {isCompactViewport ? (
        <Button
          variant="contained"
          className="teaRoomModeToggleButton teaRoomModeToggleButton--mobile"
          onClick={handleOpenOrderModal}
          startIcon={<PointOfSaleIcon />}
        >
          Panel de ordenes
        </Button>
      ) : (
        <Tooltip
          title={isWideFloorPlanMode ? "Cambiar a vista dividida" : "Cambiar a pantalla grande"}
          arrow
        >
          <Button
            variant="contained"
            className="teaRoomModeToggleButton"
            onClick={handleToggleViewMode}
            startIcon={isWideFloorPlanMode ? <ViewSidebarIcon /> : <OpenInFullIcon />}
          >
            {isWideFloorPlanMode ? "Vista dividida" : "Pantalla grande"}
          </Button>
        </Tooltip>
      )}

      <Dialog
        open={Boolean(expiredReservation)}
        onClose={() => undefined}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        fullScreen={isPhoneViewport}
      >
        <DialogTitle className="teaRoomExpiredDialogTitle">Reserva vencida</DialogTitle>
        <DialogContent dividers className="teaRoomExpiredDialogContent">
          {expiredReservation && (
            <Stack spacing={1}>
              <Typography variant="body1" fontWeight={600}>
                {normalizeMesaLabel(
                  expiredReservation.table?.label,
                  expiredReservation.table?.code,
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Titular: {expiredReservation.holderName || "Sin titular"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hora reserva: {formatDateTime(expiredReservation.reservedFor)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Se supero la espera de 15 minutos hace {expirationDelayMinutes} min.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions className="teaRoomExpiredDialogActions">
          <Button
            variant="outlined"
            onClick={handleExtendReservationWait}
            disabled={isResolvingExpiredReservation}
          >
            Esperar 15 min mas
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelReservation}
            disabled={isResolvingExpiredReservation}
          >
            Aceptar y cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
