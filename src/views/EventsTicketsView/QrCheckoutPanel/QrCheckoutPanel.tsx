import { useEffect, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { useCancelQrCheckoutMutation } from "../../../core/api/payments.hooks";
import { useRealtimeEventPurchase } from "../../../core/realtime/useRealtimeEventPurchase";
import type { EventPurchaseStatus, QrCheckout } from "../../../core/api/payments.types";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import { formatMoneyNumber } from "../../../utils/formatText.utils";

interface QrCheckoutPanelProps {
  eventId: string;
  checkout: QrCheckout;
  // Se llama una sola vez, cuando el cobro deja de estar pendiente.
  onSettled: (status: EventPurchaseStatus) => void;
}

const formatRemaining = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export const QrCheckoutPanel = ({
  eventId,
  checkout,
  onSettled,
}: QrCheckoutPanelProps) => {
  const openSnackbar = useSnackBarResponseStore((s) => s.openSnackbar);
  const cancelCheckout = useCancelQrCheckoutMutation();
  const [remainingMs, setRemainingMs] = useState(
    () => new Date(checkout.expiresAt).getTime() - Date.now(),
  );

  useRealtimeEventPurchase(checkout.purchaseId, (payload) => {
    onSettled(payload.status);
  });

  useEffect(() => {
    const expiresAt = new Date(checkout.expiresAt).getTime();
    const tick = () => setRemainingMs(expiresAt - Date.now());
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [checkout.expiresAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(checkout.checkoutUrl);
      openSnackbar("Link copiado", "success");
    } catch {
      openSnackbar("No se pudo copiar el link", "error");
    }
  };

  const handleCancel = async () => {
    const result = await cancelCheckout.mutateAsync({
      eventId,
      purchaseId: checkout.purchaseId,
    });
    onSettled(result.status);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5} alignItems="center">
        <Typography fontWeight={700} variant="h6">
          Cobro con MercadoPago
        </Typography>

        <Typography variant="body2" color="text.secondary">
          El cliente escanea este código con la cámara de su teléfono y paga en
          MercadoPago. Los tickets se emiten y se envían por correo al aprobarse
          el pago.
        </Typography>

        <Box sx={{ p: 2, bgcolor: "#fff", borderRadius: 1 }}>
          <QRCodeSVG value={checkout.checkoutUrl} size={220} />
        </Box>

        <Typography fontWeight={700}>
          Total: {formatMoneyNumber(checkout.total)}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          El código expira en {formatRemaining(remainingMs)}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <TextField
            label="Link de pago"
            value={checkout.checkoutUrl}
            slotProps={{ input: { readOnly: true } }}
            fullWidth
            size="small"
          />
          <Button onClick={handleCopy}>Copiar</Button>
        </Stack>

        <Button
          color="error"
          onClick={handleCancel}
          disabled={cancelCheckout.isPending}
        >
          Cancelar cobro
        </Button>
      </Stack>
    </Paper>
  );
};
