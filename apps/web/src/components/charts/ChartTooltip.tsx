interface TooltipRow {
  value: number;
  name?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipRow[];
  label?: string;
  valueFormat?: (n: number) => string;
  labelFormat?: (s: string) => string;
}

/** Shared themed tooltip used by every chart for a consistent look. */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormat,
  labelFormat,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--bg-3)",
        border: "1px solid var(--line-strong)",
        borderRadius: 6,
        padding: "8px 11px",
        boxShadow: "var(--shadow)",
        fontSize: 12,
        minWidth: 120,
      }}
    >
      {label !== undefined && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-faint)",
            marginBottom: 6,
          }}
        >
          {labelFormat ? labelFormat(label) : label}
        </div>
      )}
      {payload
        .filter((row) => row.value !== null && row.value !== undefined)
        .map((row, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: row.color ?? "var(--accent)",
                flexShrink: 0,
              }}
            />
            {row.name && (
              <span style={{ color: "var(--text-dim)" }}>{row.name}</span>
            )}
            <b
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-mono)",
                color: "var(--text)",
                fontWeight: 600,
              }}
            >
              {valueFormat ? valueFormat(row.value) : row.value}
            </b>
          </div>
        ))}
    </div>
  );
}

/** Common axis tick style shared across charts. */
export const AXIS_TICK = {
  fill: "var(--text-faint)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
} as const;
