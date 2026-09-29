import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { eur } from "@/lib/invoices";
import { axisEur, signedEur } from "./format";
import { TREASURY_COLORS as C } from "./palette";

/**
 * Flux mensuels : réalisé en barres pleines, prévisionnel en barres hachurées,
 * solde de fin de mois en ligne (si la trésorerie actuelle est saisie).
 */

export interface CashChartRow {
  label: string;
  inDone: number;
  outDone: number;
  inForecast: number;
  outForecast: number;
  balance: number | null;
}

const OUT_KEYS = new Set(["outDone", "outForecast"]);

const Hatch = ({ id, color }: { id: string; color: string }) => (
  <pattern id={id} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
    <rect width="6" height="6" fill={C.surface} />
    <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2" />
  </pattern>
);

export const TreasuryCashChart = ({ rows, threshold, showBalance }: { rows: CashChartRow[]; threshold: number | null; showBalance: boolean }) => {
  const first = rows[0]?.label;
  const last = rows[rows.length - 1]?.label;
  return (
    <div className="h-[280px] w-full rounded-lg" style={{ background: C.surface }} role="img" aria-label={`Encaissements, décaissements${showBalance ? " et solde" : ""} de ${first} à ${last} ; les mois à venir sont hachurés.`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <defs>
            <Hatch id="treasury-hatch-in" color={C.inflow} />
            <Hatch id="treasury-hatch-out" color={C.outflow} />
          </defs>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="label" tick={{ fill: C.mutedInk, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.grid }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: C.mutedInk, fontSize: 11 }} tickFormatter={axisEur} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            contentStyle={{ backgroundColor: C.surface, border: `1px solid ${C.grid}`, borderRadius: 8, color: C.balance, fontSize: 12 }}
            cursor={{ fill: C.grid, fillOpacity: 0.4 }}
            formatter={(value: number, _name: string, item: { dataKey?: string | number }) =>
              OUT_KEYS.has(String(item.dataKey)) && value > 0 ? `− ${eur(value)}` : signedEur(value)}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: C.mutedInk }} />
          <ReferenceLine y={0} stroke={C.mutedInk} />
          {threshold != null && (
            <ReferenceLine y={threshold} stroke={C.outflow} strokeDasharray="4 4" label={{ value: "Seuil", position: "insideTopRight", fill: C.outflow, fontSize: 11 }} />
          )}
          <Bar dataKey="inDone" name="Encaissements" stackId="in" fill={C.inflow} stroke={C.surface} strokeWidth={2} radius={[4, 4, 0, 0]} />
          <Bar dataKey="inForecast" name="Encaissements prévus" stackId="in" fill="url(#treasury-hatch-in)" stroke={C.inflow} strokeWidth={1} radius={[4, 4, 0, 0]} />
          <Bar dataKey="outDone" name="Décaissements" stackId="out" fill={C.outflow} stroke={C.surface} strokeWidth={2} radius={[4, 4, 0, 0]} />
          <Bar dataKey="outForecast" name="Décaissements prévus" stackId="out" fill="url(#treasury-hatch-out)" stroke={C.outflow} strokeWidth={1} radius={[4, 4, 0, 0]} />
          {showBalance && (
            <Line
              type="linear"
              dataKey="balance"
              name="Solde fin de mois"
              stroke={C.balance}
              strokeWidth={2}
              dot={{ r: 4, fill: C.balance, stroke: C.surface, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: C.balance, stroke: C.surface, strokeWidth: 2 }}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
