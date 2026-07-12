import { Button, Stack, TextField, Typography } from "@mui/material";
import { sanitizeInteger } from "../../../../../utils/formatText.utils";
import type { NumericStepperProps } from "../../../../../service/teaRoom/orderTaker.interface";

export const NumericStepper = ({
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
