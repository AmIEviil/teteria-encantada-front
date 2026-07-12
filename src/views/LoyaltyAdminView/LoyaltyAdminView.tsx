import { useState } from "react";
import {
  useLoyaltyConfigQuery,
  useLoyaltyLevelsQuery,
  useUpdateLoyaltyConfigMutation,
  useCreateLevelMutation,
  useDeleteLevelMutation,
} from "../../core/api/loyalty.hooks";

export const LoyaltyAdminView = () => {
  const { data: config } = useLoyaltyConfigQuery();
  const { data: levels } = useLoyaltyLevelsQuery();
  const updateConfig = useUpdateLoyaltyConfigMutation();
  const createLevel = useCreateLevelMutation();
  const deleteLevel = useDeleteLevelMutation();
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState(0);

  return (
    <div className="p-4">
      <h1>Fidelización</h1>

      <section>
        <h2>Configuración</h2>
        <label>
          <input
            type="checkbox"
            checked={config?.purchasePointsEnabled ?? false}
            onChange={(e) =>
              updateConfig.mutate({ purchasePointsEnabled: e.target.checked })
            }
          />
          Puntos por compra
        </label>
        <label>
          <input
            type="checkbox"
            checked={config?.attendancePointsEnabled ?? false}
            onChange={(e) =>
              updateConfig.mutate({ attendancePointsEnabled: e.target.checked })
            }
          />
          Puntos por asistencia
        </label>
        <label>
          Tasa por compra (pts/unidad)
          <input
            type="number"
            step="0.0001"
            defaultValue={config?.purchasePointsRate ?? 0}
            onBlur={(e) =>
              updateConfig.mutate({ purchasePointsRate: Number(e.target.value) })
            }
          />
        </label>
      </section>

      <section>
        <h2>Niveles</h2>
        <ul>
          {levels?.map((l) => (
            <li key={l.id}>
              {l.name} — {l.threshold} pts
              <button onClick={() => deleteLevel.mutate(l.id)}>Eliminar</button>
            </li>
          ))}
        </ul>
        <div>
          <input
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Umbral"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
          <button
            onClick={() => {
              createLevel.mutate({ name, threshold });
              setName("");
              setThreshold(0);
            }}
          >
            Crear nivel
          </button>
        </div>
      </section>
    </div>
  );
};
