import { create } from "zustand";

interface ModalStoreState {
  openModals: Record<string, boolean>;
  modalPayloads: Record<string, unknown>;
  openModal: (modalKey: string, payload?: unknown) => void;
  closeModal: (modalKey: string) => void;
  clearModalPayload: (modalKey: string) => void;
  closeAllModals: () => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
  openModals: {},
  modalPayloads: {},
  openModal: (modalKey, payload) =>
    set((state) => ({
      openModals: {
        ...state.openModals,
        [modalKey]: true,
      },
      modalPayloads:
        payload === undefined
          ? state.modalPayloads
          : {
              ...state.modalPayloads,
              [modalKey]: payload,
            },
    })),
  closeModal: (modalKey) =>
    set((state) => ({
      openModals: {
        ...state.openModals,
        [modalKey]: false,
      },
    })),
  clearModalPayload: (modalKey) =>
    set((state) => {
      const nextPayloads = { ...state.modalPayloads };
      delete nextPayloads[modalKey];

      return {
        modalPayloads: nextPayloads,
      };
    }),
  closeAllModals: () =>
    set({
      openModals: {},
      modalPayloads: {},
    }),
}));
