import {
  useLoyaltySummaryQuery,
  useRedeemMutation,
} from "../../core/api/loyalty.hooks";

export const LoyaltyView = () => {
  const { data: summary, isLoading } = useLoyaltySummaryQuery();
  const redeem = useRedeemMutation();

  if (isLoading || !summary) return <div className="p-4">Cargando…</div>;

  return (
    <div className="p-4">
      <h1>Mis puntos</h1>
      <p>
        Saldo: <strong>{summary.points}</strong> pts
      </p>
      <p>
        Nivel actual: {summary.currentLevel?.name ?? "Sin nivel"}
        {summary.nextLevel
          ? ` — siguiente: ${summary.nextLevel.name} (${summary.nextLevel.threshold} pts)`
          : ""}
      </p>

      <h2>Recompensas disponibles</h2>
      <ul>
        {summary.rewards.map((r) => (
          <li key={r.id}>
            {r.description} — {r.cost} pts
            <button
              disabled={summary.points < r.cost || redeem.isPending}
              onClick={() => redeem.mutate(r.id)}
            >
              Canjear
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
