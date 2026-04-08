import { create } from "zustand";
import type { AuthUser } from "../core/api/types";

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "userData";

const readStoredUser = (): AuthUser | null => {
  const value = localStorage.getItem(USER_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

interface BoundStoreState {
  isAuthenticated: boolean;
  token: string | null;
  userData: AuthUser | null;
  setToken: (token: string | null) => void;
  setUserData: (userData: AuthUser | null) => void;
  setSession: (token: string, userData: AuthUser) => void;
  logInUser: (token: string, userData?: AuthUser | null) => void;
  logOutUser: () => void;
}

const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
const storedUser = readStoredUser();

export const useBoundStore = create<BoundStoreState>((set) => ({
  isAuthenticated: Boolean(storedToken),
  token: storedToken,
  userData: storedUser,
  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }

    set((state) => ({
      ...state,
      token,
      userData: token ? state.userData : null,
      isAuthenticated: Boolean(token),
    }));
  },
  setUserData: (userData) => {
    if (userData) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }

    set((state) => ({
      ...state,
      userData,
    }));
  },
  setSession: (token, userData) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

    set({
      token,
      userData,
      isAuthenticated: true,
    });
  },
  logInUser: (token, userData) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);

    if (userData) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    }

    set((state) => ({
      ...state,
      token,
      userData: userData ?? state.userData,
      isAuthenticated: true,
    }));
  },
  logOutUser: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    set({
      token: null,
      userData: null,
      isAuthenticated: false,
    });
  },
}));
