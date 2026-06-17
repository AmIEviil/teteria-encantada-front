import type { ReactNode } from "react";
import type { MigrationStatusItem, MigrationOrder } from "../../core/api/types";

export interface MigrationStatusTableProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  rows: MigrationStatusItem[];
  emptyLabel: string;
  actionLabel: string;
  actionIcon: ReactNode;
  loadingAction: boolean;
  actionTargetName?: string;
  onAction: (migrationName: string) => void;
  order: MigrationOrder;
  onToggleOrder?: () => void;
}
