export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  minimumQuantity: number;
  currentQuantity: number;
  maximumQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  code: string;
  name: string;
  description?: string;
  price: number;
  minimumQuantity: number;
  currentQuantity: number;
  maximumQuantity: number;
  isActive?: boolean;
}

export interface UpdateProductPayload {
  code?: string;
  name?: string;
  description?: string;
  price?: number;
  minimumQuantity?: number;
  currentQuantity?: number;
  maximumQuantity?: number;
  isActive?: boolean;
}

export interface RemoveResponse {
  message: string;
}

export interface AuthRole {
  id: string;
  name: string;
}

export interface AuthUser {
  id: string;
  username: string | null;
  first_name: string;
  last_name: string | null;
  email: string;
  isActive: boolean;
  role: AuthRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  roleName?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
  expiresAt?: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TrabajadorDocumento {
  id: string;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoMime: string | null;
  tamanoBytes: number | null;
  descripcion: string | null;
  createdAt: string;
}

export interface Trabajador {
  id: string;
  userId: string;
  rut: string;
  comuna: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  edad: number;
  sueldo: number;
  fotoUrl: string | null;
  documentos: TrabajadorDocumento[];
  createdAt: string;
  updatedAt: string;
}

export interface EmpleadoUser {
  id: string;
  username: string | null;
  first_name: string;
  last_name: string | null;
  email: string;
  isActive: boolean;
  role: AuthRole;
  createdAt: string;
  updatedAt: string;
  trabajador: Trabajador | null;
}

export interface FindEmpleadoUsersFilters {
  page?: number;
  limit?: number;
  firstName?: string;
  lastName?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface EmpleadoUsersResponse {
  items: EmpleadoUser[];
  pagination: PaginationResponse;
}

export interface TrabajadorDocumentoPayload {
  nombreArchivo: string;
  rutaArchivo: string;
  tipoMime?: string;
  tamanoBytes?: number;
  descripcion?: string;
}

export interface CreateTrabajadorPayload {
  userId: string;
  rut: string;
  comuna: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  edad: number;
  sueldo: number;
  fotoUrl?: string;
  documentos?: TrabajadorDocumentoPayload[];
}

export interface UpdateTrabajadorPayload {
  rut?: string;
  comuna?: string;
  direccion?: string;
  telefono?: string;
  fechaNacimiento?: string;
  edad?: number;
  sueldo?: number;
  fotoUrl?: string;
  documentos?: TrabajadorDocumentoPayload[];
}

export type OrderStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "SERVED"
  | "PAID"
  | "CANCELLED";

export type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "OUT_OF_SERVICE";

export type ReservationStatus = "ACTIVE" | "CANCELLED" | "COMPLETED";

export type EventStatus =
  | "ENABLED"
  | "CANCELLED"
  | "SUSPENDED"
  | "RESCHEDULED";

export type EventTicketStatus = "ACTIVE" | "CANCELLED";

export type EventTicketMenuMode = "FIXED" | "CUSTOMIZABLE";

export interface TableLayout {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  tables?: RestaurantTable[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLayoutPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateLayoutPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface LayoutSnapshotGridSize {
  rows: number;
  cols: number;
}

export interface LayoutSnapshotChair {
  id: string;
  position: { x: number; y: number };
  rotation?: number;
}

export interface LayoutSnapshotTable {
  id?: string;
  code: string;
  label?: string;
  capacity?: number;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  rotation?: number;
  status?: TableStatus;
}

export interface SaveLayoutSnapshotPayload {
  name: string;
  isActive?: boolean;
  gridSize: LayoutSnapshotGridSize;
  chairs?: LayoutSnapshotChair[];
  tables: LayoutSnapshotTable[];
}

export interface RestaurantTable {
  id: string;
  layoutId: string;
  layout: TableLayout;
  code: string;
  label: string | null;
  capacity: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTablePayload {
  layoutId: string;
  code: string;
  label?: string;
  capacity?: number;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  rotation?: number;
  status?: TableStatus;
}

export interface UpdateTablePayload {
  layoutId?: string;
  code?: string;
  label?: string;
  capacity?: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  status?: TableStatus;
}

export interface Reservation {
  id: string;
  tableId: string;
  table: RestaurantTable;
  reservedFor: string;
  peopleCount: number;
  holderName: string | null;
  guestNames: string[];
  notes: string | null;
  waitingUntil?: string | null;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationPayload {
  tableId: string;
  reservedFor: string;
  peopleCount: number;
  holderName?: string;
  guestNames?: string[];
  notes?: string;
}

export interface UpdateReservationPayload {
  tableId?: string;
  reservedFor?: string;
  waitingUntil?: string | null;
  peopleCount?: number;
  holderName?: string;
  guestNames?: string[];
  notes?: string;
  status?: ReservationStatus;
}

export interface FindReservationsFilters {
  tableId?: string;
  status?: ReservationStatus;
  startDate?: string;
  endDate?: string;
}

export interface EventTicketTypeDailyStock {
  id: string;
  ticketTypeId: string;
  date: string;
  quantity: number;
}

export interface EventTicketMenuOption {
  id: string;
  label: string;
  extraPrice: number;
  isActive: boolean;
}

export interface EventTicketMenuGroup {
  key: string;
  label: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: EventTicketMenuOption[];
}

export interface EventTicketMenuTemplate {
  groups: EventTicketMenuGroup[];
}

export interface EventTicketMenuSelectionGroup {
  groupKey: string;
  optionIds: string[];
}

export interface EventTicketMenuSelection {
  groups: EventTicketMenuSelectionGroup[];
}

export interface EventTicketType {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: number;
  includesDetails: string | null;
  menuMode: EventTicketMenuMode;
  menuTemplate: EventTicketMenuTemplate | null;
  totalStock: number | null;
  isPromotional: boolean;
  promoMinQuantity: number | null;
  promoBundlePrice: number | null;
  dailyStocks: EventTicketTypeDailyStock[];
  createdAt: string;
  updatedAt: string;
}

export interface VenueEvent {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  officialImageUrl: string | null;
  status: EventStatus;
  totalTickets: number;
  soldTickets: number;
  isFreeEntry: boolean;
  ticketTypes: EventTicketType[];
  createdAt: string;
  updatedAt: string;
}

export interface EventTicket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  ticketType: EventTicketType;
  attendeeFirstName: string;
  attendeeLastName: string;
  attendanceDate: string;
  price: number;
  includesDetails: string | null;
  menuSelection: EventTicketMenuSelection | null;
  menuSelectionSnapshot: {
    groups: Array<{
      groupKey: string;
      groupLabel: string;
      selectedOptions: Array<{
        id: string;
        label: string;
        extraPrice: number;
      }>;
    }>;
    totalExtraPrice: number;
  } | null;
  menuExtraPrice: number;
  status: EventTicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventTicketTypeDailyStockPayload {
  date: string;
  quantity: number;
}

export interface EventTicketTypePayload {
  name: string;
  description?: string;
  price: number;
  includesDetails?: string;
  menuMode?: EventTicketMenuMode;
  menuTemplate?: EventTicketMenuTemplate;
  totalStock?: number;
  isPromotional?: boolean;
  promoMinQuantity?: number;
  promoBundlePrice?: number;
  dailyStocks?: EventTicketTypeDailyStockPayload[];
}

export interface CreateVenueEventPayload {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  officialImageUrl?: string;
  status?: EventStatus;
  isFreeEntry?: boolean;
  ticketTypes: EventTicketTypePayload[];
}

export interface UpdateVenueEventPayload {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  officialImageUrl?: string;
  status?: EventStatus;
  isFreeEntry?: boolean;
  ticketTypes?: EventTicketTypePayload[];
}

export interface UpdateEventStatusPayload {
  status: EventStatus;
}

export interface FindEventsFilters {
  status?: EventStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateEventTicketPayload {
  ticketTypeId: string;
  attendeeFirstName: string;
  attendeeLastName: string;
  attendanceDate: string;
  quantity?: number;
  applyPromotion?: boolean;
  price?: number;
  includesDetails?: string;
  menuSelection?: EventTicketMenuSelection;
}

export interface UpdateEventTicketPayload {
  ticketTypeId?: string;
  attendeeFirstName?: string;
  attendeeLastName?: string;
  attendanceDate?: string;
  price?: number;
  includesDetails?: string;
  menuSelection?: EventTicketMenuSelection;
  status?: EventTicketStatus;
}

export interface FindEventTicketsFilters {
  ticketTypeId?: string;
  attendanceDate?: string;
  status?: EventTicketStatus;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
}

export interface Order {
  id: string;
  tableId: string | null;
  table: RestaurantTable | null;
  reservationId: string | null;
  reservation: Reservation | null;
  status: OrderStatus;
  notes: string | null;
  peopleCount: number;
  total: number;
  items: OrderItem[];
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderPayload {
  tableId?: string;
  reservationId?: string;
  peopleCount?: number;
  notes?: string;
  items: CreateOrderItemPayload[];
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  reservationId?: string;
  peopleCount?: number;
  notes?: string;
  items?: CreateOrderItemPayload[];
}

export type OrderReportSortBy =
  | "createdAt"
  | "updatedAt"
  | "status"
  | "peopleCount"
  | "total"
  | "table";

export type OrderReportOrderDirection = "ASC" | "DESC";

export interface FindOrdersReportFilters {
  tableId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: OrderReportSortBy;
  orderDirection?: OrderReportOrderDirection;
}

export interface OrdersReportPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface OrdersMonthlySummaryItem {
  month: string;
  totalOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  totalSales: number;
  paidSales: number;
}

export interface OrdersReportTotals {
  totalOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  totalSales: number;
  paidSales: number;
}

export interface OrdersReportResponse {
  items: Order[];
  pagination: OrdersReportPagination;
  monthlySummary: OrdersMonthlySummaryItem[];
  totals: OrdersReportTotals;
}

export type MigrationOrder = "asc" | "desc";

export type MigrationAction = "EXECUTE" | "REVERT";

export interface MigrationStatusItem {
  name: string;
  timestamp: string | null;
}

export interface MigrationsStatusSummary {
  totalExecuted: number;
  totalPending: number;
  totalMigrations: number;
}

export interface MigrationsStatusResponse {
  executed: MigrationStatusItem[];
  pending: MigrationStatusItem[];
  order: MigrationOrder;
  summary: MigrationsStatusSummary;
}

export interface MigrationAuditUser {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
}

export interface MigrationHistoryItem {
  id: string;
  migrationName: string;
  action: MigrationAction;
  userId: string | null;
  user: MigrationAuditUser | null;
  details: Record<string, unknown> | null;
  success: boolean;
  errorMessage: string | null;
  executedAt: string;
}

export interface MigrationActionResponse {
  success: boolean;
  message: string;
  migration?: string;
  executedBy?: string;
  revertedBy?: string;
  auditId?: string;
}

export interface MigrationBatchResponse {
  success: boolean;
  message: string;
  executedMigrations?: string[];
  reverted?: boolean;
}
