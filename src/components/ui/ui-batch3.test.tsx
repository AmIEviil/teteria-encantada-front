import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map">{children}</div>
  ),
  TileLayer: () => <div />,
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const uploadMock = {
  mutateAsync: vi.fn().mockResolvedValue({ id: "i", url: "http://img" }),
  isPending: false,
};
vi.mock("../../core/api/images.hooks", () => ({
  useUploadImageMutation: () => uploadMock,
}));

import CustomCombobox from "./combobox/Combobox";
import MultiSelectDropdown from "./dropdown/MultipleSelectDropdown";
import CustomDropmenuV2 from "./customdropmenu/CustomDropmenuV2";
import NavBarComponent from "./customdropmenu/NavBarComponent";
import GaugeChart from "./charts/gauge/GaugeChart";
import MapFromCoords from "./googleMapEmbed.tsx/GoogleMapEmbed";
import { ImageUploadField } from "./imageUpload/ImageUploadField";
import MediaVisualizer from "./modal/mediaVisualizer/MediaVisualizer";
import ModalMediaVisualizer from "./modal/mediaVisualizer/ModalMediaVisualizer";
import ModalPdfViewer from "./modal/pdf/ModalPdfViewer";
import PDFViewer from "./modal/pdf/pdfViewer";
import { useModalStore } from "../../store/modalStore";
import { useBoundStore } from "../../store/BoundedStore";

describe("CustomCombobox", () => {
  it("filtra y selecciona", () => {
    const onChange = vi.fn();
    render(
      <CustomCombobox
        title="Cliente"
        required
        value=""
        onChange={onChange}
        options={[
          { value: "1", label: "Ana" },
          { value: "2", label: "Bob" },
        ]}
      />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "an" } });
    expect(onChange).toHaveBeenCalledWith("an");
  });
});

describe("MultiSelectDropdown", () => {
  it.each(["caret", "arrow"] as const)("arrow %s", (arrowType) => {
    const onSelect = vi.fn();
    render(
      <MultiSelectDropdown
        arrowType={arrowType}
        value="Uno"
        onSelect={onSelect}
        options={[
          { value: 1, label: "Uno" },
          { value: 2, label: "Dos" },
        ]}
      />,
    );
    fireEvent.click(screen.getByText(/Uno/));
  });
});

describe("CustomDropmenuV2", () => {
  it("abre, navega opciones y submenu", () => {
    const leaf = vi.fn();
    const sub = vi.fn();
    render(
      <CustomDropmenuV2
        icon={<span>i</span>}
        label="Menu"
        typeClass="danger"
        options={[
          { label: "Editar", onClick: leaf },
          { label: "Mas", subOptions: [{ label: "Sub", onClick: sub }] },
        ]}
      />,
    );
    fireEvent.click(screen.getByText("Menu"));
    fireEvent.click(screen.getByText("Mas"));
    fireEvent.click(screen.getByText("Sub"));
    expect(sub).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Menu"));
    fireEvent.click(screen.getByText("Editar"));
    expect(leaf).toHaveBeenCalled();
    fireEvent.mouseDown(document.body);
  });
});

describe("NavBarComponent", () => {
  it("abre menu y navega", () => {
    useBoundStore.setState({
      userData: { role: { name: "Superadmin" } } as never,
    });
    render(
      <MemoryRouter>
        <NavBarComponent />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button"));
    const buttons = screen.getAllByRole("button");
    buttons.forEach((b) => fireEvent.click(b));
  });
});

describe("GaugeChart", () => {
  it("renderiza", () => {
    render(
      <GaugeChart title="Stock" minValue={0} maxValue={100} actualValue={40} />,
    );
    expect(screen.getByText("Stock")).toBeInTheDocument();
  });
});

describe("MapFromCoords", () => {
  it("coords invalidas muestra cargando", () => {
    render(<MapFromCoords lat={0} lng={0} />);
    expect(screen.getByText("Cargando mapa...")).toBeInTheDocument();
  });
  it("coords validas con links", () => {
    render(
      <MapFromCoords
        lat={-33.4}
        lng={-70.6}
        coordenadas={{ lat: -33.4, lng: -70.6 }}
        googleUrlLink="http://x"
      />,
    );
    expect(screen.getByText("Waze")).toBeInTheDocument();
  });
});

describe("ImageUploadField", () => {
  it("sube imagen valida", async () => {
    const onChange = vi.fn();
    render(<ImageUploadField value={null} onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "x.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
    await Promise.resolve();
    await Promise.resolve();
    expect(uploadMock.mutateAsync).toHaveBeenCalled();
  });
  it("rechaza no-imagen", () => {
    render(<ImageUploadField value={null} onChange={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "x.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/debe ser una imagen/)).toBeInTheDocument();
  });
  it("muestra imagen y permite quitar", () => {
    const onChange = vi.fn();
    render(
      <ImageUploadField value={{ id: "i", url: "http://img" }} onChange={onChange} />,
    );
    fireEvent.click(screen.getByText("Quitar"));
    expect(onChange).toHaveBeenCalledWith(null);
    fireEvent.click(screen.getByText("Seleccionar imagen"));
  });
});

describe("MediaVisualizer", () => {
  it("imagen con fallback", () => {
    render(
      <MediaVisualizer
        currentMedia={{ _kind: "img", url: "http://x", name: "x" }}
        fullScreenImage
      />,
    );
    const img = screen.getByRole("img");
    fireEvent.error(img);
  });
  it("iframe para otros tipos", () => {
    render(
      <MediaVisualizer currentMedia={{ _kind: "pdf", url: "http://x", name: "x" }} />,
    );
    expect(screen.getByTitle("x")).toBeInTheDocument();
  });
});

describe("ModalMediaVisualizer", () => {
  it("abre con payload y cierra", () => {
    useModalStore.getState().openModal("media-visualizer-modal", {
      headerContent: <span>head</span>,
      modalContent: <span>body</span>,
    });
    render(<ModalMediaVisualizer />);
    expect(screen.getByText("Aceptar")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar"));
  });
});

describe("ModalPdfViewer", () => {
  it("renderiza y aprueba", () => {
    const onApprove = vi.fn();
    const onClose = vi.fn();
    render(
      <ModalPdfViewer
        visible
        pdfData={{ title: "Doc", url: "http://x", revisado: false }}
        onClose={onClose}
        onApprove={onApprove}
      />,
    );
    fireEvent.click(screen.getByText("Aprobar"));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onApprove).toHaveBeenCalled();
  });
});

describe("PDFViewer", () => {
  it("string file", () => {
    render(<PDFViewer file="http://x.pdf" />);
    expect(screen.getByTitle("Vista previa de PDF")).toBeInTheDocument();
  });
  it("null file", () => {
    const { container } = render(<PDFViewer file={"" as never} />);
    expect(container.firstChild).toBeNull();
  });
});
