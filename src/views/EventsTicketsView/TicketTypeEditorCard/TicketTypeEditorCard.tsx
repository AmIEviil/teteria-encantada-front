import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  parseLocalDateString,
  toLocalDateString,
} from "../../../utils/formatText.utils";
import { CustomCalendarV2 } from "../../../components/ui/calendar/CustomCalendarV2";
import { ImageUploadField } from "../../../components/ui/imageUpload/ImageUploadField";
import type { TicketTypeEditorCardProps } from "../../../service/events/events.interface";

export const TicketTypeEditorCard = ({
  ticketType,
  index,
  availableDateKeys,
  hideDailyStocks,
  onRemoveTicketType,
  onTicketTypeFieldChange,
  onAddDailyStock,
  onRemoveDailyStock,
  onDailyStockFieldChange,
  onAddMenuGroup,
  onRemoveMenuGroup,
  onMenuGroupFieldChange,
  onAddMenuOption,
  onRemoveMenuOption,
  onMenuOptionFieldChange,
}: TicketTypeEditorCardProps) => {
  return (
    <Paper variant="outlined" className="event-ticket-type-card">
      <Stack spacing={1.1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700}>Tipo {index + 1}</Typography>
          <IconButton
            onClick={() => onRemoveTicketType(ticketType.id)}
            aria-label={`Eliminar tipo ${index + 1}`}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
          <TextField
            label="Nombre"
            value={ticketType.name}
            onChange={(event) =>
              onTicketTypeFieldChange(ticketType.id, "name", event.target.value)
            }
            fullWidth
          />

          <TextField
            label="Precio"
            type="number"
            value={ticketType.price}
            onChange={(event) =>
              onTicketTypeFieldChange(ticketType.id, "price", event.target.value)
            }
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            fullWidth
          />

          <TextField
            label="Cupo total (opcional)"
            type="number"
            value={ticketType.totalStock}
            onChange={(event) =>
              onTicketTypeFieldChange(ticketType.id, "totalStock", event.target.value)
            }
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            fullWidth
          />
        </Stack>

        <TextField
          label="Descripcion"
          value={ticketType.description}
          onChange={(event) =>
            onTicketTypeFieldChange(ticketType.id, "description", event.target.value)
          }
          fullWidth
        />

        <ImageUploadField
          label="Plantilla de ticket (opcional)"
          value={
            ticketType.customTicketTemplateUrl
              ? { id: "", url: ticketType.customTicketTemplateUrl }
              : null
          }
          onChange={(image) =>
            onTicketTypeFieldChange(
              ticketType.id,
              "customTicketTemplateUrl",
              image?.url ?? "",
            )
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={ticketType.menuMode === "CUSTOMIZABLE"}
              onChange={(event) =>
                onTicketTypeFieldChange(
                  ticketType.id,
                  "menuMode",
                  event.target.checked ? "CUSTOMIZABLE" : "FIXED",
                )
              }
            />
          }
          label="Cena personalizada"
        />

        {ticketType.menuMode === "FIXED" ? (
          <TextField
            label="Que incluye"
            value={ticketType.includesDetails}
            onChange={(event) =>
              onTicketTypeFieldChange(ticketType.id, "includesDetails", event.target.value)
            }
            fullWidth
          />
        ) : (
          <Stack spacing={1.1}>
            <TextField
              label="Descripcion general (opcional)"
              value={ticketType.includesDetails}
              onChange={(event) =>
                onTicketTypeFieldChange(ticketType.id, "includesDetails", event.target.value)
              }
              fullWidth
            />

            <Divider />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={700}>Grupos de menu</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => onAddMenuGroup(ticketType.id)}
              >
                Agregar grupo
              </Button>
            </Stack>

            <Stack spacing={1}>
              {ticketType.menuTemplate.groups.map((group, groupIndex) => (
                <Paper key={group.id} variant="outlined" sx={{ p: 1.1 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={600}>Grupo {groupIndex + 1}</Typography>
                      <IconButton
                        onClick={() => onRemoveMenuGroup(ticketType.id, group.id)}
                        aria-label={`Eliminar grupo ${groupIndex + 1}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                      <TextField
                        label="Nombre del grupo"
                        value={group.label}
                        onChange={(event) =>
                          onMenuGroupFieldChange(
                            ticketType.id,
                            group.id,
                            "label",
                            event.target.value,
                          )
                        }
                        fullWidth
                      />

                      <TextField
                        label="Clave"
                        value={group.key}
                        onChange={(event) =>
                          onMenuGroupFieldChange(
                            ticketType.id,
                            group.id,
                            "key",
                            event.target.value,
                          )
                        }
                        fullWidth
                      />
                    </Stack>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                      <TextField
                        label="Minimo seleccion"
                        type="number"
                        value={group.minSelect}
                        onChange={(event) =>
                          onMenuGroupFieldChange(
                            ticketType.id,
                            group.id,
                            "minSelect",
                            event.target.value,
                          )
                        }
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                        fullWidth
                      />

                      <TextField
                        label="Maximo seleccion"
                        type="number"
                        value={group.maxSelect}
                        onChange={(event) =>
                          onMenuGroupFieldChange(
                            ticketType.id,
                            group.id,
                            "maxSelect",
                            event.target.value,
                          )
                        }
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                        fullWidth
                      />
                    </Stack>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={group.required}
                          onChange={(event) =>
                            onMenuGroupFieldChange(
                              ticketType.id,
                              group.id,
                              "required",
                              event.target.checked,
                            )
                          }
                        />
                      }
                      label="Grupo obligatorio"
                    />

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={600}>Opciones</Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => onAddMenuOption(ticketType.id, group.id)}
                      >
                        Agregar opcion
                      </Button>
                    </Stack>

                    <Stack spacing={0.9}>
                      {group.options.map((option, optionIndex) => (
                        <Stack
                          key={option.id}
                          direction={{ xs: "column", md: "row" }}
                          spacing={1}
                          alignItems={{ md: "center" }}
                        >
                          <TextField
                            label={`Opcion ${optionIndex + 1}`}
                            value={option.label}
                            onChange={(event) =>
                              onMenuOptionFieldChange(
                                ticketType.id,
                                group.id,
                                option.id,
                                "label",
                                event.target.value,
                              )
                            }
                            fullWidth
                          />

                          <TextField
                            label="ID opcion"
                            value={option.optionId}
                            onChange={(event) =>
                              onMenuOptionFieldChange(
                                ticketType.id,
                                group.id,
                                option.id,
                                "optionId",
                                event.target.value,
                              )
                            }
                            sx={{ minWidth: 160 }}
                          />

                          <TextField
                            label="Recargo"
                            type="number"
                            value={option.extraPrice}
                            onChange={(event) =>
                              onMenuOptionFieldChange(
                                ticketType.id,
                                group.id,
                                option.id,
                                "extraPrice",
                                event.target.value,
                              )
                            }
                            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                            sx={{ minWidth: 140 }}
                          />

                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={option.isActive}
                                onChange={(event) =>
                                  onMenuOptionFieldChange(
                                    ticketType.id,
                                    group.id,
                                    option.id,
                                    "isActive",
                                    event.target.checked,
                                  )
                                }
                              />
                            }
                            label="Activa"
                          />

                          <IconButton
                            onClick={() =>
                              onRemoveMenuOption(ticketType.id, group.id, option.id)
                            }
                            aria-label={`Eliminar opcion ${optionIndex + 1}`}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={ticketType.isPromotional}
              onChange={(event) =>
                onTicketTypeFieldChange(
                  ticketType.id,
                  "isPromotional",
                  event.target.checked,
                )
              }
            />
          }
          label="Ticket promocional"
        />

        {ticketType.isPromotional && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
            <TextField
              label="Cantidad minima promo"
              type="number"
              value={ticketType.promoMinQuantity}
              onChange={(event) =>
                onTicketTypeFieldChange(
                  ticketType.id,
                  "promoMinQuantity",
                  event.target.value,
                )
              }
              slotProps={{ htmlInput: { min: 2, step: 1 } }}
              fullWidth
            />

            <TextField
              label="Precio por bloque promo"
              type="number"
              value={ticketType.promoBundlePrice}
              onChange={(event) =>
                onTicketTypeFieldChange(
                  ticketType.id,
                  "promoBundlePrice",
                  event.target.value,
                )
              }
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              fullWidth
            />
          </Stack>
        )}

        {!hideDailyStocks && (
          <>
            <Divider />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={700}>Cupos por dia</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => onAddDailyStock(ticketType.id)}
              >
                Agregar dia
              </Button>
            </Stack>

            <Stack spacing={1}>
              {ticketType.dailyStocks.map((dailyStock, dailyStockIndex) => (
                <Stack
                  key={dailyStock.id}
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  alignItems={{ md: "center" }}
                >
                  <CustomCalendarV2
                    label={`Dia ${dailyStockIndex + 1}`}
                    placeholder="Selecciona fecha"
                    initialDate={parseLocalDateString(dailyStock.date) ?? undefined}
                    availableDates={availableDateKeys}
                    onSave={(date) => {
                      onDailyStockFieldChange(
                        ticketType.id,
                        dailyStock.id,
                        "date",
                        date ? toLocalDateString(date) : "",
                      );
                    }}
                  />

                  <TextField
                    label="Cantidad"
                    type="number"
                    value={dailyStock.quantity}
                    onChange={(event) =>
                      onDailyStockFieldChange(
                        ticketType.id,
                        dailyStock.id,
                        "quantity",
                        event.target.value,
                      )
                    }
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    sx={{ minWidth: 160 }}
                  />

                  <IconButton
                    onClick={() => onRemoveDailyStock(ticketType.id, dailyStock.id)}
                    aria-label={`Eliminar cupo del dia ${dailyStockIndex + 1}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
};
