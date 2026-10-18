import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEventPurchaseDetailQuery } from "../../core/api/eventPurchases.hooks";
import { eventPurchasesService } from "../../core/api/eventPurchases.service";
import type { EventPurchaseRow } from "../../core/api/types";
import { PURCHASE_STATUS_LABEL } from "./purchaseStatus.constants";
import { formatCurrency, formatDateTime } from "../../utils/sales.utils";

const entradasLabel = (count: number): string =>
  `${count} ${count === 1 ? "entrada" : "entradas"}`;

const paymentLabel = (purchase: EventPurchaseRow): string => {
  if (purchase.mpPaymentId) {
    return `Pago MP ${purchase.mpPaymentId}`;
  }
  return `Manual · ${purchase.manualPaymentMethod ?? "-"}`;
};

interface EventPurchaseDetailDialogProps {
  purchaseId: string | null;
  onClose: () => void;
  onOpenPurchase: (id: string) => void;
}

export const EventPurchaseDetailDialog = ({
  purchaseId,
  onClose,
  onOpenPurchase,
}: EventPurchaseDetailDialogProps) => {
  const { data: detail, isLoading, isError } = useEventPurchaseDetailQuery(purchaseId);
  const [downloadErrorState, setDownloadErrorState] = useState<{
    id: string | null;
    message: string;
  }>({ id: null, message: "" });
  // El error pertenece a la compra en que ocurrió: al cambiar de compra desaparece.
  const downloadError =
    downloadErrorState.id === purchaseId ? downloadErrorState.message : "";
  const setDownloadError = (message: string) =>
    setDownloadErrorState({ id: purchaseId, message });

  const download = async (kind: "tickets" | "comprobante") => {
    if (!detail) return;
    setDownloadError("");
    try {
      await eventPurchasesService.downloadFile(detail.id, kind);
    } catch {
      setDownloadError("No se pudo descargar el archivo");
    }
  };

  const paidAt =
    detail?.paidAt ?? (detail?.status === "PAID" ? detail.createdAt : null);
  const paidLine = detail
    ? [
        paidAt ? formatDateTime(paidAt) : "No informado",
        detail.mpPaymentMethod,
        PURCHASE_STATUS_LABEL[detail.status],
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const attendeesLine = detail
    ? detail.attendees
        .map((a) =>
          a.ticketTypeName
            ? `${a.firstName} ${a.lastName} (${a.ticketTypeName})`
            : `${a.firstName} ${a.lastName}`,
        )
        .join(", ")
    : "";

  const downloadButton = (
    kind: "tickets" | "comprobante",
    label: string,
    available: boolean,
  ) => (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      useFlexGap
      flexWrap="wrap"
    >
      <button
        className="secondary"
        disabled={!available}
        onClick={() => void download(kind)}
      >
        {label}
      </button>
      {!available && (
        <Typography variant="caption" color="text.secondary">
          no archivado
        </Typography>
      )}
    </Stack>
  );

  return (
    <Dialog open={Boolean(purchaseId)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Detalle de compra</DialogTitle>
      <DialogContent>
        {isLoading && <Typography>Cargando...</Typography>}
        {isError && !detail && (
          <Typography color="error">No se pudo cargar el detalle</Typography>
        )}
        {detail && (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            mt={1}
            useFlexGap
          >
            <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              {detail.mpPaymentId ? (
                <Typography sx={{ wordBreak: "break-word" }}>
                  <strong>Pago MP</strong> {detail.mpPaymentId}
                </Typography>
              ) : (
                <Typography>
                  <strong>{`Manual · ${detail.manualPaymentMethod ?? "-"}`}</strong>
                </Typography>
              )}
              <Typography sx={{ wordBreak: "break-word" }}>
                <strong>Comprador:</strong>{" "}
                {detail.buyerDisplayName
                  ? `${detail.buyerDisplayName} (${detail.buyerEmail})`
                  : detail.buyerEmail}
              </Typography>
              <Typography>
                <strong>Id pagador MP:</strong>{" "}
                {detail.mpPayerId ?? "No informado"}
              </Typography>
              <Typography>
                <strong>Evento:</strong> {detail.eventTitle ?? "-"}
              </Typography>
              <Typography>
                <strong>Fecha pago:</strong>{" "}
                {paidLine}
              </Typography>
              <Typography>
                <strong>Total:</strong> {formatCurrency(detail.total)}
              </Typography>
              <Typography>
                <strong>Entradas:</strong>{" "}
                {attendeesLine || entradasLabel(detail.ticketsCount)}
              </Typography>

              <Stack spacing={1} pt={1}>
                {downloadButton(
                  "tickets",
                  "Descargar tickets (PDF)",
                  detail.hasTicketsFile,
                )}
                {downloadButton(
                  "comprobante",
                  "Descargar comprobante (PDF)",
                  detail.hasReceiptFile,
                )}
                {downloadError && (
                  <Typography color="error" variant="body2">
                    {downloadError}
                  </Typography>
                )}
              </Stack>
            </Stack>

            <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6">
                {`Otras compras de esta persona (${detail.otherPurchases.length})`}
              </Typography>
              {detail.otherPurchases.length === 0 && (
                <Typography color="text.secondary">
                  Sin otras compras
                </Typography>
              )}
              {detail.otherPurchases.map((other) => (
                <Paper key={other.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Typography variant="body2">
                    {`${formatDateTime(other.createdAt)} · ${other.eventTitle ?? "-"} · ${entradasLabel(other.ticketsCount)} · ${formatCurrency(other.total)} · ${PURCHASE_STATUS_LABEL[other.status]}`}
                  </Typography>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="caption" color="text.secondary">
                      {paymentLabel(other)}
                    </Typography>
                    <button
                      className="secondary"
                      onClick={() => onOpenPurchase(other.id)}
                    >
                      ver
                    </button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <button className="secondary" onClick={onClose}>
          Cerrar
        </button>
      </DialogActions>
    </Dialog>
  );
};
