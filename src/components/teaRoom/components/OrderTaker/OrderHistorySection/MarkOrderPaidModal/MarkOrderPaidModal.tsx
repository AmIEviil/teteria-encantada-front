import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { OrderPaymentMethod } from "../../../../../../core/api/types";
import type { MarkOrderPaidModalProps } from "../../../../../../service/teaRoom/orderTaker.interface";

const TIP_RATE = 0.1;

export const MarkOrderPaidModal = ({
  order,
  isSubmitting,
  formatCurrency,
  onClose,
  onConfirm,
}: MarkOrderPaidModalProps) => {
  const [withTip, setWithTip] = useState<boolean | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod | null>(null);

  if (!order) {
    return null;
  }

  const tipAmount = Math.round(order.total * TIP_RATE);
  const totalWithTip = order.total + tipAmount;
  const canConfirm = withTip !== null && paymentMethod !== null && !isSubmitting;

  const resetAndClose = () => {
    setWithTip(null);
    setPaymentMethod(null);
    onClose();
  };

  const handleConfirm = () => {
    if (withTip === null || paymentMethod === null) {
      return;
    }

    onConfirm({ tipAmount: withTip ? tipAmount : 0, paymentMethod });
    setWithTip(null);
    setPaymentMethod(null);
  };

  return (
    <Dialog open onClose={resetAndClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirmar pago — Orden #{order.id.slice(0, 8)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} pt={0.5}>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              Total orden: {formatCurrency(order.total)}
            </Typography>
            <Typography variant="body2">
              Propina (10%): {formatCurrency(tipAmount)}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              Total con propina: {formatCurrency(totalWithTip)}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              Total sin propina: {formatCurrency(order.total)}
            </Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              Propina
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={withTip}
              onChange={(_event, value: boolean | null) => {
                if (value !== null) {
                  setWithTip(value);
                }
              }}
            >
              <ToggleButton value={true}>Con propina (10%)</ToggleButton>
              <ToggleButton value={false}>Sin propina</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              Medio de pago
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={paymentMethod}
              onChange={(_event, value: OrderPaymentMethod | null) => {
                if (value !== null) {
                  setPaymentMethod(value);
                }
              }}
            >
              <ToggleButton value="CASH">Efectivo</ToggleButton>
              <ToggleButton value="CARD">Tarjeta</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={resetAndClose}>Cancelar</Button>
        <Button variant="contained" disabled={!canConfirm} onClick={handleConfirm}>
          Confirmar pago
        </Button>
      </DialogActions>
    </Dialog>
  );
};
