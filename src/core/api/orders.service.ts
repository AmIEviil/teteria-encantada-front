import apiClient from "../client/client";
import type {
  CreateOrderPayload,
  FindOrdersReportFilters,
  Order,
  OrdersReportResponse,
  OrderStatus,
  RemoveResponse,
  UpdateOrderPayload,
} from "./types";

interface FindOrdersFilters {
  tableId?: string;
  status?: OrderStatus;
}

export const ordersService = {
  findAll: async (filters?: FindOrdersFilters): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>("/orders", {
      params: {
        tableId: filters?.tableId,
        status: filters?.status,
      },
    });

    const payload = response.data as unknown;

    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === "object") {
      const maybeData = (payload as { data?: unknown }).data;
      if (Array.isArray(maybeData)) {
        return maybeData;
      }

      const maybeItems = (payload as { items?: unknown }).items;
      if (Array.isArray(maybeItems)) {
        return maybeItems;
      }
    }

    return [];
  },
  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const response = await apiClient.post<Order>("/orders", payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateOrderPayload): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/orders/${id}`, payload);
    return response.data;
  },
  remove: async (id: string): Promise<RemoveResponse> => {
    const response = await apiClient.delete<RemoveResponse>(`/orders/${id}`);
    return response.data;
  },
  findReport: async (
    filters?: FindOrdersReportFilters,
  ): Promise<OrdersReportResponse> => {
    const response = await apiClient.get<OrdersReportResponse>("/orders/report", {
      params: {
        tableId: filters?.tableId,
        status: filters?.status,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        search: filters?.search,
        page: filters?.page,
        limit: filters?.limit,
        orderBy: filters?.orderBy,
        orderDirection: filters?.orderDirection,
      },
    });

    const payload = response.data as unknown;

    if (payload && typeof payload === "object") {
      const typedPayload = payload as Partial<OrdersReportResponse>;

      if (
        Array.isArray(typedPayload.items) &&
        typedPayload.pagination &&
        Array.isArray(typedPayload.monthlySummary) &&
        typedPayload.totals
      ) {
        return {
          items: typedPayload.items,
          pagination: typedPayload.pagination,
          monthlySummary: typedPayload.monthlySummary,
          totals: typedPayload.totals,
        } as OrdersReportResponse;
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
      monthlySummary: [],
      totals: {
        totalOrders: 0,
        paidOrders: 0,
        cancelledOrders: 0,
        totalSales: 0,
        paidSales: 0,
      },
    };
  },
};
