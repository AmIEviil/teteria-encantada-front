import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TopBar } from "./topBar/TopBar";
import CustomNavBar from "./topBar/MobileNavBar";
import { BodyLayout } from "./layout/MainLayout";
import { EventWizardProgress } from "./events/EventWizardProgress";
import { useBoundStore } from "../store/BoundedStore";

const wrap = (ui: React.ReactElement, route = "/inventory") =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

describe("TopBar", () => {
  it("renderiza titulo y menu", () => {
    useBoundStore.setState({ userData: { role: { name: "Admin" } } as never });
    wrap(<TopBar isAuthenticated />);
    expect(screen.getByText("Portal D'Encanto")).toBeInTheDocument();
  });
});

describe("MobileNavBar", () => {
  it("abre drawer y navega", () => {
    wrap(<CustomNavBar />);
    fireEvent.click(screen.getByRole("button"));
    const items = screen.queryAllByRole("button");
    items.forEach((b) => fireEvent.click(b));
  });
});

describe("BodyLayout", () => {
  it("renderiza outlet", () => {
    useBoundStore.setState({ userData: { role: { name: "Admin" } } as never });
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<BodyLayout />}>
            <Route path="/" element={<div>contenido-hijo</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("contenido-hijo")).toBeInTheDocument();
  });
});

describe("EventWizardProgress", () => {
  it("renderiza pasos y permite click", () => {
    const onStepClick = vi.fn();
    render(
      <EventWizardProgress
        steps={["Datos", "Tickets", "Resumen"]}
        currentStep={1}
        onStepClick={onStepClick}
      />,
    );
    fireEvent.click(screen.getByText("1"));
    expect(onStepClick).toHaveBeenCalledWith(0);
    expect(screen.getByText("Resumen")).toBeInTheDocument();
  });
});
