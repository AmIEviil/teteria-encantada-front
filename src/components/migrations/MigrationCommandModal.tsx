import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useSnackBarResponseStore } from "../../store/snackBarStore";

interface MigrationCommandModalProps {
  open: boolean;
  onClose: () => void;
}

const normalizeMigrationName = (value: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "NuevaMigracion";
  }

  const sanitized = trimmed.replaceAll(/[^a-zA-Z0-9_-]/g, "");
  return sanitized.length > 0 ? sanitized : "NuevaMigracion";
};

const formatCommandBlock = (command: string) => {
  return (
    <Typography
      component="pre"
      sx={{
        backgroundColor: "rgba(47, 42, 32, 0.08)",
        borderRadius: "12px",
        p: 1.25,
        m: 0,
        fontFamily: "monospace",
        fontSize: "0.85rem",
        overflowX: "auto",
      }}
    >
      {command}
    </Typography>
  );
};

export const MigrationCommandModal = ({
  open,
  onClose,
}: MigrationCommandModalProps) => {
  const [migrationName, setMigrationName] = useState("ActualizarModeloUsuarios");

  const safeMigrationName = useMemo(
    () => normalizeMigrationName(migrationName),
    [migrationName],
  );

  const generateCommand = `yarn migration:generate -- ./src/migrations/${safeMigrationName}`;
  const createCommand = `yarn migration:create -- ./src/migrations/${safeMigrationName}`;

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      useSnackBarResponseStore
        .getState()
        .openSnackbar("Comando copiado al portapapeles", "success");
    } catch {
      useSnackBarResponseStore
        .getState()
        .openSnackbar("No se pudo copiar el comando", "warning");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Guia de migraciones</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body1">
            Esta pantalla te ayuda a generar el comando para crear o generar migraciones en backend.
          </Typography>

          <TextField
            label="Nombre de migracion"
            value={migrationName}
            onChange={(event) => setMigrationName(event.target.value)}
            helperText="Usa un nombre descriptivo en PascalCase o snake_case"
            fullWidth
          />

          <Stack spacing={0.75}>
            <Typography fontWeight={700}>Generar migracion desde cambios de entidades</Typography>
            {formatCommandBlock(generateCommand)}
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => {
                void copyToClipboard(generateCommand);
              }}
              sx={{ alignSelf: "flex-start" }}
            >
              Copiar comando
            </Button>
          </Stack>

          <Stack spacing={0.75}>
            <Typography fontWeight={700}>Crear archivo de migracion vacio</Typography>
            {formatCommandBlock(createCommand)}
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => {
                void copyToClipboard(createCommand);
              }}
              sx={{ alignSelf: "flex-start" }}
            >
              Copiar comando
            </Button>
          </Stack>

          <Stack spacing={0.75}>
            <Typography fontWeight={700}>Comandos utiles</Typography>
            {formatCommandBlock("yarn migration:show")}
            {formatCommandBlock("yarn migration:run")}
            {formatCommandBlock("yarn migration:revert")}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
