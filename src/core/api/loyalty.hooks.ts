import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackBarResponseStore } from "../../store/snackBarStore";
import { getApiErrorMessage } from "./apiError";
import { loyaltyService } from "./loyalty.service";
import type { LoyaltyConfig, LoyaltyLevel, LoyaltyReward } from "./types";

const SUMMARY_KEY = ["loyalty", "me"] as const;
const CONFIG_KEY = ["loyalty", "config"] as const;
const LEVELS_KEY = ["loyalty", "levels"] as const;

const snack = () => useSnackBarResponseStore.getState();

export const useLoyaltySummaryQuery = () =>
  useQuery({ queryKey: SUMMARY_KEY, queryFn: loyaltyService.getSummary });

export const useLoyaltyConfigQuery = () =>
  useQuery({ queryKey: CONFIG_KEY, queryFn: loyaltyService.getConfig });

export const useLoyaltyLevelsQuery = () =>
  useQuery({ queryKey: LEVELS_KEY, queryFn: loyaltyService.listLevels });

export const useRedeemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => loyaltyService.redeem(rewardId),
    onSuccess: () => {
      snack().openSnackbar("Recompensa canjeada", "success");
      qc.invalidateQueries({ queryKey: SUMMARY_KEY });
    },
    onError: (e) =>
      snack().openSnackbar(getApiErrorMessage(e, "No se pudo canjear"), "error"),
  });
};

export const useUpdateLoyaltyConfigMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<LoyaltyConfig>) =>
      loyaltyService.updateConfig(dto),
    onSuccess: () => {
      snack().openSnackbar("Configuración guardada", "success");
      qc.invalidateQueries({ queryKey: CONFIG_KEY });
    },
    onError: (e) =>
      snack().openSnackbar(getApiErrorMessage(e, "Error al guardar"), "error"),
  });
};

export const useCreateLevelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<LoyaltyLevel>) => loyaltyService.createLevel(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEVELS_KEY }),
  });
};

export const useUpdateLevelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; payload: Partial<LoyaltyLevel> }) =>
      loyaltyService.updateLevel(p.id, p.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEVELS_KEY }),
  });
};

export const useDeleteLevelMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loyaltyService.deleteLevel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEVELS_KEY }),
  });
};

export const useCreateRewardMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<LoyaltyReward>) =>
      loyaltyService.createReward(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEVELS_KEY }),
  });
};

export const useDeleteRewardMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loyaltyService.deleteReward(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEVELS_KEY }),
  });
};
