import { useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CustomPagination from "../ui/pagination/Pagination";
import {
  useCreateEmpleadoUserMutation,
  useCreateTrabajadorMutation,
  useEmpleadosUsersQuery,
  useUpdateTrabajadorMutation,
} from "../../core/api/empleados.hooks";
import { authService } from "../../core/api/auth.service";
import { empleadosService } from "../../core/api/empleados.service";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { validateEmail, validatePassword } from "../../utils/validation.utils";
import type {
  AuthRole,
  EmpleadoUser,
  RegisterPayload,
  Trabajador,
  TrabajadorDocumentoPayload,
} from "../../core/api/types";

interface TrabajadorDocumentoFormState {
  nombreArchivo: string;
  rutaArchivo: string;
  tipoMime: string;
  tamanoBytes: string;
  descripcion: string;
}

interface TrabajadorFormState {
  rut: string;
  comuna: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  edad: string;
  sueldo: string;
  fotoUrl: string;
  documentos: TrabajadorDocumentoFormState[];
}

interface UserFormState {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleName: string;
}

const emptyDocumento = (): TrabajadorDocumentoFormState => ({
  nombreArchivo: "",
  rutaArchivo: "",
  tipoMime: "",
  tamanoBytes: "",
  descripcion: "",
});

const emptyForm = (): TrabajadorFormState => ({
  rut: "",
  comuna: "",
  direccion: "",
  telefono: "",
  fechaNacimiento: "",
  edad: "",
  sueldo: "",
  fotoUrl: "",
  documentos: [emptyDocumento()],
});

const emptyUserForm = (): UserFormState => ({
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirmPassword: "",
  roleName: "Tecnico",
});

const formatDateForInput = (value: string): string => {
  if (!value) {
    return "";
  }

  if (value.includes("T")) {
    return value.split("T")[0];
  }

  return value;
};

const calculateAge = (birthDate: string): number => {
  if (!birthDate) {
    return 0;
  }

  const date = new Date(`${birthDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
};

const sanitizeRut = (value?: string | null): string => {
  return (value ?? "").toUpperCase().replaceAll(/[^0-9K]/g, "");
};

const formatRut = (value?: string | null): string => {
  const sanitized = sanitizeRut(value);

  if (sanitized.length <= 1) {
    return sanitized;
  }

  const verifier = sanitized.slice(-1);
  let body = sanitized.slice(0, -1).replaceAll("K", "");

  if (!body) {
    return verifier;
  }

  body = body.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${body}-${verifier}`;
};

const isValidRut = (value: string): boolean => {
  const sanitized = sanitizeRut(value);

  if (sanitized.length < 2) {
    return false;
  }

  const verifier = sanitized.slice(-1);
  const body = sanitized.slice(0, -1);

  if (!/^\d+$/.test(body)) {
    return false;
  }

  if (!/^[\dK]$/.test(verifier)) {
    return false;
  }

  return true;
};

const formatCellphone = (value?: string | null): string => {
  const digitsOnly = (value ?? "").replaceAll(/\D/g, "");
  let normalized = digitsOnly;

  if (normalized.startsWith("56")) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith("9")) {
    normalized = normalized.slice(1);
  }

  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }

  const subscriber = normalized.slice(0, 8);

  if (subscriber.length === 0) {
    return "+56 9";
  }

  if (subscriber.length <= 4) {
    return `+56 9 ${subscriber}`;
  }

  return `+56 9 ${subscriber.slice(0, 4)} ${subscriber.slice(4)}`;
};

const isValidCellphone = (value: string): boolean => {
  return /^\+56 9 \d{4} \d{4}$/.test(value);
};

const hasTrabajadorData = (
  trabajador: EmpleadoUser["trabajador"] | Trabajador | null | undefined,
): trabajador is Trabajador => {
  return Boolean(trabajador && typeof trabajador.id === "string" && trabajador.id.length > 0);
};

const mapTrabajadorToForm = (
  trabajador: EmpleadoUser["trabajador"] | Trabajador,
): TrabajadorFormState => {
  if (!trabajador) {
    return emptyForm();
  }

  const birthDate = formatDateForInput(trabajador.fechaNacimiento ?? "");
  const age = calculateAge(birthDate);
  const documentos = trabajador.documentos ?? [];

  return {
    rut: formatRut(trabajador.rut ?? ""),
    comuna: trabajador.comuna ?? "",
    direccion: trabajador.direccion ?? "",
    telefono: formatCellphone(trabajador.telefono ?? ""),
    fechaNacimiento: birthDate,
    edad: String(age),
    sueldo: String(trabajador.sueldo ?? ""),
    fotoUrl: trabajador.fotoUrl ?? "",
    documentos:
      documentos.length > 0
        ? documentos.map((documento) => ({
            nombreArchivo: documento.nombreArchivo,
            rutaArchivo: documento.rutaArchivo,
            tipoMime: documento.tipoMime ?? "",
            tamanoBytes: documento.tamanoBytes ? String(documento.tamanoBytes) : "",
            descripcion: documento.descripcion ?? "",
          }))
        : [emptyDocumento()],
  };
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const parseNumber = (value: string): number => {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

const normalizeText = (value: string | null): string => value?.trim() || "-";

export const BodyEmpleados = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [selectedUser, setSelectedUser] = useState<EmpleadoUser | null>(null);
  const [formState, setFormState] = useState<TrabajadorFormState>(emptyForm());
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm());
  const [availableRoles, setAvailableRoles] = useState<AuthRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [isLoadingTrabajador, setIsLoadingTrabajador] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [workerFieldErrors, setWorkerFieldErrors] = useState({
    rut: "",
    telefono: "",
  });
  const [userFieldErrors, setUserFieldErrors] = useState({
    username: "",
    first_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showUserConfirmPassword, setShowUserConfirmPassword] = useState(false);

  const filters = useMemo(
    () => ({
      page,
      limit,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
    }),
    [page, limit, firstName, lastName, createdFrom, createdTo],
  );

  const { data, isLoading, isFetching } = useEmpleadosUsersQuery(filters);
  const createEmpleadoUserMutation = useCreateEmpleadoUserMutation();
  const createTrabajadorMutation = useCreateTrabajadorMutation();
  const updateTrabajadorMutation = useUpdateTrabajadorMutation();
  const openSnackbar = useSnackBarResponseStore((state) => state.openSnackbar);

  useEffect(() => {
    let isMounted = true;

    const loadRoles = async () => {
      setIsLoadingRoles(true);

      try {
        const roles = await authService.roles();

        if (!isMounted) {
          return;
        }

        setAvailableRoles(roles);

        if (roles.length > 0) {
          setUserForm((prev) => ({
            ...prev,
            roleName: prev.roleName || roles[0].name,
          }));
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setAvailableRoles([
          { id: "fallback-super", name: "Superadmin" },
          { id: "fallback-admin", name: "Admin" },
          { id: "fallback-tec", name: "Tecnico" },
          { id: "fallback-client", name: "Cliente" },
        ]);
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    };

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  const users = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const handleOpenForm = async (user: EmpleadoUser) => {
    setSelectedUser(user);
    setFormState(hasTrabajadorData(user.trabajador) ? mapTrabajadorToForm(user.trabajador) : emptyForm());
    setValidationError("");
    setDialogOpen(true);

    if (!hasTrabajadorData(user.trabajador)) {
      return;
    }

    setIsLoadingTrabajador(true);

    try {
      const trabajador = await empleadosService.findOne(user.trabajador.id);
      setFormState(mapTrabajadorToForm(trabajador));
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              trabajador,
            }
          : prev,
      );
    } catch {
      if (hasTrabajadorData(user.trabajador)) {
        setFormState(mapTrabajadorToForm(user.trabajador));
      }
      openSnackbar(
        "No se pudo refrescar el detalle del trabajador, usando datos disponibles",
        "warning",
      );
    } finally {
      setIsLoadingTrabajador(false);
    }
  };

  const handleCloseForm = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setFormState(emptyForm());
    setIsLoadingTrabajador(false);
    setValidationError("");
    setWorkerFieldErrors({ rut: "", telefono: "" });
  };

  const handleOpenCreateUser = () => {
    setUserForm((prev) => ({
      ...emptyUserForm(),
      roleName: prev.roleName || availableRoles[0]?.name || "Tecnico",
    }));
    setCreateUserDialogOpen(true);
  };

  const handleCloseCreateUser = () => {
    setCreateUserDialogOpen(false);
    setUserForm((prev) => ({
      ...emptyUserForm(),
      roleName: prev.roleName || availableRoles[0]?.name || "Tecnico",
    }));
    setUserFieldErrors({
      username: "",
      first_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setShowUserPassword(false);
    setShowUserConfirmPassword(false);
  };

  const handleUserFieldChange = <K extends keyof UserFormState>(
    key: K,
    value: UserFormState[K],
  ) => {
    setUserForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRutBlur = () => {
    const formattedRut = formatRut(formState.rut);
    handleFieldChange("rut", formattedRut);
    setWorkerFieldErrors((prev) => ({
      ...prev,
      rut: isValidRut(formattedRut) ? "" : "El RUT debe tener formato XX.XXX.XXX-X",
    }));
  };

  const handlePhoneBlur = () => {
    const formattedPhone = formatCellphone(formState.telefono);
    handleFieldChange("telefono", formattedPhone);
    setWorkerFieldErrors((prev) => ({
      ...prev,
      telefono: isValidCellphone(formattedPhone) ? "" : "El teléfono debe tener formato +56 9 XXXX XXXX",
    }));
  };

  const handleBirthDateChange = (value: string) => {
    const normalizedDate = formatDateForInput(value);
    const age = calculateAge(normalizedDate);

    setFormState((prev) => ({
      ...prev,
      fechaNacimiento: normalizedDate,
      edad: String(age),
    }));
  };

  const handleFieldChange = <K extends keyof TrabajadorFormState>(
    key: K,
    value: TrabajadorFormState[K],
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDocumentoChange = <K extends keyof TrabajadorDocumentoFormState>(
    index: number,
    key: K,
    value: TrabajadorDocumentoFormState[K],
  ) => {
    setFormState((prev) => ({
      ...prev,
      documentos: prev.documentos.map((documento, currentIndex) =>
        currentIndex === index ? { ...documento, [key]: value } : documento,
      ),
    }));
  };

  const handleAddDocumento = () => {
    setFormState((prev) => ({
      ...prev,
      documentos: [...prev.documentos, emptyDocumento()],
    }));
  };

  const handleRemoveDocumento = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      documentos: prev.documentos.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const validateForm = (): boolean => {
    if (!selectedUser) {
      const message = "Selecciona un usuario para crear o editar el trabajador";
      setValidationError(message);
      openSnackbar(message, "error");
      return false;
    }

    if (
      !formState.rut.trim() ||
      !formState.comuna.trim() ||
      !formState.direccion.trim() ||
      !formState.telefono.trim() ||
      !formState.fechaNacimiento ||
      !formState.sueldo.trim()
    ) {
      const message = "Completa los campos obligatorios del trabajador";
      setValidationError(message);
      openSnackbar(message, "error");
      return false;
    }

    const formattedRut = formatRut(formState.rut);

    if (!isValidRut(formattedRut)) {
      const message =
        "El RUT debe tener formato XX.XXX.XXX-X y solo admite K como letra final";
      setValidationError(message);
      setWorkerFieldErrors((prev) => ({ ...prev, rut: message }));
      openSnackbar(message, "error");
      return false;
    }

    const formattedCellphone = formatCellphone(formState.telefono);

    if (!isValidCellphone(formattedCellphone)) {
      const message = "El teléfono debe tener formato +56 9 XXXX XXXX";
      setValidationError(message);
      setWorkerFieldErrors((prev) => ({ ...prev, telefono: message }));
      openSnackbar(message, "error");
      return false;
    }

    const calculatedAge = calculateAge(formState.fechaNacimiento);

    if (calculatedAge <= 0) {
      const message = "La fecha de nacimiento no es válida para calcular la edad";
      setValidationError(message);
      openSnackbar(message, "error");
      return false;
    }

    const hasIncompleteDocument = formState.documentos.some((documento) => {
      const anyFilled =
        documento.nombreArchivo.trim() ||
        documento.rutaArchivo.trim() ||
        documento.tipoMime.trim() ||
        documento.tamanoBytes.trim() ||
        documento.descripcion.trim();

      if (!anyFilled) {
        return false;
      }

      return !documento.nombreArchivo.trim() || !documento.rutaArchivo.trim();
    });

    if (hasIncompleteDocument) {
      const message = "Cada documento debe tener nombre y ruta";
      setValidationError(message);
      openSnackbar(message, "error");
      return false;
    }

    setValidationError("");
    return true;
  };

  const buildDocumentPayload = (): TrabajadorDocumentoPayload[] => {
    return formState.documentos
      .filter((documento) => documento.nombreArchivo.trim() || documento.rutaArchivo.trim())
      .map((documento) => ({
        nombreArchivo: documento.nombreArchivo.trim(),
        rutaArchivo: documento.rutaArchivo.trim(),
        tipoMime: documento.tipoMime.trim() || undefined,
        tamanoBytes: documento.tamanoBytes ? parseNumber(documento.tamanoBytes) : undefined,
        descripcion: documento.descripcion.trim() || undefined,
      }));
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedUser) {
      return;
    }

    const formattedRut = formatRut(formState.rut);
    const formattedCellphone = formatCellphone(formState.telefono);
    const calculatedAge = calculateAge(formState.fechaNacimiento);

    const payload = {
      rut: formattedRut,
      comuna: formState.comuna.trim(),
      direccion: formState.direccion.trim(),
      telefono: formattedCellphone,
      fechaNacimiento: formatDateForInput(formState.fechaNacimiento),
      edad: calculatedAge,
      sueldo: parseNumber(formState.sueldo),
      fotoUrl: formState.fotoUrl.trim() || undefined,
      documentos: buildDocumentPayload(),
    };

    if (selectedUser.trabajador?.id) {
      await updateTrabajadorMutation.mutateAsync({
        id: selectedUser.trabajador.id,
        payload,
      });
    } else {
      await createTrabajadorMutation.mutateAsync({
        userId: selectedUser.id,
        ...payload,
      });
    }

    handleCloseForm();
  };

  const handleCreateUser = async () => {
    if (
      !userForm.username.trim() ||
      !userForm.first_name.trim() ||
      !userForm.email.trim() ||
      !userForm.password
    ) {
      const message = "Completa los campos obligatorios del usuario";
      openSnackbar(message, "error");
      setUserFieldErrors((prev) => ({
        ...prev,
        username: userForm.username.trim() ? "" : "El usuario es obligatorio",
        first_name: userForm.first_name.trim() ? "" : "El nombre es obligatorio",
        email: userForm.email.trim() ? validateEmail(userForm.email) : "El correo es obligatorio",
        password: userForm.password ? validatePassword(userForm.password) : "La contraseña es obligatoria",
      }));
      return;
    }

    const emailError = validateEmail(userForm.email);
    const passwordError = validatePassword(userForm.password);
    const confirmPasswordError =
      userForm.password === userForm.confirmPassword
        ? ""
        : "La confirmación de contraseña no coincide";

    setUserFieldErrors((prev) => ({
      ...prev,
      username: userForm.username.trim().length < 3 ? "El usuario debe tener al menos 3 caracteres" : "",
      first_name: userForm.first_name.trim() ? "" : "El nombre es obligatorio",
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    }));

    if (emailError || passwordError || confirmPasswordError) {
      openSnackbar("Revisa los campos del usuario", "error");
      return;
    }

    const payload: RegisterPayload = {
      username: userForm.username.trim(),
      first_name: userForm.first_name.trim(),
      last_name: userForm.last_name.trim() || undefined,
      email: userForm.email.trim(),
      password: userForm.password,
      roleName: userForm.roleName,
    };

    await createEmpleadoUserMutation.mutateAsync(payload);
    handleCloseCreateUser();
  };

  const handleResetFilters = () => {
    setPage(1);
    setLimit(10);
    setFirstName("");
    setLastName("");
    setCreatedFrom("");
    setCreatedTo("");
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Empleados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Usuarios registrados con filtros por nombre, apellido y fecha de creación.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateUser}>
            Crear usuario
          </Button>
          <Button variant="outlined" onClick={handleResetFilters}>
            Limpiar filtros
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Filtros</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              label="Nombre"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                setPage(1);
              }}
              fullWidth
            />
            <TextField
              label="Apellido"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                setPage(1);
              }}
              fullWidth
            />
            <TextField
              type="date"
              label="Desde"
              value={createdFrom}
              onChange={(event) => {
                setCreatedFrom(event.target.value);
                setPage(1);
              }}
              fullWidth
            />
            <TextField
              type="date"
              label="Hasta"
              value={createdTo}
              onChange={(event) => {
                setCreatedTo(event.target.value);
                setPage(1);
              }}
              fullWidth
            />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <TextField
              select
              label="Resultados por página"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              sx={{ width: 220 }}
            >
              {[10, 20, 50].map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="text.secondary">
              {pagination ? `${pagination.totalItems} usuarios encontrados` : "Cargando..."}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell>Trabajador</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(isLoading || isFetching) && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Cargando empleados...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay usuarios para mostrar
                  </TableCell>
                </TableRow>
              )}

              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{normalizeText(user.first_name)}</TableCell>
                  <TableCell>{normalizeText(user.last_name)}</TableCell>
                  <TableCell>{normalizeText(user.username)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role.name}</TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.trabajador ? (
                      <Box component="span" sx={{ color: "success.main", fontWeight: 600 }}>
                        Completo
                      </Box>
                    ) : (
                      <Box component="span" sx={{ color: "warning.main", fontWeight: 600 }}>
                        Pendiente
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant={user.trabajador ? "outlined" : "contained"}
                      startIcon={user.trabajador ? <EditIcon /> : <AddIcon />}
                      onClick={() => handleOpenForm(user)}
                    >
                      {user.trabajador ? "Editar" : "Completar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <CustomPagination
            actualPage={pagination?.page ?? 1}
            totalPages={totalPages}
            disabled={isLoading || isFetching}
            onPageChange={setPage}
          />
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseForm} fullWidth maxWidth="md">
        <DialogTitle>
          {selectedUser?.trabajador ? "Editar trabajador" : "Completar trabajador"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Usuario asociado
              </Typography>
              <Typography fontWeight={600}>
                {selectedUser
                  ? `${selectedUser.first_name} ${selectedUser.last_name ?? ""}`.trim()
                  : "Sin usuario"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUser?.email}
              </Typography>
            </Paper>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="RUT"
                value={formState.rut}
                onChange={(event) => handleFieldChange("rut", event.target.value)}
                onBlur={handleRutBlur}
                error={Boolean(workerFieldErrors.rut)}
                helperText={workerFieldErrors.rut}
                fullWidth
              />
              <TextField
                label="Comuna"
                value={formState.comuna}
                onChange={(event) => handleFieldChange("comuna", event.target.value)}
                fullWidth
              />
            </Stack>

            <TextField
              label="Direccion"
              value={formState.direccion}
              onChange={(event) => handleFieldChange("direccion", event.target.value)}
              fullWidth
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Telefono"
                value={formState.telefono}
                onChange={(event) => handleFieldChange("telefono", event.target.value)}
                onBlur={handlePhoneBlur}
                error={Boolean(workerFieldErrors.telefono)}
                helperText={workerFieldErrors.telefono}
                fullWidth
              />
              <TextField
                type="date"
                label="Fecha de nacimiento"
                value={formState.fechaNacimiento}
                onChange={(event) => handleBirthDateChange(event.target.value)}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                type="number"
                label="Edad"
                value={formState.edad}
                slotProps={{ input: { readOnly: true } }}
                fullWidth
              />
              <TextField
                type="number"
                label="Sueldo"
                value={formState.sueldo}
                onChange={(event) => handleFieldChange("sueldo", event.target.value)}
                fullWidth
              />
            </Stack>

            {isLoadingTrabajador && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Cargando datos completos del trabajador...
                </Typography>
              </Stack>
            )}

            <TextField
              label="Foto URL"
              value={formState.fotoUrl}
              onChange={(event) => handleFieldChange("fotoUrl", event.target.value)}
              fullWidth
            />

            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight={600}>
                  Documentos
                </Typography>
                <Button startIcon={<AddIcon />} onClick={handleAddDocumento}>
                  Agregar documento
                </Button>
              </Stack>

              {formState.documentos.map((documento, index) => (
                <Paper key={`${documento.nombreArchivo}-${index}`} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">Documento {index + 1}</Typography>
                      <IconButton
                        onClick={() => handleRemoveDocumento(index)}
                        disabled={formState.documentos.length === 1}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        label="Nombre"
                        value={documento.nombreArchivo}
                        onChange={(event) =>
                          handleDocumentoChange(index, "nombreArchivo", event.target.value)
                        }
                        fullWidth
                      />
                      <TextField
                        label="Ruta"
                        value={documento.rutaArchivo}
                        onChange={(event) =>
                          handleDocumentoChange(index, "rutaArchivo", event.target.value)
                        }
                        fullWidth
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        label="Tipo MIME"
                        value={documento.tipoMime}
                        onChange={(event) =>
                          handleDocumentoChange(index, "tipoMime", event.target.value)
                        }
                        fullWidth
                      />
                      <TextField
                        type="number"
                        label="Tamaño bytes"
                        value={documento.tamanoBytes}
                        onChange={(event) =>
                          handleDocumentoChange(index, "tamanoBytes", event.target.value)
                        }
                        fullWidth
                      />
                    </Stack>

                    <TextField
                      label="Descripcion"
                      value={documento.descripcion}
                      onChange={(event) =>
                        handleDocumentoChange(index, "descripcion", event.target.value)
                      }
                      fullWidth
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>

            {validationError && (
              <Typography color="error" variant="body2">
                {validationError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              createTrabajadorMutation.isPending ||
              updateTrabajadorMutation.isPending
            }
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={createUserDialogOpen}
        onClose={handleCloseCreateUser}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Crear usuario</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nombre de usuario"
              value={userForm.username}
              onChange={(event) => handleUserFieldChange("username", event.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Nombre"
                value={userForm.first_name}
                onChange={(event) => handleUserFieldChange("first_name", event.target.value)}
                fullWidth
              />
              <TextField
                label="Apellido"
                value={userForm.last_name}
                onChange={(event) => handleUserFieldChange("last_name", event.target.value)}
                fullWidth
              />
            </Stack>
            <TextField
              label="Correo"
              type="email"
              value={userForm.email}
              onChange={(event) => {
                handleUserFieldChange("email", event.target.value);
                setUserFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              onBlur={() =>
                setUserFieldErrors((prev) => ({
                  ...prev,
                  email: validateEmail(userForm.email),
                }))
              }
              error={Boolean(userFieldErrors.email)}
              helperText={userFieldErrors.email}
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Contraseña"
                type={showUserPassword ? "text" : "password"}
                value={userForm.password}
                onChange={(event) => {
                  handleUserFieldChange("password", event.target.value);
                  setUserFieldErrors((prev) => ({ ...prev, password: "" }));
                }}
                onBlur={() =>
                  setUserFieldErrors((prev) => ({
                    ...prev,
                    password: validatePassword(userForm.password),
                  }))
                }
                error={Boolean(userFieldErrors.password)}
                helperText={userFieldErrors.password}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowUserPassword((current) => !current)}
                          edge="end"
                        >
                          {showUserPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                fullWidth
              />
              <TextField
                label="Confirmar contraseña"
                type={showUserConfirmPassword ? "text" : "password"}
                value={userForm.confirmPassword}
                onChange={(event) => {
                  handleUserFieldChange("confirmPassword", event.target.value);
                  setUserFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                onBlur={() =>
                  setUserFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword:
                      userForm.password === userForm.confirmPassword
                        ? ""
                        : "La confirmación de contraseña no coincide",
                  }))
                }
                error={Boolean(userFieldErrors.confirmPassword)}
                helperText={userFieldErrors.confirmPassword}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowUserConfirmPassword((current) => !current)}
                          edge="end"
                        >
                          {showUserConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                fullWidth
              />
            </Stack>
            <TextField
              select
              label="Rol"
              value={userForm.roleName}
              onChange={(event) => handleUserFieldChange("roleName", event.target.value)}
              disabled={isLoadingRoles}
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
          <Button onClick={handleCloseCreateUser}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={createEmpleadoUserMutation.isPending}
          >
            {createEmpleadoUserMutation.isPending ? "Creando..." : "Crear usuario"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};