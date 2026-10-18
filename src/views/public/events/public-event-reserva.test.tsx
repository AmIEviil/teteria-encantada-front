import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicEventReservaView } from "./PublicEventReservaView";
import { usePurchaseStore } from "../../../store/purchaseStore";
import { useSnackBarResponseStore } from "../../../store/snackBarStore";
import type {
  PublicEventDetail,
  PublicEventDetailTicketType,
} from "../../../core/api/publicEvents.types";

const general: PublicEventDetailTicketType = {
  id: "t1",
  name: "General",
  description: null,
  price: 5000,
  includesDetails: null,
  menuMode: "FIXED" as PublicEventDetailTicketType["menuMode"],
  menuTemplate: null,
  available: true,
  remaining: null,
};

const buildEvent = (
  overrides: Partial<PublicEventDetail> = {},
): PublicEventDetail => ({
  id: "e1",
  title: "Cata",
  description: null,
  startsAt: "2026-08-01T14:00:00Z",
  endsAt: "2026-08-01T18:00:00Z",
  officialImageUrl: null,
  isFreeEntry: false,
  hasSessions: false,
  seatsRemaining: null,
  ticketTypes: [general],
  sessions: [],
  ...overrides,
});

const renderView = () =>
  render(
    <MemoryRouter initialEntries={["/publico/eventos/e1/reserva"]}>
      <Routes>
        <Route
          path="/publico/eventos/:id/reserva"
          element={<PublicEventReservaView />}
        />
      </Routes>
    </MemoryRouter>,
  );

const fillPerson = (index: number, first: string, last: string) => {
  fireEvent.change(screen.getAllByLabelText(/Nombre/)[index], {
    target: { value: first },
  });
  fireEvent.change(screen.getAllByLabelText(/Apellido/)[index], {
    target: { value: last },
  });
};

describe("PublicEventReservaView agregar persona", () => {
  beforeEach(() => {
    usePurchaseStore.getState().reset();
    useSnackBarResponseStore.getState().resetSnackbar();
  });

  it("agrega una segunda persona tras completar nombre y apellido", () => {
    usePurchaseStore.getState().setContext(buildEvent(), null);
    renderView();

    fillPerson(0, "Ana", "Perez");
    fireEvent.click(screen.getByRole("button", { name: /Agregar otra persona/ }));

    expect(screen.getByText("Persona 2")).toBeInTheDocument();
  });

  it("explica por qué no se puede agregar mientras faltan nombre y apellido", () => {
    usePurchaseStore.getState().setContext(buildEvent(), null);
    renderView();

    expect(
      screen.getByRole("button", { name: /Agregar otra persona/ }),
    ).toBeDisabled();
    expect(
      screen.getByText("Completa nombre y apellido para agregar otra persona"),
    ).toBeInTheDocument();
  });

  it("explica que no quedan cupos cuando el evento tiene uno solo", () => {
    usePurchaseStore
      .getState()
      .setContext(
        buildEvent({
          seatsRemaining: 1,
          ticketTypes: [{ ...general, remaining: 1 }],
        }),
        null,
      );
    renderView();

    fillPerson(0, "Ana", "Perez");

    expect(
      screen.getByRole("button", { name: /Agregar otra persona/ }),
    ).toBeDisabled();
    expect(
      screen.getByText("Solo queda 1 cupo disponible"),
    ).toBeInTheDocument();
  });

  it("asocia cada label al input de su propia persona", () => {
    usePurchaseStore.getState().setContext(buildEvent(), null);
    renderView();

    fillPerson(0, "Ana", "Perez");
    fireEvent.click(screen.getByRole("button", { name: /Agregar otra persona/ }));
    fillPerson(1, "Luis", "Soto");

    const nombres = screen.getAllByLabelText(/Nombre/) as HTMLInputElement[];
    expect(nombres.map((input) => input.value)).toEqual(["Ana", "Luis"]);
  });
});
