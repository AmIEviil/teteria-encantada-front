import { roles } from "../utils/role.utils";

interface IRoute {
  name: string;
  path: string;
  icon: string;
  canAccess: string[];
  onClick?: () => void;
}

export const PAGE_ROUTES = {
  Login: "/login",
  PublicLogin: "/acceso",
  Register: "/register",
  ForgotPassword: "/forgot-password",
  ResetPassword: "/reset-password",
  GoogleCallback: "/auth/google/callback",
  Forbidden: "/sin-permiso",
  Home: "/home",
  Teteria: "/teteria",
  Reservas: "/reservas",
  EventosTickets: "/eventos-tickets",
  Inventario: "/inventario",
  ReporteVentas: "/reporte-ventas",
  Empleados: "/empleados",
  Migraciones: "/migraciones",
  Fidelizacion: "/fidelizacion",
  MisPuntos: "/mis-puntos",
  PublicReservas: "/publico/reservas",
  PublicEvents: "/publico/eventos",
  PublicCarta: "/publico/carta",
  PublicMisPuntos: "/publico/mis-puntos",
  PublicEventDetail: "/publico/eventos/:id",
  PublicEventSession: "/publico/eventos/:id/jornada/:sessionId",
  PublicEventReserva: "/publico/eventos/:id/reserva",
  PublicEventPago: "/publico/eventos/:id/pago",
};

export const topbarOptions: IRoute[] = [
  {
    name: "Inicio",
    path: "/",
    icon: "home",
    canAccess: [roles.SUPER_ADMIN, roles.ADMIN, roles.TEC],
  },
  // {
  //   name: "Clientes",
  //   path: PAGE_ROUTES.Teteria,
  //   icon: "tea",
  //   canAccess: [roles.SUPER_ADMIN, roles.ADMIN, roles.TEC],
  // },
  {
    name: "Reservas",
    path: PAGE_ROUTES.Reservas,
    icon: "reservations",
    canAccess: [roles.SUPER_ADMIN, roles.ADMIN, roles.TEC],
  },
  {
    name: "Eventos",
    path: PAGE_ROUTES.EventosTickets,
    icon: "events",
    canAccess: [roles.SUPER_ADMIN, roles.ADMIN, roles.TEC],
  },
  {
    name: "Inventario",
    path: PAGE_ROUTES.Inventario,
    icon: "inventory",
    canAccess: [roles.SUPER_ADMIN, roles.ADMIN],
  },
  {
    name: "Ventas",
    path: PAGE_ROUTES.ReporteVentas,
    icon: "sales",
    canAccess: [roles.SUPER_ADMIN, roles.ADMIN],
  },
  {
    name: "Empleados",
    path: PAGE_ROUTES.Empleados,
    canAccess: [roles.SUPER_ADMIN],
    icon: "employees",
  },
  {
    name: "Migraciones",
    path: PAGE_ROUTES.Migraciones,
    canAccess: [roles.SUPER_ADMIN],
    icon: "migration",
  },
  // {
  //   name: "Fidelización",
  //   path: PAGE_ROUTES.Fidelizacion,
  //   canAccess: [roles.SUPER_ADMIN, roles.ADMIN],
  //   icon: "loyalty",
  // },
  // {
  //   name: "Mis puntos",
  //   path: PAGE_ROUTES.MisPuntos,
  //   canAccess: [roles.SUPER_ADMIN, roles.ADMIN],
  //   icon: "loyalty",
  // },
  {
    name: "Cerrar Sesión",
    path: PAGE_ROUTES.Login,
    canAccess: [roles.SUPER_ADMIN, roles.ADMIN, roles.TEC],
    icon: "logout",
  },
];

export const publicTopbarOptions: IRoute[] = [
  {
    name: "Salon de eventos",
    path: PAGE_ROUTES.PublicReservas,
    canAccess: [],
    icon: "reservations",
  },
  {
    name: "Calendario Actividades",
    path: PAGE_ROUTES.PublicEvents,
    canAccess: [],
    icon: "events",
  },
  {
    name: "Instagram",
    path: PAGE_ROUTES.PublicCarta,
    onClick: () => {
      window.open("https://www.instagram.com/clubdearteyte/", "_blank");
    },
    canAccess: [],
    icon: "instagram",
  },
  {
    name: "Tiktok",
    path: PAGE_ROUTES.PublicMisPuntos,
    onClick: () => {
      window.open("https://www.tiktok.com/@clubdearteyte", "_blank");
    },
    canAccess: [],
    icon: "tiktok",
  },
  {
    name: "Galeria Fotos",
    path: PAGE_ROUTES.PublicMisPuntos,
    canAccess: [],
    icon: "gallery",
  },
];

export const publicEventPaths = {
  detail: (id: string) => `/publico/eventos/${id}`,
  session: (id: string, sessionId: string) =>
    `/publico/eventos/${id}/jornada/${sessionId}`,
  reserva: (id: string) => `/publico/eventos/${id}/reserva`,
  pago: (id: string) => `/publico/eventos/${id}/pago`,
};
