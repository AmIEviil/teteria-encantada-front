import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CustomPagination from "../ui/pagination/Pagination";
import { authService } from "../../core/api/auth.service";
import {
  useAddWhitelistMutation,
  useEmpleadosUsersQuery,
  useSetWhitelistActiveMutation,
} from "../../core/api/empleados.hooks";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { useBoundStore } from "../../store/BoundedStore";
import { validateEmail } from "../../utils/validation.utils";
import { roles } from "../../utils/role.utils";
import type { AuthRole } from "../../core/api/types";

const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(new Date(value));

export const WhitelistTab = () => {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleName, setRoleName] = useState("Tecnico");
  const [emailError, setEmailError] = useState("");
  const [availableRoles, setAvailableRoles] = useState<AuthRole[]>([]);

  const openSnackbar = useSnackBarResponseStore((state) => state.openSnackbar);
  const addWhitelistMutation = useAddWhitelistMutation();
  const setActiveMutation = useSetWhitelistActiveMutation();
  const currentUserRole = useBoundStore((state) => state.userData)?.role.name;
  const isSuperadmin = currentUserRole === roles.SUPER_ADMIN;

  const filters = useMemo(
    () => ({ page, limit: 20, onlyStaff: true }),
    [page],
  );
  const { data, isLoading, isFetching } = useEmpleadosUsersQuery(filters);

  useEffect(() => {
    let isMounted = true;

    authService
      .roles()
      .then((fetchedRoles) => {
        if (isMounted) {
          setAvailableRoles(
            fetchedRoles.filter(
              (role) =>
                role.name !== roles.CLIENT &&
                (isSuperadmin || role.name !== roles.SUPER_ADMIN),
            ),
          );
        }
      })
      .catch(() => {
        if (isMounted) {
          setAvailableRoles(
            [
              { id: "fallback-super", name: roles.SUPER_ADMIN },
              { id: "fallback-admin", name: roles.ADMIN },
              { id: "fallback-tec", name: roles.TEC },
            ].filter((role) => isSuperadmin || role.name !== roles.SUPER_ADMIN),
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSuperadmin]);

  const users = data?.items ?? [];
  const pagination = data?.pagination;

  const handleClose = () => {
    setDialogOpen(false);
    setEmail("");
    setEmailError("");
  };

  const handleSubmit = async () => {
    const error = validateEmail(email);

    if (error) {
      setEmailError(error);
      openSnackbar("Revisa el correo", "error");
      return;
    }

    await addWhitelistMutation.mutateAsync({ email: email.trim(), roleName });
    handleClose();
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Whitelist de correos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Solo estos correos pueden entrar con "Continuar con Google".
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Agregar correo
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Correo</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Alta</TableCell>
                <TableCell align="right">Acceso</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(isLoading || isFetching) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Cargando whitelist...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay correos autorizados
                  </TableCell>
                </TableRow>
              )}

              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {`${user.first_name} ${user.last_name ?? ""}`.trim()}
                  </TableCell>
                  <TableCell>{user.role.name}</TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={user.isActive}
                      disabled={setActiveMutation.isPending}
                      onChange={(event) =>
                        setActiveMutation.mutate({
                          id: user.id,
                          isActive: event.target.checked,
                        })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <CustomPagination
            actualPage={pagination?.page ?? 1}
            totalPages={pagination?.totalPages ?? 1}
            disabled={isLoading || isFetching}
            onPageChange={setPage}
          />
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Agregar correo</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Correo"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
              }}
              onBlur={() => setEmailError(validateEmail(email))}
              error={Boolean(emailError)}
              helperText={emailError}
              fullWidth
            />
            <TextField
              select
              label="Rol"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              fullWidth
            >
              {availableRoles.map((role) => (
                <MenuItem key={role.id} value={role.name}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={addWhitelistMutation.isPending}
          >
            {addWhitelistMutation.isPending ? "Agregando..." : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
