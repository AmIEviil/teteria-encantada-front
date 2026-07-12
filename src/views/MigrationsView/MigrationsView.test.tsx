import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const hooks = vi.hoisted(() => ({
  status: vi.fn(),
  history: vi.fn(),
}));
const mutation = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false, variables: undefined }));

vi.mock("../../core/api/migrations.hooks", () => ({
  useMigrationsStatusQuery: () => hooks.status(),
  useMigrationsHistoryQuery: () => hooks.history(),
  useExecuteMigrationMutation: () => mutation,
  useRevertMigrationMutation: () => mutation,
}));
vi.mock("../../components/migrations/MigrationCommandModal", () => ({
  MigrationCommandModal: () => null,
}));

import { MigrationsView } from "./MigrationsView";

beforeEach(() => {
  vi.clearAllMocks();
  hooks.status.mockReturnValue({ data: undefined, isLoading: false, isFetching: false, refetch: vi.fn() });
  hooks.history.mockReturnValue({ data: [], isLoading: false, isFetching: false, refetch: vi.fn() });
});

describe("MigrationsView", () => {
  it("renderiza el panel y consume MigrationStatusTable con datos", () => {
    hooks.status.mockReturnValue({
      data: {
        summary: { totalMigrations: 2, totalExecuted: 1, totalPending: 1 },
        executed: [],
        pending: [{ name: "0001-init", timestamp: "1700000000000" }],
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    render(<MigrationsView />);
    expect(screen.getByText("Migraciones")).toBeInTheDocument();
    expect(screen.getByText("Migraciones pendientes")).toBeInTheDocument();
  });
});
