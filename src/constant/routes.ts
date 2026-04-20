import { roles } from "../utils/role.utils";

export const PAGE_ROUTES = {
  Login: "/login",
  Register: "/register",
  ForgotPassword: "/forgot-password",
  ResetPassword: "/reset-password",
  Forbidden: "/sin-permiso",
  Home: "/home",
  Teteria: "/teteria",
  Reservas: "/reservas",
  EventosTickets: "/eventos-tickets",
  Inventario: "/inventario",
  ReporteVentas: "/reporte-ventas",
  Empleados: "/empleados",
  Migraciones: "/migraciones",
  PublicReservas: "/publico/reservas",
  PublicCarta: "/publico/carta",
};

export const topbarOptions = [
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
  {
    name: "Cerrar Sesión",
    path: PAGE_ROUTES.Login,
    canAccess: [roles.SUPER_ADMIN, roles.ADMIN, roles.TEC],
    icon: "logout",
  },
];
