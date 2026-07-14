import apiClient from "../client/client";
import type { RegistroHora, RegistroHorasMes, UpsertRegistroHoraPayload } from "./types";

interface FindMonthParams {
  trabajadorId?: string;
  mes?: string;
}

export const horasService = {
  findMonth: async (params: FindMonthParams): Promise<RegistroHorasMes> => {
    const response = await apiClient.get<RegistroHorasMes>("/trabajadores/horas", {
      params: {
        trabajadorId: params.trabajadorId,
        mes: params.mes,
      },
    });
    return response.data;
  },
  upsert: async (payload: UpsertRegistroHoraPayload): Promise<RegistroHora | null> => {
    const response = await apiClient.post<RegistroHora | null>(
      "/trabajadores/horas",
      payload,
    );
    return response.data;
  },
};
