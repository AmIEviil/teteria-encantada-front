import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductsQuery,
  useUpdateProductMutation,
} from "../../core/api/products.hooks";
import type { Product } from "../../core/api/types";
import { useModalStore } from "../../store/modalStore";

const PRODUCT_FORM_MODAL_KEY = "product-form-modal";
const PRODUCT_VIEW_MODAL_KEY = "product-view-modal";
const PRODUCT_DELETE_MODAL_KEY = "product-delete-modal";

interface ProductFormState {
  code: string;
  name: string;
  description: string;
  price: string;
  minimumQuantity: string;
  currentQuantity: string;
  maximumQuantity: string;
  isActive: boolean;
}

const emptyProductForm: ProductFormState = {
  code: "",
  name: "",
  description: "",
  price: "0",
  minimumQuantity: "0",
  currentQuantity: "0",
  maximumQuantity: "0",
  isActive: true,
};

const mapProductToForm = (product: Product): ProductFormState => ({
  code: product.code,
  name: product.name,
  description: product.description ?? "",
  price: String(product.price),
  minimumQuantity: String(product.minimumQuantity),
  currentQuantity: String(product.currentQuantity),
  maximumQuantity: String(product.maximumQuantity),
  isActive: product.isActive,
});

const parsePositiveNumber = (value: string): number => {
  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

export const BodyInventory = () => {
  const { data: products, isLoading } = useProductsQuery();
  const createProductMutation = useCreateProductMutation();
  const updateProductMutation = useUpdateProductMutation();
  const deleteProductMutation = useDeleteProductMutation();

  const openModals = useModalStore((state) => state.openModals);
  const modalPayloads = useModalStore((state) => state.modalPayloads);
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const clearModalPayload = useModalStore((state) => state.clearModalPayload);

  const [formState, setFormState] = useState<ProductFormState>(emptyProductForm);
  const [validationError, setValidationError] = useState<string>("");

  const selectedProduct = modalPayloads[PRODUCT_FORM_MODAL_KEY] as
    | Product
    | undefined;
  const viewedProduct = modalPayloads[PRODUCT_VIEW_MODAL_KEY] as
    | Product
    | undefined;
  const deletedProduct = modalPayloads[PRODUCT_DELETE_MODAL_KEY] as
    | Product
    | undefined;

  const isFormModalOpen = Boolean(openModals[PRODUCT_FORM_MODAL_KEY]);
  const isViewModalOpen = Boolean(openModals[PRODUCT_VIEW_MODAL_KEY]);
  const isDeleteModalOpen = Boolean(openModals[PRODUCT_DELETE_MODAL_KEY]);

  const isMutating =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    deleteProductMutation.isPending;

  const openCreateModal = () => {
    setValidationError("");
    setFormState(emptyProductForm);
    clearModalPayload(PRODUCT_FORM_MODAL_KEY);
    openModal(PRODUCT_FORM_MODAL_KEY);
  };

  const openEditModal = (product: Product) => {
    setValidationError("");
    setFormState(mapProductToForm(product));
    openModal(PRODUCT_FORM_MODAL_KEY, product);
  };

  const openViewModal = (product: Product) => {
    openModal(PRODUCT_VIEW_MODAL_KEY, product);
  };

  const openDeleteModal = (product: Product) => {
    openModal(PRODUCT_DELETE_MODAL_KEY, product);
  };

  const handleCloseFormModal = () => {
    closeModal(PRODUCT_FORM_MODAL_KEY);
    clearModalPayload(PRODUCT_FORM_MODAL_KEY);
    setValidationError("");
  };

  const handleCloseViewModal = () => {
    closeModal(PRODUCT_VIEW_MODAL_KEY);
    clearModalPayload(PRODUCT_VIEW_MODAL_KEY);
  };

  const handleCloseDeleteModal = () => {
    closeModal(PRODUCT_DELETE_MODAL_KEY);
    clearModalPayload(PRODUCT_DELETE_MODAL_KEY);
  };

  const handleFieldChange = <K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formState.code.trim() || !formState.name.trim()) {
      setValidationError("Codigo y nombre son obligatorios");
      return false;
    }

    const minimumQuantity = parsePositiveNumber(formState.minimumQuantity);
    const currentQuantity = parsePositiveNumber(formState.currentQuantity);
    const maximumQuantity = parsePositiveNumber(formState.maximumQuantity);

    if (minimumQuantity > maximumQuantity) {
      setValidationError("La cantidad minima no puede ser mayor que la maxima");
      return false;
    }

    if (currentQuantity < minimumQuantity || currentQuantity > maximumQuantity) {
      setValidationError(
        "La cantidad actual debe estar entre la cantidad minima y maxima",
      );
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      code: formState.code.trim(),
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      price: parsePositiveNumber(formState.price),
      minimumQuantity: Math.round(parsePositiveNumber(formState.minimumQuantity)),
      currentQuantity: Math.round(parsePositiveNumber(formState.currentQuantity)),
      maximumQuantity: Math.round(parsePositiveNumber(formState.maximumQuantity)),
      isActive: formState.isActive,
    };

    if (selectedProduct) {
      await updateProductMutation.mutateAsync({
        id: selectedProduct.id,
        payload,
      });
    } else {
      await createProductMutation.mutateAsync(payload);
    }

    handleCloseFormModal();
  };

  const handleConfirmDelete = async () => {
    if (!deletedProduct) {
      return;
    }

    await deleteProductMutation.mutateAsync(deletedProduct.id);
    handleCloseDeleteModal();
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={600}>
          Gestion de Productos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>
          Crear Producto
        </Button>
      </Stack>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Codigo</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Min/Max</TableCell>
                <TableCell>Activo</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && (products?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("es-CL", {
                        style: "currency",
                        currency: "CLP",
                        maximumFractionDigits: 0,
                      }).format(product.price)}
                    </TableCell>
                    <TableCell>{product.currentQuantity}</TableCell>
                    <TableCell>
                      {product.minimumQuantity} / {product.maximumQuantity}
                    </TableCell>
                    <TableCell>{product.isActive ? "Si" : "No"}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => openViewModal(product)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => openEditModal(product)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => openDeleteModal(product)}
                        >
                          Eliminar
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={isFormModalOpen}
        onClose={handleCloseFormModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedProduct ? "Editar Producto" : "Crear Producto"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Codigo"
              value={formState.code}
              onChange={(event) => handleFieldChange("code", event.target.value)}
              fullWidth
            />
            <TextField
              label="Nombre"
              value={formState.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              fullWidth
            />
            <TextField
              label="Descripcion"
              value={formState.description}
              onChange={(event) =>
                handleFieldChange("description", event.target.value)
              }
              multiline
              minRows={2}
              fullWidth
            />
            <TextField
              label="Precio"
              type="number"
              value={formState.price}
              onChange={(event) => handleFieldChange("price", event.target.value)}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 0.01,
                },
              }}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Cantidad minima"
                type="number"
                value={formState.minimumQuantity}
                onChange={(event) =>
                  handleFieldChange("minimumQuantity", event.target.value)
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
                fullWidth
              />
              <TextField
                label="Cantidad actual"
                type="number"
                value={formState.currentQuantity}
                onChange={(event) =>
                  handleFieldChange("currentQuantity", event.target.value)
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
                fullWidth
              />
              <TextField
                label="Cantidad maxima"
                type="number"
                value={formState.maximumQuantity}
                onChange={(event) =>
                  handleFieldChange("maximumQuantity", event.target.value)
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: 1,
                  },
                }}
                fullWidth
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={formState.isActive}
                  onChange={(event) =>
                    handleFieldChange("isActive", event.target.checked)
                  }
                />
              }
              label="Producto activo"
            />
            {validationError && (
              <Typography color="error" variant="body2">
                {validationError}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormModal} disabled={isMutating}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitForm}
            variant="contained"
            disabled={isMutating}
          >
            {selectedProduct ? "Guardar Cambios" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isViewModalOpen}
        onClose={handleCloseViewModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Detalle de Producto</DialogTitle>
        <DialogContent>
          {viewedProduct && (
            <Stack spacing={1.25} mt={1}>
              <Typography>
                <strong>Codigo:</strong> {viewedProduct.code}
              </Typography>
              <Typography>
                <strong>Nombre:</strong> {viewedProduct.name}
              </Typography>
              <Typography>
                <strong>Descripcion:</strong> {viewedProduct.description || "-"}
              </Typography>
              <Typography>
                <strong>Precio:</strong> {viewedProduct.price}
              </Typography>
              <Typography>
                <strong>Cantidad minima:</strong> {viewedProduct.minimumQuantity}
              </Typography>
              <Typography>
                <strong>Cantidad actual:</strong> {viewedProduct.currentQuantity}
              </Typography>
              <Typography>
                <strong>Cantidad maxima:</strong> {viewedProduct.maximumQuantity}
              </Typography>
              <Typography>
                <strong>Activo:</strong> {viewedProduct.isActive ? "Si" : "No"}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar Producto</DialogTitle>
        <DialogContent>
          <Typography>
            {`Estas seguro de eliminar ${deletedProduct?.name ?? "este producto"}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteModal} disabled={isMutating}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isMutating}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {isMutating && (
        <Box display="flex" justifyContent="center">
          <CircularProgress size={24} />
        </Box>
      )}
    </Stack>
  );
};
