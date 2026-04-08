import { createElement, lazy, type ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PAGE_ROUTES } from "../constant/routes";
import { roles } from "../utils/role.utils";

// Layouts
const BodyLayout = lazy(() =>
  import("../components/layout/MainLayout.tsx").then((module) => ({
    default: module.BodyLayout,
  })),
);

// Views
const TeaRoomView = lazy(() =>
  import("../views/TeaRoomView.tsx").then((module) => ({
    default: module.TeaRoomView,
  })),
);

const InventoryView = lazy(() =>
  import("../views/InventoryView.tsx").then((module) => ({
    default: module.InventoryView,
  })),
);

const ReservationsView = lazy(() =>
  import("../views/ReservationsView.tsx").then((module) => ({
    default: module.ReservationsView,
  })),
);

const EventsTicketsView = lazy(() =>
  import("../views/EventsTicketsView.tsx").then((module) => ({
    default: module.EventsTicketsView,
  })),
);

const SalesReportView = lazy(() =>
  import("../views/SalesReportView.tsx").then((module) => ({
    default: module.SalesReportView,
  })),
);

const EmpleadosView = lazy(() =>
  import("../views/EmpleadosView.tsx").then((module) => ({
    default: module.EmpleadosView,
  })),
);

const MigrationsView = lazy(() =>
  import("../views/MigrationsView.tsx").then((module) => ({
    default: module.MigrationsView,
  })),
);

const LoginView = lazy(() =>
  import("../views/auth/LoginView.tsx").then((module) => ({
    default: module.LoginView,
  })),
);

const RegisterView = lazy(() =>
  import("../views/auth/RegisterView.tsx").then((module) => ({
    default: module.RegisterView,
  })),
);

const ForgotPasswordView = lazy(() =>
  import("../views/auth/ForgotPasswordView.tsx").then((module) => ({
    default: module.ForgotPasswordView,
  })),
);

const ResetPasswordView = lazy(() =>
  import("../views/auth/ResetPasswordView.tsx").then((module) => ({
    default: module.ResetPasswordView,
  })),
);

const ForbiddenView = lazy(() =>
  import("../views/auth/ForbiddenView.tsx").then((module) => ({
    default: module.ForbiddenView,
  })),
);

const withRoles = (
  View: ComponentType,
  allowedRoles: string[],
  redirectPath = PAGE_ROUTES.Forbidden,
) => {
  const ProtectedView = () =>
    createElement(
      ProtectedRoute,
      { allowedRoles, redirectPath },
      createElement(View),
    );

  return ProtectedView;
};

const AuthenticatedLayout = () =>
  createElement(
    ProtectedRoute,
    { allowedRoles: [], redirectPath: PAGE_ROUTES.Login },
    createElement(BodyLayout),
  );

const TeaRoomProtected = withRoles(TeaRoomView, [
  roles.SUPER_ADMIN,
  roles.ADMIN,
  roles.TEC,
]);
const ReservationsProtected = withRoles(ReservationsView, [
  roles.SUPER_ADMIN,
  roles.ADMIN,
  roles.TEC,
]);
const EventsTicketsProtected = withRoles(EventsTicketsView, [
  roles.SUPER_ADMIN,
  roles.ADMIN,
  roles.TEC,
]);
const InventoryProtected = withRoles(InventoryView, [
  roles.SUPER_ADMIN,
  roles.ADMIN,
]);
const SalesReportProtected = withRoles(SalesReportView, [
  roles.SUPER_ADMIN,
  roles.ADMIN,
]);
const EmpleadosProtected = withRoles(EmpleadosView, [roles.SUPER_ADMIN]);
const MigrationsProtected = withRoles(MigrationsView, [roles.SUPER_ADMIN]);

const DefaultRedirect = () => createElement(Navigate, { to: "/", replace: true });

export const router = createBrowserRouter(
  [
    {
      path: PAGE_ROUTES.Login,
      Component: LoginView,
    },
    {
      path: PAGE_ROUTES.Register,
      Component: RegisterView,
    },
    {
      path: PAGE_ROUTES.ForgotPassword,
      Component: ForgotPasswordView,
    },
    {
      path: `${PAGE_ROUTES.ResetPassword}/:token?`,
      Component: ResetPasswordView,
    },
    {
      path: PAGE_ROUTES.Forbidden,
      Component: ForbiddenView,
    },
    {
      path: "/",
      Component: AuthenticatedLayout,
      children: [
        {
          index: true,
          Component: TeaRoomProtected,
        },
        {
          path: PAGE_ROUTES.Reservas,
          Component: ReservationsProtected,
        },
        {
          path: PAGE_ROUTES.EventosTickets,
          Component: EventsTicketsProtected,
        },
        {
          path: PAGE_ROUTES.Inventario,
          Component: InventoryProtected,
        },
        {
          path: PAGE_ROUTES.ReporteVentas,
          Component: SalesReportProtected,
        },
        {
          path: PAGE_ROUTES.Empleados,
          Component: EmpleadosProtected,
        },
        {
          path: PAGE_ROUTES.Migraciones,
          Component: MigrationsProtected,
        },
      ],
    },
    {
      path: "*",
      Component: DefaultRedirect,
    },
  ],
  { basename: "/" },
);
