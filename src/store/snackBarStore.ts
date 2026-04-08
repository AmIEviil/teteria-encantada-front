import { create } from "zustand";

export type SnackBarType = "success" | "error" | "warning" | "info";

interface SnackBarResponseState {
  snackbarVisible: boolean;
  snackbarMessage: string;
  snackbarType: SnackBarType;
  snackbarDuration: number;
  setSnackbarVisible: (visible: boolean) => void;
  openSnackbar: (
    message: string,
    type?: SnackBarType,
    duration?: number,
  ) => void;
  resetSnackbar: () => void;
}

interface SnackBarModalState {
  open: boolean;
  message: string;
  setOpen: (open: boolean) => void;
  setMessage: (message: string) => void;
  showSnackBar: (message: string) => void;
  closeSnackBar: () => void;
}

const initialSnackBarResponseState = {
  snackbarVisible: false,
  snackbarMessage: "",
  snackbarType: "info" as SnackBarType,
  snackbarDuration: 3000,
};

export const useSnackBarResponseStore = create<SnackBarResponseState>(
  (set) => ({
    ...initialSnackBarResponseState,
    setSnackbarVisible: (visible) => set({ snackbarVisible: visible }),
    openSnackbar: (message, type = "info", duration = 3000) =>
      set({
        snackbarVisible: true,
        snackbarMessage: message,
        snackbarType: type,
        snackbarDuration: duration,
      }),
    resetSnackbar: () => set({ ...initialSnackBarResponseState }),
  }),
);

export const useSnackBarModalStore = create<SnackBarModalState>((set) => ({
  open: false,
  message: "",
  setOpen: (open) => set({ open }),
  setMessage: (message) => set({ message }),
  showSnackBar: (message) => set({ open: true, message }),
  closeSnackBar: () => set({ open: false, message: "" }),
}));
