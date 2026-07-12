import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MigrationCommandModal } from "./MigrationCommandModal";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MigrationCommandModal", () => {
  it("renderiza, cambia nombre y copia comando", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const onClose = vi.fn();
    render(<MigrationCommandModal open onClose={onClose} />);

    fireEvent.change(screen.getByLabelText("Nombre de migracion"), {
      target: { value: "Mi Migracion!" },
    });
    fireEvent.click(screen.getAllByText("Copiar comando")[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalled();
  });

  it("maneja error de copiado", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("no"));
    Object.assign(navigator, { clipboard: { writeText } });
    render(<MigrationCommandModal open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Nombre de migracion"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getAllByText("Copiar comando")[1]);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
  });
});
