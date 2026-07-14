import apiClient from "../client/client";
import type {
  AddWhitelistPayload,
  CreateTrabajadorPayload,
  EmpleadoUser,
  EmpleadoUsersResponse,
  FindEmpleadoUsersFilters,
  Trabajador,
  UpdateTrabajadorPayload,
} from "./types";

export const empleadosService = {
  findUsers: async (
    filters?: FindEmpleadoUsersFilters,
  ): Promise<EmpleadoUsersResponse> => {
    const response = await apiClient.get<EmpleadoUsersResponse>("/trabajadores/users", {
      params: {
        page: filters?.page,
        limit: filters?.limit,
        firstName: filters?.firstName,
        lastName: filters?.lastName,
        createdFrom: filters?.createdFrom,
        createdTo: filters?.createdTo,
        onlyStaff: filters?.onlyStaff,
      },
    });

    const payload = response.data as unknown;

    if (payload && typeof payload === "object") {
      const typedPayload = payload as Partial<EmpleadoUsersResponse>;

      if (Array.isArray(typedPayload.items) && typedPayload.pagination) {
        return {
          items: typedPayload.items,
          pagination: typedPayload.pagination,
        } as EmpleadoUsersResponse;
      }
    }

    return {
      items: [],
      pagination: {
        page: filters?.page ?? 1,
        limit: filters?.limit ?? 10,
        totalItems: 0,
        totalPages: 1,
      },
    };
  },
  create: async (payload: CreateTrabajadorPayload): Promise<Trabajador> => {
    const response = await apiClient.post<Trabajador>("/trabajadores", payload);
    return response.data;
  },
  findOne: async (id: string): Promise<Trabajador> => {
    const response = await apiClient.get<Trabajador>(`/trabajadores/${id}`);
    return response.data;
  },
  update: async (id: string, payload: UpdateTrabajadorPayload): Promise<Trabajador> => {
    const response = await apiClient.patch<Trabajador>(`/trabajadores/${id}`, payload);
    return response.data;
  },
  addToWhitelist: async (payload: AddWhitelistPayload): Promise<EmpleadoUser> => {
    const response = await apiClient.post<EmpleadoUser>(
      "/trabajadores/whitelist",
      payload,
    );
    return response.data;
  },
  setWhitelistActive: async (id: string, isActive: boolean): Promise<EmpleadoUser> => {
    const response = await apiClient.patch<EmpleadoUser>(
      `/trabajadores/whitelist/${id}`,
      { isActive },
    );
    return response.data;
  },
};