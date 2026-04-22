import { type ChangeEvent, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductQuery,
  useProductsQuery,
  useUpdateProductMutation,
} from "../../core/api/products.hooks";
import type { Product } from "../../core/api/types";
import { useModalStore } from "../../store/modalStore";
import "./BodyInventory.css";

const PRODUCT_FORM_MODAL_KEY = "product-form-modal";
const PRODUCT_VIEW_MODAL_KEY = "product-view-modal";
const PRODUCT_DELETE_MODAL_KEY = "product-delete-modal";

interface ProductFormState {
  code: string;
  name: string;
  description: string;
  imageBase64: string;
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
  imageBase64: "",
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
  imageBase64: product.imageBase64 ?? "",
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

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el archivo seleccionado"));
        return;
      }

      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error("No se pudo convertir la imagen a base64"));
    };

    reader.readAsDataURL(file);
  });
};

const resolveImageSrc = (imageBase64: string | null | undefined): string | null => {
  const normalized = imageBase64?.trim() ?? "";

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("data:")) {
    return normalized;
  }

  return `data:image/png;base64,${normalized}`;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateTime = (value: string | Date): string => {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

type ProductStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const getStockState = (
  product: Pick<Product, "currentQuantity" | "minimumQuantity" | "maximumQuantity">,
): { label: string; color: "error" | "warning" | "success" } => {
  if (product.currentQuantity <= product.minimumQuantity) {
    return { label: "Stock bajo", color: "error" };
  }

  if (product.currentQuantity >= product.maximumQuantity) {
    return { label: "Stock alto", color: "warning" };
  }

  return { label: "Stock estable", color: "success" };
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
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("ALL");
  const [onlyLowStock, setOnlyLowStock] = useState(false);

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

  const { data: viewedProductDetails, isLoading: isLoadingViewedProduct } =
    useProductQuery(viewedProduct?.id, isViewModalOpen);

  const productForView = viewedProductDetails ?? viewedProduct;

  const productMetrics = useMemo(() => {
    const allProducts = products ?? [];
    const activeCount = allProducts.filter((product) => product.isActive).length;
    const lowStockCount = allProducts.filter((product) => {
      return product.currentQuantity <= product.minimumQuantity;
    }).length;
    const totalInventoryUnits = allProducts.reduce((acc, product) => {
      return acc + product.currentQuantity;
    }, 0);

    return {
      total: allProducts.length,
      activeCount,
      lowStockCount,
      totalInventoryUnits,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const allProducts = products ?? [];
    const normalizedSearch = searchValue.trim().toLowerCase();

    return allProducts.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${product.code} ${product.name} ${product.description ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? product.isActive : !product.isActive);

      const matchesLowStock =
        !onlyLowStock || product.currentQuantity <= product.minimumQuantity;

      return matchesSearch && matchesStatus && matchesLowStock;
    });
  }, [onlyLowStock, products, searchValue, statusFilter]);

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

    const basePayload = {
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
      const updatePayload = {
        ...basePayload,
        imageBase64: formState.imageBase64.trim() || null,
      };

      await updateProductMutation.mutateAsync({
        id: selectedProduct.id,
        payload: updatePayload,
      });
    } else {
      await createProductMutation.mutateAsync({
        ...basePayload,
        imageBase64: formState.imageBase64.trim() || undefined,
      });
    }

    handleCloseFormModal();
  };

  const handleImageFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setValidationError("El archivo seleccionado no es una imagen valida");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
      setValidationError("La imagen no puede superar 5MB");
      event.target.value = "";
      return;
    }

    try {
      const base64DataUrl = await fileToDataUrl(selectedFile);
      handleFieldChange("imageBase64", base64DataUrl);
      setValidationError("");
    } catch {
      setValidationError("No se pudo convertir la imagen a base64");
    }

    event.target.value = "";
  };

  const handleConfirmDelete = async () => {
    if (!deletedProduct) {
      return;
    }

    await deleteProductMutation.mutateAsync(deletedProduct.id);
    handleCloseDeleteModal();
  };

  const hasFiltersApplied =
    searchValue.trim().length > 0 || statusFilter !== "ALL" || onlyLowStock;

  return (
    <Stack spacing={2}>
      <Paper className="inventoryHeroPaper">
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1.2}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Gestion de Productos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra stock, precios e imagenes desde un solo panel.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateModal}
          >
            Crear Producto
          </Button>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Box className="inventoryKpiGrid">
          <Box className="inventoryKpiCard">
            <Typography className="inventoryKpiLabel">Productos</Typography>
            <Typography className="inventoryKpiValue">{productMetrics.total}</Typography>
          </Box>
          <Box className="inventoryKpiCard">
            <Typography className="inventoryKpiLabel">Activos</Typography>
            <Typography className="inventoryKpiValue">{productMetrics.activeCount}</Typography>
          </Box>
          <Box className="inventoryKpiCard">
            <Typography className="inventoryKpiLabel">Stock Bajo</Typography>
            <Typography className="inventoryKpiValue">{productMetrics.lowStockCount}</Typography>
          </Box>
          <Box className="inventoryKpiCard">
            <Typography className="inventoryKpiLabel">Unidades en Inventario</Typography>
            <Typography className="inventoryKpiValue">
              {productMetrics.totalInventoryUnits}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper className="inventoryToolbarPaper">
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.2}
          alignItems={{ xs: "stretch", lg: "center" }}
        >
          <TextField
            size="small"
            label="Buscar producto"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Codigo, nombre o descripcion"
            fullWidth
          />
          <TextField
            size="small"
            select
            label="Estado"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as ProductStatusFilter);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="ALL">Todos</MenuItem>
            <MenuItem value="ACTIVE">Activos</MenuItem>
            <MenuItem value="INACTIVE">Inactivos</MenuItem>
          </TextField>
          <FormControlLabel
            className="inventoryLowStockToggle"
            control={
              <Switch
                checked={onlyLowStock}
                onChange={(event) => setOnlyLowStock(event.target.checked)}
              />
            }
            label="Solo stock bajo"
          />
          <Button
            variant="text"
            color="inherit"
            disabled={!hasFiltersApplied}
            onClick={() => {
              setSearchValue("");
              setStatusFilter("ALL");
              setOnlyLowStock(false);
            }}
          >
            Limpiar filtros
          </Button>
        </Stack>
      </Paper>

      <Paper className="inventoryTablePaper">
        <TableContainer className="inventoryTableContainer custom-scrollbar">
          <Table stickyHeader className="inventoryTable">
            <TableHead>
              <TableRow>
                <TableCell>Imagen</TableCell>
                <TableCell>Producto</TableCell>
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
                  <TableCell colSpan={8} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                      <CircularProgress size={24} />
                      <Typography variant="body2" color="text.secondary">
                        Cargando productos...
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && (products?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && (products?.length ?? 0) > 0 && filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay resultados para los filtros seleccionados
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {resolveImageSrc(product.imageBase64) ? (
                        <Box
                          component="img"
                          src={resolveImageSrc(product.imageBase64) ?? undefined}
                          alt={`Imagen de ${product.name}`}
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 1.5,
                            objectFit: "cover",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 1.5,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "grey.100",
                            color: "text.secondary",
                            border: "1px dashed",
                            borderColor: "divider",
                            fontSize: 11,
                          }}
                        >
                          Sin imagen
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{product.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Codigo: {product.code}
                      </Typography>
                      {product.description ? (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {product.description}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{product.currentQuantity}</Typography>
                      <Chip
                        size="small"
                        color={getStockState(product).color}
                        label={getStockState(product).label}
                        sx={{ mt: 0.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.minimumQuantity} / {product.maximumQuantity}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={product.isActive ? "success" : "default"}
                        label={product.isActive ? "Activo" : "Inactivo"}
                        variant={product.isActive ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center" flexWrap="wrap">
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<VisibilityIcon />}
                          onClick={() => openViewModal(product)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<EditIcon />}
                          onClick={() => openEditModal(product)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="text"
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
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button component="label" variant="outlined">
                <span>Cargar imagen</span>
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    void handleImageFileChange(event);
                  }}
                />
              </Button>
              <Button
                variant="text"
                color="inherit"
                disabled={!formState.imageBase64}
                onClick={() => handleFieldChange("imageBase64", "")}
              >
                Quitar imagen
              </Button>
              <Typography variant="body2" color="text.secondary">
                {formState.imageBase64
                  ? "Imagen lista en base64"
                  : "Sin imagen cargada"}
              </Typography>
            </Stack>
            {resolveImageSrc(formState.imageBase64) ? (
              <Box
                component="img"
                src={resolveImageSrc(formState.imageBase64) ?? undefined}
                alt="Vista previa de producto"
                sx={{
                  width: "100%",
                  maxWidth: 220,
                  borderRadius: 1,
                  objectFit: "cover",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              />
            ) : null}
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
          {isLoadingViewedProduct && (
            <Stack direction="row" spacing={1} alignItems="center" mt={1}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Cargando detalle...
              </Typography>
            </Stack>
          )}

          {!isLoadingViewedProduct && productForView && (
            <Stack spacing={1.5} mt={1} className="inventoryDetailContent">
              <Box className="inventoryDetailHero">
                {resolveImageSrc(productForView.imageBase64) ? (
                  <Box
                    component="img"
                    src={resolveImageSrc(productForView.imageBase64) ?? undefined}
                    alt={`Imagen de ${productForView.name}`}
                    className="inventoryDetailImage"
                  />
                ) : (
                  <Box className="inventoryDetailImagePlaceholder">Sin imagen</Box>
                )}

                <Stack spacing={0.75} minWidth={0}>
                  <Typography variant="h6" className="inventoryDetailName">
                    {productForView.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Codigo: {productForView.code}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      size="small"
                      color={productForView.isActive ? "success" : "default"}
                      label={productForView.isActive ? "Activo" : "Inactivo"}
                      variant={productForView.isActive ? "filled" : "outlined"}
                    />
                    <Chip
                      size="small"
                      color={getStockState(productForView).color}
                      label={getStockState(productForView).label}
                    />
                  </Stack>
                  <Typography className="inventoryDetailPrice">
                    {formatCurrency(productForView.price)}
                  </Typography>
                </Stack>
              </Box>

              <Box className="inventoryDetailSection">
                <Typography className="inventoryDetailSectionTitle">Descripcion</Typography>
                <Typography color="text.secondary">
                  {productForView.description?.trim() || "Sin descripcion"}
                </Typography>
              </Box>

              <Box className="inventoryDetailStockGrid">
                <Box className="inventoryDetailStockCard">
                  <Typography className="inventoryDetailStockLabel">Stock actual</Typography>
                  <Typography className="inventoryDetailStockValue">
                    {productForView.currentQuantity}
                  </Typography>
                </Box>
                <Box className="inventoryDetailStockCard">
                  <Typography className="inventoryDetailStockLabel">Minimo</Typography>
                  <Typography className="inventoryDetailStockValue">
                    {productForView.minimumQuantity}
                  </Typography>
                </Box>
                <Box className="inventoryDetailStockCard">
                  <Typography className="inventoryDetailStockLabel">Maximo</Typography>
                  <Typography className="inventoryDetailStockValue">
                    {productForView.maximumQuantity}
                  </Typography>
                </Box>
              </Box>

              <Box className="inventoryDetailSection">
                <Typography className="inventoryDetailSectionTitle">
                  Historial de Precios
                </Typography>

                {(productForView.priceHistory?.length ?? 0) === 0 ? (
                  <Typography color="text.secondary">
                    Aun no hay cambios de precio registrados.
                  </Typography>
                ) : (
                  <Stack spacing={1} mt={0.5}>
                    {productForView.priceHistory?.map((entry) => (
                      <Box key={entry.id} className="inventoryHistoryItem">
                        <Typography className="inventoryHistoryDate">
                          {formatDateTime(entry.changedAt)}
                        </Typography>
                        <Typography className="inventoryHistoryRow">
                          {`${formatCurrency(entry.previousPrice)} -> ${formatCurrency(entry.newPrice)}`}
                        </Typography>
                        <Typography className="inventoryHistoryUser" color="text.secondary">
                          Usuario: {entry.changedBy}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
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
