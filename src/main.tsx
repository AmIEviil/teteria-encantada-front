import "./polyfills";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { initMercadoPago } from "@mercadopago/sdk-react";

import theme from "./theme.js";
import { router } from "./router";

const mpPublicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;
if (mpPublicKey) {
  initMercadoPago(mpPublicKey, { locale: "es-CL" });
} else {
  console.error("Falta VITE_MP_PUBLIC_KEY: los Bricks de pago no se renderizarán.");
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
