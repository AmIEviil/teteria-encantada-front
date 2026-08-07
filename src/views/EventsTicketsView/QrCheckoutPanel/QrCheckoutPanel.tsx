import { useEffect, useRef, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import {
  useCancelQrCheckoutMutation,
  useQrCheckoutStatusQuery,
} from "../../../core/api/payments.hooks";
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

  // Un cobro se liquida una sola vez. Cancelar por botón y recibir el evento
  // de pago por socket pueden llegar casi juntos: sin este guard el padre
  // recibiría dos avisos con estados contradictorios (CANCELLED y PAID).
  const hasSettledRef = useRef(false);
  const settleOnce = (status: EventPurchaseStatus) => {
    if (hasSettledRef.current) return;
    hasSettledRef.current = true;
    onSettled(status);
  };

  useRealtimeEventPurchase(checkout.purchaseId, (payload) => {
    settleOnce(payload.status);
  });

  // Respaldo del socket: si se cayó justo cuando el backend cambió el estado
  // del pago, este polling (ver useQrCheckoutStatusQuery) igual lo rescata,
  // en vez de dejar el QR congelado hasta que corra el cron de expiración.
  const checkoutStatusQuery = useQrCheckoutStatusQuery(eventId, checkout.purchaseId);

  useEffect(() => {
    const status = checkoutStatusQuery.data?.status;
    if (status && status !== "PENDING") {
      settleOnce(status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutStatusQuery.data?.status]);

  useEffect(() => {
    const expiresAt = new Date(checkout.expiresAt).getTime();
    const timer = setInterval(() => {
      const remaining = expiresAt - Date.now();
      setRemainingMs(remaining);
      // Sin esto el intervalo sigue re-renderizando cada segundo para siempre
      // después de que el código expiró.
      if (remaining <= 0) {
        clearInterval(timer);
        // MercadoPago ya no acepta este código pasado el vencimiento: se
        // liquida localmente para sacar el QR de pantalla, en vez de esperar
        // hasta 60s a que el cron de expiración del backend lo haga.
        settleOnce("EXPIRED");
      }
    }, 1000);
    setRemainingMs(expiresAt - Date.now());
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      const result = await cancelCheckout.mutateAsync({
        eventId,
        purchaseId: checkout.purchaseId,
      });
      settleOnce(result.status);
    } catch {
      // El snackbar de error ya lo dispara el onError de la mutación. Se
      // captura acá sólo para que el rechazo no quede sin manejar, y el panel
      // se queda abierto: el cobro sigue vivo si la cancelación no se aplicó.
    }
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
