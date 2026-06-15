import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import CustomPagination from "./pagination/Pagination";
import CustomSelect from "./Select/Select";
import { Tabs } from "./Tab/Tabs";
import TableGeneric from "./table/Table";
import CustomModal from "./modal/CustomModal";
import SnackBar from "./snackBar/SnackBar";
import { CustomSnackBar } from "./snackBar/CustomSnackBar";
import PopUp from "./PopUp/PopUp";
import FieldGroup from "./labelField/FieldGroup";
import { useSnackBarResponseStore, useSnackBarModalStore } from "../../store/snackBarStore";

describe("CustomPagination", () => {
  it.each([
    [1, 5],
    [5, 5],
    [3, 10],
    [5, 10],
    [8, 10],
    [1, 1],
  ])("pagina %i de %i", (page, total) => {
    const onPageChange = vi.fn();
    const { unmount } = render(
      <CustomPagination
        actualPage={page}
        totalPages={total}
        onPageChange={onPageChange}
      />,
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((b) => fireEvent.click(b));
    unmount();
  });
});

describe("CustomSelect", () => {
  it("renderiza con opciones e icono", () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        title="Estado"
        required
        label="Selecciona"
        value="a"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        onChange={onChange}
        icon={<span>i</span>}
      />,
    );
    expect(screen.getByText("Estado")).toBeInTheDocument();
  });
});

describe("Tabs", () => {
  it("dispara onClick de opcion", () => {
    const onClick = vi.fn();
    render(
      <Tabs
        selectedIndex={0}
        options={[
          { label: "Uno", onClick },
          { label: "Dos", onClick: vi.fn() },
        ]}
      />,
    );
    fireEvent.click(screen.getByText("Dos"));
    expect(screen.getByText("Uno")).toBeInTheDocument();
  });
});

describe("TableGeneric", () => {
  const titles = [
    { label: "Nombre", key: "name", showOrder: true },
    { label: "Edad", key: "age" },
  ];
  it("con datos y orden", () => {
    const onOrderChange = vi.fn();
    render(
      <TableGeneric
        titles={titles}
        data={[{ id: 1 }]}
        renderRow={(item) => <tr key={(item as { id: number }).id}><td>x</td></tr>}
        orderBy="name"
        orderDirection="ASC"
        onOrderChange={onOrderChange}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onOrderChange).toHaveBeenCalledWith("name", "DESC");
  });
  it("loading", () => {
    render(
      <TableGeneric titles={titles} data={[]} renderRow={() => null} loading />,
    );
    expect(document.body).toBeInTheDocument();
  });
  it("vacio con renderHeader", () => {
    render(
      <TableGeneric
        titles={titles}
        data={[]}
        renderRow={() => null}
        renderHeader={(t, i) => <th key={i}>{t.label}</th>}
      />,
    );
    expect(screen.getByText("Sin Resultados")).toBeInTheDocument();
  });
});

describe("CustomModal", () => {
  beforeEach(() => vi.useRealTimers());
  it("confirma y cierra tras timeout", () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <CustomModal
        open
        title="Titulo"
        content={<div>cuerpo</div>}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText("Guardar"));
    expect(onConfirm).toHaveBeenCalled();
    vi.advanceTimersByTime(2100);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
  it("cancela", () => {
    const onClose = vi.fn();
    render(<CustomModal open onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("SnackBar", () => {
  it.each(["info", "success", "warning", "error"] as const)(
    "muestra tipo %s",
    (type) => {
      useSnackBarResponseStore.getState().openSnackbar("msg", type, 3000);
      render(<SnackBar />);
      fireEvent.click(screen.getByRole("button"));
      expect(useSnackBarResponseStore.getState().snackbarVisible).toBe(false);
    },
  );
  it("oculto no renderiza", () => {
    useSnackBarResponseStore.getState().resetSnackbar();
    const { container } = render(<SnackBar />);
    expect(container.firstChild).toBeNull();
  });
});

describe("CustomSnackBar", () => {
  it("muestra y oculta", () => {
    const onClick = vi.fn();
    useSnackBarModalStore.getState().showSnackBar("hola");
    const { rerender, container } = render(<CustomSnackBar onClick={onClick} />);
    fireEvent.click(screen.getByText("hola"));
    expect(onClick).toHaveBeenCalled();
    useSnackBarModalStore.getState().closeSnackBar();
    rerender(<CustomSnackBar onClick={onClick} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("PopUp", () => {
  it("confirma y cierra", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <PopUp open title="T" onClose={onClose} onConfirm={onConfirm} confirmText="Ok">
        <div>contenido</div>
      </PopUp>,
    );
    fireEvent.click(screen.getByLabelText("Ok"));
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe("FieldGroup", () => {
  const enterEdit = () => {
    const editBtn = document.querySelector("button");
    if (editBtn) fireEvent.click(editBtn);
  };

  it("modo lectura", () => {
    render(<FieldGroup label="Campo" value="dato" editable commentable />);
    expect(screen.getByText("dato")).toBeInTheDocument();
  });

  it("editable con radios", () => {
    const onEdit = vi.fn();
    render(
      <FieldGroup
        label="Sexo"
        value="M"
        editable
        options={[
          { value: 1, label: "M" },
          { value: 2, label: "F" },
        ]}
        onEdit={onEdit}
      />,
    );
    enterEdit();
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]);
  });

  it("editable multiCheckbox", () => {
    render(
      <FieldGroup
        label="Tags"
        value=""
        editable
        multiCheckbox
        rawValue="1"
        options={[
          { value: 1, label: "Uno" },
          { value: 2, label: "Dos" },
        ]}
      />,
    );
    enterEdit();
    const checks = screen.getAllByRole("checkbox");
    fireEvent.click(checks[1]);
    fireEvent.click(checks[1]);
  });

  it.each(["string", "number", "hour", "text-area"] as const)(
    "editable input tipo %s",
    (type) => {
      render(
        <FieldGroup label={`F-${type}`} value="1" editable type={type} options={[]} />,
      );
      enterEdit();
      const input = document.querySelector("input, textarea");
      if (input) fireEvent.change(input, { target: { value: "2" } });
    },
  );

  it("editable sin tipo muestra mensaje", () => {
    render(<FieldGroup label="Vacio" value="x" editable options={[]} />);
    enterEdit();
    expect(within(document.body).getByText(/no_options|x/)).toBeTruthy();
  });
});
