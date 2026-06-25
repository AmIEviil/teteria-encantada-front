import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const m = vi.hoisted(() => () => ({ mutateAsync: vi.fn(), isPending: false }));
const q = vi.hoisted(() => () => ({ data: [], isLoading: false }));

vi.mock("../../core/api/events.hooks", () => ({
  useEventsQuery: q,
  useEventTicketsQuery: q,
  useCreateEventMutation: m,
  useUpdateEventMutation: m,
  useDeleteEventMutation: m,
  useCreateEventTicketMutation: m,
  useUpdateEventTicketMutation: m,
  useDeleteEventTicketMutation: m,
}));
vi.mock("../../store/snackBarStore", () => ({
  useSnackBarResponseStore: (selector: (s: { openSnackbar: () => void }) => unknown) =>
    selector({ openSnackbar: vi.fn() }),
}));
vi.mock("../../components/ui/imageUpload/ImageUploadField", () => ({
  ImageUploadField: () => null,
}));
vi.mock("../../components/ui/calendar/CustomCalendarV2", () => ({
  CustomCalendarV2: () => null,
}));

import { EventsTicketsView } from "./EventsTicketsView";

describe("EventsTicketsView", () => {
  it("renderiza la cabecera de gestion", () => {
    render(<EventsTicketsView />);
    expect(screen.getByText("Gestion de Eventos y Tickets")).toBeInTheDocument();
  });
});
