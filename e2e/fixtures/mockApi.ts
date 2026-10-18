import type { Page, Route } from "@playwright/test";

// Dense API fixtures shared by the mobile audits. Read-only: they only feed
// page.route() interception, nothing is written to the backend.

const iso = (d: string) => `${d}T00:00:00.000Z`;

const layout = {
  id: "layout-1",
  name: "Salon principal",
  description: null,
  isActive: true,
  createdAt: iso("2026-01-01"),
  updatedAt: iso("2026-01-01"),
};

const mkTable = (i: number) => ({
  id: `table-${i}`,
  layoutId: layout.id,
  layout,
  code: `MESA_${i}`,
  label: `Mesa ${i} terraza norte`,
  capacity: 4,
  positionX: (i % 5) * 2,
  positionY: Math.floor(i / 5) * 2,
  width: 1,
  height: 1,
  rotation: 0,
  status: "AVAILABLE" as const,
  createdAt: iso("2026-01-01"),
  updatedAt: iso("2026-01-01"),
});

const TABLES = Array.from({ length: 10 }, (_, i) => mkTable(i + 1));

const mkProduct = (i: number) => ({
  id: `prod-${i}`,
  name:
    i % 3 === 0
      ? `Té verde sencha premium importado edición ${i}`
      : `Producto ${i}`,
  description: "Descripción larga de producto para forzar el ancho de la celda.",
  imageId: null,
  imageUrl: null,
  price: 4990 + i * 137,
  minimumQuantity: 5,
  currentQuantity: i % 4 === 0 ? 2 : 40 + i,
  maximumQuantity: 200,
  isActive: i % 5 !== 0,
  createdAt: iso("2026-02-01"),
  updatedAt: iso("2026-02-01"),
});

const PRODUCTS = Array.from({ length: 12 }, (_, i) => mkProduct(i + 1));

const mkOrder = (i: number) => ({
  id: `order-${i}`,
  tableId: `table-${(i % 10) + 1}`,
  table: TABLES[i % 10],
  reservationId: null,
  reservation: null,
  status: (["PAID", "OPEN", "CANCELLED", "SERVED"] as const)[i % 4],
  notes: i % 3 === 0 ? "Cliente pidió sin azúcar y servicio para llevar" : null,
  peopleCount: (i % 6) + 1,
  total: 15990 + i * 2350,
  tipAmount: i % 2 === 0 ? 1500 : null,
  paymentMethod: (["CASH", "CARD"] as const)[i % 2],
  items: [
    {
      id: `item-${i}`,
      orderId: `order-${i}`,
      productId: "prod-1",
      product: PRODUCTS[0],
      quantity: 2,
      unitPrice: 4990,
      subtotal: 9980,
      notes: null,
    },
  ],
  closedAt: iso("2026-08-05"),
  createdAt: `2026-08-0${(i % 5) + 1}T14:${String((i % 6) * 10).padStart(2, "0")}:00.000Z`,
  updatedAt: iso("2026-08-05"),
});

const ORDERS = Array.from({ length: 10 }, (_, i) => mkOrder(i + 1));

const ORDERS_REPORT = {
  items: ORDERS,
  pagination: { page: 1, limit: 10, totalItems: 34, totalPages: 4 },
  monthlySummary: [
    {
      month: "2026-07",
      totalOrders: 120,
      paidOrders: 111,
      cancelledOrders: 9,
      totalSales: 2489000,
      paidSales: 2311000,
    },
    {
      month: "2026-08",
      totalOrders: 34,
      paidOrders: 30,
      cancelledOrders: 4,
      totalSales: 894500,
      paidSales: 812300,
    },
  ],
  totals: {
    totalOrders: 154,
    paidOrders: 141,
    cancelledOrders: 13,
    totalSales: 3383500,
    paidSales: 3123300,
    paidWithTip: 74,
    paidWithoutTip: 67,
    paidCash: 61,
    paidCard: 80,
  },
};

const mkReservation = (i: number) => ({
  id: `res-${i}`,
  tableId: `table-${(i % 10) + 1}`,
  table: TABLES[i % 10],
  reservedFor: `2026-08-0${(i % 6) + 1}T19:30:00.000Z`,
  peopleCount: (i % 8) + 1,
  holderName:
    i % 2 === 0
      ? "María Fernanda del Carmen Rodríguez Muñoz"
      : `Cliente ${i}`,
  email: `cliente${i}@correoparticularmuylargo.com`,
  phone: "+56 9 8765 4321",
  guestNames: ["Ana Sofía Pérez", "Luis Ignacio Contreras"],
  notes:
    i % 3 === 0
      ? "Celebración de cumpleaños, requieren torta y decoración especial"
      : null,
  waitingUntil: null,
  status: "ACTIVE" as const,
  confirmationStatus: (["CONFIRMED", "PENDING", "NO_RESPONSE"] as const)[i % 3],
  comprobanteImageId: null,
  comprobanteImage: null,
  createdAt: iso("2026-08-01"),
  updatedAt: iso("2026-08-01"),
});

const RESERVATIONS = Array.from({ length: 8 }, (_, i) => mkReservation(i + 1));

const mkTicketType = (eventId: string, i: number) => ({
  id: `tt-${eventId}-${i}`,
  eventId,
  name: `Entrada general con degustación incluida ${i}`,
  description: "Incluye tetera individual, dos infusiones y pastelería.",
  price: 18990 + i * 1000,
  includesDetails: "Tetera + 2 infusiones + pastelería del día",
  menuMode: "FIXED" as const,
  menuTemplate: null,
  totalStock: 60,
  isPromotional: i === 2,
  promoMinQuantity: i === 2 ? 2 : null,
  promoBundlePrice: i === 2 ? 32990 : null,
  dailyStocks: [],
  customTicketTemplateUrl: null,
  createdAt: iso("2026-07-01"),
  updatedAt: iso("2026-07-01"),
});

const mkEvent = (i: number) => {
  const id = `event-${i}`;
  return {
    id,
    title: `Taller de cerámica y té de la tarde — edición ${i}`,
    description:
      "Una experiencia sensorial de tres horas donde combinamos alfarería, cata de infusiones y repostería artesanal.",
    startsAt: `2026-08-1${i}T18:00:00.000Z`,
    endsAt: `2026-08-1${i}T21:00:00.000Z`,
    officialImageUrl: null,
    status: (["ENABLED", "COMING_SOON", "SUSPENDED"] as const)[i % 3],
    publishAt: null,
    totalTickets: 60,
    soldTickets: 12 * i,
    isFreeEntry: false,
    hasSessions: true,
    ticketTypes: [mkTicketType(id, 1), mkTicketType(id, 2)],
    sessions: [
      {
        id: `sess-${id}-1`,
        eventId: id,
        date: `2026-08-1${i}`,
        startTime: "18:00",
        endTime: "21:00",
        capacity: 30,
        name: "Jornada tarde",
        allocations: [],
        createdAt: iso("2026-07-01"),
        updatedAt: iso("2026-07-01"),
      },
    ],
    createdAt: iso("2026-07-01"),
    updatedAt: iso("2026-07-01"),
  };
};

const EVENTS = [mkEvent(1), mkEvent(2), mkEvent(3)];

const PUBLIC_EVENTS = EVENTS.map((e) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  startsAt: e.startsAt,
  endsAt: e.endsAt,
  officialImageUrl: null,
  schedules: [{ date: e.sessions[0].date, startTime: "18:00", endTime: "21:00" }],
  ticketsAvailable: true,
}));

const PUBLIC_EVENT_DETAIL = {
  id: EVENTS[0].id,
  title: EVENTS[0].title,
  description: EVENTS[0].description,
  startsAt: EVENTS[0].startsAt,
  endsAt: EVENTS[0].endsAt,
  officialImageUrl: null,
  isFreeEntry: false,
  hasSessions: true,
  seatsRemaining: 18,
  ticketTypes: EVENTS[0].ticketTypes.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    price: t.price,
    includesDetails: t.includesDetails,
    menuMode: t.menuMode,
    menuTemplate: null,
    available: true,
    remaining: 18,
  })),
  sessions: [
    {
      id: `sess-${EVENTS[0].id}-1`,
      date: "2026-08-11",
      startTime: "18:00",
      endTime: "21:00",
      name: "Jornada tarde",
      available: true,
      remaining: 18,
      seatsRemaining: 18,
      ticketTypes: EVENTS[0].ticketTypes.map((t) => ({
        ticketTypeId: t.id,
        available: true,
        remaining: 18,
      })),
    },
  ],
};

const EMPLEADOS = {
  items: Array.from({ length: 8 }, (_, i) => ({
    id: `user-${i}`,
    username: `usuario.trabajador.${i}`,
    first_name: "María Fernanda",
    last_name: "Rodríguez Muñoz",
    email: `trabajador${i}@teteriaencantada.cl`,
    isActive: true,
    role: { id: "r1", name: i === 0 ? "SUPER_ADMIN" : "TEC" },
    createdAt: iso("2026-03-01"),
    updatedAt: iso("2026-03-01"),
    trabajador: {
      id: `t-${i}`,
      userId: `user-${i}`,
      rut: "18.456.789-0",
      telefono: "+56 9 8765 4321",
      comuna: "Providencia",
      direccion: "Av. Providencia 1234, depto 501",
      fechaNacimiento: iso("1995-05-12"),
      edad: 31,
      sueldo: 850000,
      fotoUrl: null,
      createdAt: iso("2026-03-01"),
      updatedAt: iso("2026-03-01"),
    },
  })),
  pagination: { page: 1, limit: 10, totalItems: 8, totalPages: 1 },
};

const SCHEDULE = Array.from({ length: 7 }, (_, d) => ({
  id: `sch-${d}`,
  dayOfWeek: d,
  isOpen: d !== 1,
  opensAt: "11:00",
  closesAt: "22:00",
}));

const json = (route: Route, body: unknown) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

export const installMocks = async (page: Page) => {
  const rules: Array<[RegExp, unknown]> = [
    [/\/api\/orders\/report(\?|$)/, ORDERS_REPORT],
    [/\/api\/orders(\?|$)/, ORDERS],
    [/\/api\/products(\?|$)/, PRODUCTS],
    [/\/api\/tables(\?|$)/, TABLES],
    [/\/api\/layouts(\?|$)/, [{ ...layout, tables: TABLES }]],
    [/\/api\/reservations\/schedule(\?|$)/, SCHEDULE],
    [/\/api\/reservations(\?|$)/, RESERVATIONS],
    [/\/api\/events\/[^/]+\/tickets(\?|$)/, []],
    [/\/api\/events\/[^/?]+(\?|$)/, EVENTS[0]],
    [/\/api\/events(\?|$)/, EVENTS],
    [/\/api\/public\/events\/[^/?]+(\?|$)/, PUBLIC_EVENT_DETAIL],
    [/\/api\/public\/events(\?|$)/, PUBLIC_EVENTS],
    [/\/api\/public\/tables(\?|$)/, TABLES],
    [/\/api\/trabajadores\/users(\?|$)/, EMPLEADOS],
  ];

  await page.route("**/api/**", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const url = route.request().url();
    for (const [re, body] of rules) {
      if (re.test(url)) return json(route, body);
    }
    return route.fallback();
  });
};

