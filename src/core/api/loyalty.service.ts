import apiClient from "../client/client";
import type {
  LoyaltyConfig,
  LoyaltyLevel,
  LoyaltyReward,
  LoyaltySummary,
} from "./types";

export const loyaltyService = {
  getSummary: async (): Promise<LoyaltySummary> =>
    (await apiClient.get<LoyaltySummary>("/loyalty/me")).data,

  redeem: async (rewardId: string): Promise<{ points: number }> =>
    (await apiClient.post<{ points: number }>("/loyalty/redeem", { rewardId }))
      .data,

  getConfig: async (): Promise<LoyaltyConfig> =>
    (await apiClient.get<LoyaltyConfig>("/loyalty/config")).data,

  updateConfig: async (dto: Partial<LoyaltyConfig>): Promise<LoyaltyConfig> =>
    (await apiClient.patch<LoyaltyConfig>("/loyalty/config", dto)).data,

  listLevels: async (): Promise<LoyaltyLevel[]> =>
    (await apiClient.get<LoyaltyLevel[]>("/loyalty/levels")).data,

  createLevel: async (dto: Partial<LoyaltyLevel>): Promise<LoyaltyLevel> =>
    (await apiClient.post<LoyaltyLevel>("/loyalty/levels", dto)).data,

  updateLevel: async (
    id: string,
    dto: Partial<LoyaltyLevel>,
  ): Promise<LoyaltyLevel> =>
    (await apiClient.patch<LoyaltyLevel>(`/loyalty/levels/${id}`, dto)).data,

  deleteLevel: async (id: string): Promise<{ message: string }> =>
    (await apiClient.delete<{ message: string }>(`/loyalty/levels/${id}`)).data,

  createReward: async (dto: Partial<LoyaltyReward>): Promise<LoyaltyReward> =>
    (await apiClient.post<LoyaltyReward>("/loyalty/rewards", dto)).data,

  updateReward: async (
    id: string,
    dto: Partial<LoyaltyReward>,
  ): Promise<LoyaltyReward> =>
    (await apiClient.patch<LoyaltyReward>(`/loyalty/rewards/${id}`, dto)).data,

  deleteReward: async (id: string): Promise<{ message: string }> =>
    (await apiClient.delete<{ message: string }>(`/loyalty/rewards/${id}`)).data,
};
