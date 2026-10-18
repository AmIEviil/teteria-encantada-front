import apiClient from "../client/client";
import type {
  EventPurchaseDetail,
  EventPurchasesFilters,
  EventPurchasesListResponse,
} from "./types";

const parseFilename = (header: unknown): string | null => {
  if (typeof header !== "string") return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

export const eventPurchasesService = {
  findAll: async (
    filters: EventPurchasesFilters = {},
  ): Promise<EventPurchasesListResponse> => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    );
    const response = await apiClient.get<EventPurchasesListResponse>(
      "/event-purchases",
      { params },
    );
    return response.data;
  },

  findOne: async (id: string): Promise<EventPurchaseDetail> => {
    const response = await apiClient.get<EventPurchaseDetail>(
      `/event-purchases/${id}`,
    );
    return response.data;
  },

  downloadFile: async (
    id: string,
    kind: "tickets" | "comprobante",
  ): Promise<void> => {
    const response = await apiClient.get<Blob>(
      `/event-purchases/${id}/${kind}.pdf`,
      { responseType: "blob" },
    );
    // Si CORS no expone Content-Disposition, el header no llega: usar el fallback.
    const filename =
      parseFilename(response.headers?.["content-disposition"]) ??
      `${id}-${kind}.pdf`;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
