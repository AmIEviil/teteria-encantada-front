import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const authMock = vi.hoisted(() => ({
  roles: vi.fn(),
  register: vi.fn(),
}));
vi.mock("../../core/api/auth.service", () => ({ authService: authMock }));

import { RegisterView } from "./RegisterView";

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  authMock.roles.mockResolvedValue([
    { id: "1", name: "Admin" },
    { id: "2", name: "Tecnico" },
  ]);
});

describe("RegisterView", () => {
  it("carga roles y registra usuario", async () => {
    authMock.register.mockResolvedValue({
      accessToken: "t",
      user: { role: { name: "Tecnico" } },
    });
    wrap(<RegisterView />);
    await waitFor(() => expect(authMock.roles).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Nombre de usuario"), {
      target: { value: "usuario" },
    });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText("Apellido"), {
      target: { value: "Perez" },
    });
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "j@x.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.click(screen.getByText("Registrar"));
    await waitFor(() => expect(authMock.register).toHaveBeenCalled());
  });

  it("muestra errores de validacion", async () => {
    const { container } = wrap(<RegisterView />);
    await waitFor(() => expect(authMock.roles).toHaveBeenCalled());
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(screen.getByText("El nombre es obligatorio")).toBeInTheDocument();
  });

  it("usa roles fallback si falla la carga", async () => {
    authMock.roles.mockRejectedValue(new Error("x"));
    wrap(<RegisterView />);
    await waitFor(() =>
      expect(screen.getByText("Superadmin")).toBeInTheDocument(),
    );
  });

  it("muestra error de registro", async () => {
    authMock.register.mockRejectedValue(new Error("ya existe"));
    wrap(<RegisterView />);
    await waitFor(() => expect(authMock.roles).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Nombre de usuario"), {
      target: { value: "usuario" },
    });
    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Juan" },
    });
    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "j@x.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "Secret123" },
    });
    fireEvent.click(screen.getByText("Registrar"));
    await waitFor(() => expect(screen.getByText("ya existe")).toBeInTheDocument());
  });
});
