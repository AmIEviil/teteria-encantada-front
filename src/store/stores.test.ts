import { describe, it, expect, beforeEach } from "vitest";
import {
  useSnackBarResponseStore,
  useSnackBarModalStore,
} from "./snackBarStore";
import { useModalStore } from "./modalStore";
import { useBoundStore } from "./BoundedStore";

beforeEach(() => {
  localStorage.clear();
});

describe("snackBarStore", () => {
  it("openSnackbar y reset", () => {
    useSnackBarResponseStore.getState().openSnackbar("hola", "error", 1000);
    let state = useSnackBarResponseStore.getState();
    expect(state.snackbarVisible).toBe(true);
    expect(state.snackbarType).toBe("error");
    useSnackBarResponseStore.getState().resetSnackbar();
    state = useSnackBarResponseStore.getState();
    expect(state.snackbarVisible).toBe(false);
  });

  it("openSnackbar defaults", () => {
    useSnackBarResponseStore.getState().openSnackbar("x");
    expect(useSnackBarResponseStore.getState().snackbarType).toBe("info");
  });

  it("setSnackbarVisible", () => {
    useSnackBarResponseStore.getState().setSnackbarVisible(true);
    expect(useSnackBarResponseStore.getState().snackbarVisible).toBe(true);
  });

  it("modal snackbar show/close", () => {
    const s = useSnackBarModalStore.getState();
    s.showSnackBar("msg");
    expect(useSnackBarModalStore.getState().open).toBe(true);
    s.closeSnackBar();
    expect(useSnackBarModalStore.getState().open).toBe(false);
    s.setOpen(true);
    s.setMessage("y");
    expect(useSnackBarModalStore.getState().message).toBe("y");
  });
});

describe("modalStore", () => {
  it("openModal con y sin payload", () => {
    const s = useModalStore.getState();
    s.openModal("m1", { a: 1 });
    expect(useModalStore.getState().openModals.m1).toBe(true);
    expect(useModalStore.getState().modalPayloads.m1).toEqual({ a: 1 });
    s.openModal("m2");
    expect(useModalStore.getState().openModals.m2).toBe(true);
  });

  it("closeModal", () => {
    useModalStore.getState().openModal("m1");
    useModalStore.getState().closeModal("m1");
    expect(useModalStore.getState().openModals.m1).toBe(false);
  });

  it("clearModalPayload", () => {
    useModalStore.getState().openModal("m1", { a: 1 });
    useModalStore.getState().clearModalPayload("m1");
    expect(useModalStore.getState().modalPayloads.m1).toBeUndefined();
  });

  it("closeAllModals", () => {
    useModalStore.getState().openModal("m1", { a: 1 });
    useModalStore.getState().closeAllModals();
    expect(useModalStore.getState().openModals).toEqual({});
  });
});

describe("BoundedStore", () => {
  it("setToken con valor guarda en storage", () => {
    useBoundStore.getState().setToken("tok");
    expect(localStorage.getItem("token")).toBe("tok");
    expect(useBoundStore.getState().isAuthenticated).toBe(true);
  });

  it("setToken null limpia", () => {
    useBoundStore.getState().setToken(null);
    expect(localStorage.getItem("token")).toBeNull();
    expect(useBoundStore.getState().isAuthenticated).toBe(false);
  });

  it("setUserData", () => {
    const user = { id: "u1" } as never;
    useBoundStore.getState().setUserData(user);
    expect(localStorage.getItem("userData")).toContain("u1");
    useBoundStore.getState().setUserData(null);
    expect(localStorage.getItem("userData")).toBeNull();
  });

  it("setSession", () => {
    useBoundStore.getState().setSession("tok", { id: "u1" } as never);
    expect(useBoundStore.getState().isAuthenticated).toBe(true);
    expect(useBoundStore.getState().token).toBe("tok");
  });

  it("logInUser con y sin userData", () => {
    useBoundStore.getState().logInUser("tok", { id: "u1" } as never);
    expect(useBoundStore.getState().userData).toEqual({ id: "u1" });
    useBoundStore.getState().logInUser("tok2");
    expect(useBoundStore.getState().token).toBe("tok2");
  });

  it("logOutUser", () => {
    useBoundStore.getState().setSession("tok", { id: "u1" } as never);
    useBoundStore.getState().logOutUser();
    expect(useBoundStore.getState().isAuthenticated).toBe(false);
    expect(useBoundStore.getState().userData).toBeNull();
  });
});
