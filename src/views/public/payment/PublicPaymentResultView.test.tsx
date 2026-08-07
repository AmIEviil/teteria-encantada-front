import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PublicPaymentResultView } from "./PublicPaymentResultView";

const renderAt = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/publico/pago/resultado${search}`]}>
      <PublicPaymentResultView />
    </MemoryRouter>,
  );

describe("PublicPaymentResultView", () => {
  it("aprobado: confirma y avisa que los tickets van por correo", () => {
    renderAt("?status=approved&payment_id=1&external_reference=p1");
    expect(screen.getByText(/pago confirmado/i)).toBeInTheDocument();
    expect(screen.getByText(/correo/i)).toBeInTheDocument();
  });

  it("pendiente: informa que aún se está procesando", () => {
    renderAt("?status=pending&payment_id=1&external_reference=p1");
    expect(screen.getByText(/procesando/i)).toBeInTheDocument();
  });

  it("rechazado: informa el rechazo", () => {
    renderAt("?status=rejected&payment_id=1&external_reference=p1");
    expect(screen.getByText(/no se pudo completar/i)).toBeInTheDocument();
  });

  it("sin status: cae al mensaje genérico de rechazo", () => {
    renderAt("");
    expect(screen.getByText(/no se pudo completar/i)).toBeInTheDocument();
  });
});
