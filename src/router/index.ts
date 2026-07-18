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
  import("../views/TeaRoomView/TeaRoomView.tsx").then((module) => ({
    default: module.TeaRoomView,
  })),
);

const InventoryView = lazy(() =>
  import("../views/admin/EmployeesView/InventoryView.tsx").then((module) => ({
    default: module.InventoryView,
  })),
);

const ReservationsView = lazy(() =>
  import("../views/ReservationsView/ReservationsView.tsx").then((module) => ({
    default: module.ReservationsView,
  })),
);

const EventsTicketsView = lazy(() =>
  import("../views/EventsTicketsView/EventsTicketsView.tsx").then((module) => ({
    default: module.EventsTicketsView,
  })),
);

const SalesReportView = lazy(() =>
  import("../views/SalesView/SalesReportView.tsx").then((module) => ({
    default: module.SalesReportView,
  })),
);

const EmpleadosView = lazy(() =>
  import("../views/admin/EmployeesView/EmpleadosView.tsx").then((module) => ({
    default: module.EmpleadosView,
  })),
);

const MigrationsView = lazy(() =>
  import("../views/MigrationsView/MigrationsView.tsx").then((module) => ({
    default: module.MigrationsView,
  })),
);

const LoginView = lazy(() =>
  import("../views/auth/LoginView.tsx").then((module) => ({
    default: module.LoginView,
  })),
);

// const PublicLoginView = lazy(() =>
//   import("../views/auth/PublicLoginView.tsx").then((module) => ({
//     default: module.PublicLoginView,
//   })),
// );

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

const GoogleCallbackView = lazy(() =>
  import("../views/auth/GoogleCallbackView.tsx").then((module) => ({
    default: module.GoogleCallbackView,
  })),
);

const ForbiddenView = lazy(() =>
  import("../views/auth/ForbiddenView.tsx").then((module) => ({
    default: module.ForbiddenView,
  })),
);

// const PublicReservationsView = lazy(() =>
//   import("../views/public/reservations/PublicReservationsView.tsx").then(
//     (module) => ({
//       default: module.PublicReservationsView,
//     }),
//   ),
// );

// const PublicMenuView = lazy(() =>
//   import("../views/public/menu/PublicMenuView.tsx").then((module) => ({
//     default: module.PublicMenuView,
//   })),
// );

// const PublicLoyaltyView = lazy(() =>
//   import("../views/public/loyalty/PublicLoyaltyView.tsx").then((module) => ({
//     default: module.PublicLoyaltyView,
//   })),
// );

const PublicEventsView = lazy(() =>
  import("../views/public/events/PublicEventsView.tsx").then((module) => ({
    default: module.PublicEventsView,
  })),
);

const PublicCalendarView = lazy(() =>
  import("../views/public/calendar/PublicCalendarView.tsx").then((m) => ({
    default: m.PublicCalendarView,
  })),
);

const PublicEventDetailView = lazy(() =>
  import("../views/public/events/PublicEventDetailView.tsx").then((m) => ({
    default: m.PublicEventDetailView,
  })),
);
const PublicEventSessionView = lazy(() =>
  import("../views/public/events/PublicEventSessionView.tsx").then((m) => ({
    default: m.PublicEventSessionView,
  })),
);
const PublicEventReservaView = lazy(() =>
  import("../views/public/events/PublicEventReservaView.tsx").then((m) => ({
    default: m.PublicEventReservaView,
  })),
);
const PublicEventPagoView = lazy(() =>
  import("../views/public/events/PublicEventPagoView.tsx").then((m) => ({
    default: m.PublicEventPagoView,
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

const PublicLayout = lazy(() =>
  import("../components/layout/PublicLayout.tsx").then((module) => ({
    default: module.PublicLayout,
  })),
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
const EmpleadosProtected = withRoles(EmpleadosView, [
  roles.SUPER_ADMIN,
  roles.ADMIN,
  roles.TEC,
]);
const MigrationsProtected = withRoles(MigrationsView, [roles.SUPER_ADMIN]);

const DefaultRedirect = () =>
  createElement(Navigate, { to: "/", replace: true });

const PublicRedirect = () =>
  createElement(Navigate, { to: PAGE_ROUTES.PublicEvents, replace: true });

export const router = createBrowserRouter(
  [
    {
      path: PAGE_ROUTES.Login,
      Component: LoginView,
    },
    // {
    //   path: PAGE_ROUTES.PublicLogin,
    //   Component: PublicLoginView,
    // },
    {
      path: PAGE_ROUTES.ForgotPassword,
      Component: ForgotPasswordView,
    },
    {
      path: `${PAGE_ROUTES.ResetPassword}/:token?`,
      Component: ResetPasswordView,
    },
    {
      path: PAGE_ROUTES.GoogleCallback,
      Component: GoogleCallbackView,
    },
    {
      path: PAGE_ROUTES.Forbidden,
      Component: ForbiddenView,
    },
    {
      path: "/publico",
      Component: PublicLayout,
      children: [
        {
          index: true,
          Component: PublicRedirect,
        },
        {
          path: PAGE_ROUTES.PublicEvents,
          Component: PublicEventsView,
        },
        {
          path: PAGE_ROUTES.PublicCalendario,
          Component: PublicCalendarView,
        },
        {
          path: PAGE_ROUTES.PublicEventDetail,
          Component: PublicEventDetailView,
        },
        {
          path: PAGE_ROUTES.PublicEventSession,
          Component: PublicEventSessionView,
        },
        {
          path: PAGE_ROUTES.PublicEventReserva,
          Component: PublicEventReservaView,
        },
        {
          path: PAGE_ROUTES.PublicEventPago,
          Component: PublicEventPagoView,
        },
      ],
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
