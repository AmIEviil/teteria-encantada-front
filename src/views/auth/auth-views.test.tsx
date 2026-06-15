import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const authMock = vi.hoisted(() => ({
  login: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock("../../core/api/auth.service", () => ({ authService: authMock }));

import { LoginView } from "./LoginView";
import { ForgotPasswordView } from "./ForgotPasswordView";
import { ResetPasswordView } from "./ResetPasswordView";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { useBoundStore } from "../../store/BoundedStore";

const wrap = (ui: React.ReactElement, route = "/") =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  useBoundStore.setState({
    isAuthenticated: false,
    userData: null,
    token: null,
  });
});

describe("LoginView", () => {
  it("valida campos cortos", () => {
    const { container } = wrap(<LoginView />);
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(
      screen.getByText("El usuario debe tener al menos 3 caracteres"),
    ).toBeInTheDocument();
  });

  it("login exitoso", async () => {
    authMock.login.mockResolvedValue({
      accessToken: "t",
      user: { role: { name: "Admin" } },
    });
    wrap(<LoginView />);
    fireEvent.change(screen.getByLabelText("Nombre de usuario"), {
      target: { value: "usuario" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => expect(authMock.login).toHaveBeenCalled());
  });

  it("login con error", async () => {
    authMock.login.mockRejectedValue(new Error("bad"));
    wrap(<LoginView />);
    fireEvent.change(screen.getByLabelText("Nombre de usuario"), {
      target: { value: "usuario" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.blur(screen.getByLabelText("Nombre de usuario"));
    fireEvent.click(screen.getByText("Iniciar sesión"));
    await waitFor(() => expect(screen.getByText("bad")).toBeInTheDocument());
  });
});

describe("ForgotPasswordView", () => {
  it("email invalido", () => {
    wrap(<ForgotPasswordView />);
    fireEvent.click(screen.getByText("Generar token"));
    expect(screen.getByText(/correo/i)).toBeInTheDocument();
  });

  it("genera token", async () => {
    authMock.forgotPassword.mockResolvedValue({
      message: "ok",
      resetToken: "tok",
    });
    wrap(<ForgotPasswordView />);
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "a@b.com" },
    });
    fireEvent.click(screen.getByText("Generar token"));
    await waitFor(() => expect(screen.getByText(/Token:/)).toBeInTheDocument());
  });

  it("error en servicio", async () => {
    authMock.forgotPassword.mockRejectedValue(new Error("falla"));
    wrap(<ForgotPasswordView />);
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "a@b.com" },
    });
    fireEvent.click(screen.getByText("Generar token"));
    await waitFor(() => expect(screen.getByText("falla")).toBeInTheDocument());
  });
});

describe("ResetPasswordView", () => {
  it("valida y restablece", async () => {
    authMock.resetPassword.mockResolvedValue({ message: "listo" });
    wrap(
      <Routes>
        <Route path="/reset/:token" element={<ResetPasswordView />} />
      </Routes>,
      "/reset/abc",
    );
    fireEvent.click(screen.getByText("Actualizar contraseña"));
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.click(screen.getByText("Actualizar contraseña"));
    await waitFor(() => expect(screen.getByText("listo")).toBeInTheDocument());
  });

  it("error en servicio", async () => {
    authMock.resetPassword.mockRejectedValue(new Error("nope"));
    wrap(
      <Routes>
        <Route path="/reset/:token" element={<ResetPasswordView />} />
      </Routes>,
      "/reset/abc",
    );
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.click(screen.getByText("Actualizar contraseña"));
    await waitFor(() => expect(screen.getByText("nope")).toBeInTheDocument());
  });
});

describe("ProtectedRoute", () => {
  it("redirige si no autenticado", () => {
    wrap(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <div>privado</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login-page</div>} />
      </Routes>,
    );
    expect(screen.getByText("login-page")).toBeInTheDocument();
  });

  it("redirige si rol no permitido", () => {
    useBoundStore.setState({
      isAuthenticated: true,
      userData: { role: { name: "Cliente" } } as never,
    });
    wrap(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["Admin"]} redirectPath="/forbidden">
              <div>privado</div>
            </ProtectedRoute>
          }
        />
        <Route path="/forbidden" element={<div>prohibido</div>} />
      </Routes>,
    );
    expect(screen.getByText("prohibido")).toBeInTheDocument();
  });

  it("permite acceso con rol valido", () => {
    useBoundStore.setState({
      isAuthenticated: true,
      userData: { role: { name: "Admin" } } as never,
    });
    wrap(
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <div>privado</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
    );
    expect(screen.getByText("privado")).toBeInTheDocument();
  });
});
