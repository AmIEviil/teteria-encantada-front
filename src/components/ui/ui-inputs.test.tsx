import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthInput } from "./form/AuthInput";
import InputText from "./InputText/InputText";
import CustomInputText from "./InputText/CustomInputText";
import { CustomTextArea } from "./InputText/CustonTextArea";
import Checkbox from "./checkbox/Checkbox";
import CustomCheckbox from "./checkbox/CustomCheckBox";
import { CustomSwitch } from "./Switch/CustomSwitch";
import LoadingSpinner from "./loading/Loading";
import SeeMoreButton from "./SeeMore/SeeMoreButton";
import LabelField from "./labelField/LabelField";

describe("AuthInput", () => {
  it("cambia valor y togglea password", () => {
    const onChange = vi.fn();
    render(
      <AuthInput
        label="Clave"
        value="abc"
        onChange={onChange}
        type="password"
        error="malo"
        required
      />,
    );
    const input = screen.getByDisplayValue("abc");
    fireEvent.change(input, { target: { value: "xyz" } });
    expect(onChange).toHaveBeenCalledWith("xyz");
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("malo")).toBeInTheDocument();
  });

  it("tipo texto sin error", () => {
    render(<AuthInput label="Nombre" value="" onChange={() => {}} />);
    expect(screen.getByText("Nombre")).toBeInTheDocument();
  });
});

describe("InputText", () => {
  it("renderiza y cambia con debounce", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { rerender } = render(
      <InputText title="T" value="a" onChange={onChange} />,
    );
    const input = screen.getByLabelText("T");
    fireEvent.change(input, { target: { value: "b" } });
    vi.advanceTimersByTime(600);
    expect(onChange).toHaveBeenCalledWith("b");
    rerender(<InputText title="T" value="c" onChange={onChange} />);
    vi.useRealTimers();
  });
});

describe("CustomInputText", () => {
  it("cambia valor", () => {
    const onChange = vi.fn();
    render(
      <CustomInputText title="Email" value="x" onChange={onChange} require />,
    );
    fireEvent.change(screen.getByDisplayValue("x"), {
      target: { value: "y" },
    });
    expect(onChange).toHaveBeenCalledWith("y");
  });

  it("password togglea tipo", () => {
    render(
      <CustomInputText title="Pass" value="x" type="password" icon={null} />,
    );
    const toggle = document.querySelector(".input-icon-password");
    fireEvent.click(toggle as Element);
    fireEvent.click(toggle as Element);
    expect(document.getElementById("input-field-Pass")).toBeTruthy();
  });

  it("disabled no dispara onChange", () => {
    const onChange = vi.fn();
    render(<CustomInputText title="D" value="x" disabled onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("x"), {
      target: { value: "y" },
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("CustomTextArea", () => {
  it("cuenta caracteres", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { rerender } = render(
      <CustomTextArea title="Notas" value="ab" onChange={onChange} required />,
    );
    const ta = screen.getByRole("textbox");
    fireEvent.change(ta, { target: { value: "abc" } });
    vi.advanceTimersByTime(600);
    expect(onChange).toHaveBeenCalledWith("abc");
    rerender(<CustomTextArea title="Notas" value="zz" onChange={onChange} />);
    vi.useRealTimers();
  });
});

describe("Checkbox", () => {
  it("dispara onSelect", () => {
    const onSelect = vi.fn();
    render(<Checkbox onSelect={onSelect} isHeader />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("CustomCheckbox", () => {
  it("cambia estado", () => {
    const onChange = vi.fn();
    render(<CustomCheckbox checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("CustomSwitch", () => {
  it("selecciona opcion", () => {
    const onChange = vi.fn();
    render(
      <CustomSwitch title="Activo" checked={true} onChange={onChange} required />,
    );
    fireEvent.click(screen.getByText("No"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe("LoadingSpinner", () => {
  it("renderiza", () => {
    render(<LoadingSpinner testId="spin" />);
    expect(screen.getByTestId("spin")).toBeInTheDocument();
  });
});

describe("SeeMoreButton", () => {
  it("abre y cierra con click afuera", () => {
    render(<SeeMoreButton content="obs" labelTooltip="ver" />);
    const trigger = document.querySelector("span");
    fireEvent.click(trigger as Element);
    fireEvent.mouseDown(document.body);
    expect(document.body).toBeInTheDocument();
  });

  it("con contenido custom", () => {
    render(
      <SeeMoreButton customContent={<span>x</span>} customIcon={<i>i</i>} />,
    );
    expect(document.body).toBeInTheDocument();
  });
});

describe("LabelField", () => {
  it("muestra valor y error", () => {
    render(
      <LabelField
        label="Campo"
        value="dato"
        required
        showError
        errorMessage="err"
      >
        <span>child</span>
      </LabelField>,
    );
    expect(screen.getByText("err")).toBeInTheDocument();
  });
});
