import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const authMock = vi.hoisted(() => ({ profile: vi.fn() }));
vi.mock("../../core/api/auth.service", () => ({ authService: authMock }));

import { GoogleCallbackView } from "./GoogleCallbackView";
import { GoogleLoginButton } from "../../components/ui/auth/GoogleLoginButton";
import { useBoundStore } from "../../store/BoundedStore";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useBoundStore.setState({ isAuthenticated: false, userData: null, token: null });
});

describe("GoogleLoginButton", () => {
  it("redirige a /auth/google del backend", () => {
    const original = window.location;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
    render(<GoogleLoginButton />);
    screen.getByText("Continuar con Google").click();
    expect(window.location.href).toContain("/auth/google");
    Object.defineProperty(window, "location", { writable: true, value: original });
  });
});

describe("GoogleCallbackView", () => {
  it("persiste el token, obtiene el perfil y abre sesión", async () => {
    authMock.profile.mockResolvedValue({
      id: "u1",
      email: "a@gmail.com",
      role: { id: "r", name: "Cliente" },
    });

    render(
      <MemoryRouter initialEntries={["/auth/google/callback?token=jwt-1"]}>
        <Routes>
          <Route path="/auth/google/callback" element={<GoogleCallbackView />} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(useBoundStore.getState().isAuthenticated).toBe(true),
    );
    expect(localStorage.getItem("token")).toBe("jwt-1");
  });

  it("redirige a login si no hay token", async () => {
    render(
      <MemoryRouter initialEntries={["/auth/google/callback"]}>
        <Routes>
          <Route path="/auth/google/callback" element={<GoogleCallbackView />} />
          <Route path="/login" element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText("LOGIN")).toBeInTheDocument());
  });
});
