import { useEffect, useState } from "react";
import type { DashboardData } from "@spaceship/shared";
import { getDashboard } from "../lib/api";
import { formatNumber, formatPercent, humanize, shortMonth } from "../lib/format";
import { CATEGORICAL, STATUS_COLOR } from "../lib/theme";
import { BreakdownBar } from "./charts/BreakdownBar";
import { TrendLine } from "./charts/TrendLine";

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load(params?: { dateFrom?: string; dateTo?: string }) {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboard(params));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const apply = () =>
    load({ dateFrom: from || undefined, dateTo: to || undefined });
  const reset = () => {
    setFrom("");
    setTo("");
    void load();
  };

  return (
    <div className="view">
      <div className="topbar">
        <div className="topbar__title">
          <h1>Operations Overview</h1>
          <p>
            Delivery performance and order flow across carriers, warehouses, and
            regions — computed live from the logistics dataset.
          </p>
        </div>
        <div className="topbar__actions">
          <div className="daterange">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
            />
            <span>→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
            />
            <button className="btn btn--ghost" onClick={apply}>
              Apply
            </button>
            {(from || to) && (
              <button className="btn btn--ghost" onClick={reset}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {loading || !data ? (
        <div className="loading panel">
          <div className="spinner" />
          Loading analytics…
        </div>
      ) : (
        <Loaded data={data} />
      )}
    </div>
  );
}

function Loaded({ data }: { data: DashboardData }) {
  const { kpis } = data;
  return (
    <>
      <div className="kpigrid">
        <Kpi label="Total Orders" value={formatNumber(kpis.totalOrders)} />
        <Kpi
          label="Delivered"
          value={formatNumber(kpis.deliveredOrders)}
          foot={`${formatPercent(kpis.deliveredOrders / (kpis.totalOrders || 1))} of orders`}
          tone="good"
        />
        <Kpi
          label="Delayed"
          value={formatNumber(kpis.delayedOrders)}
          foot={`${formatPercent(kpis.delayedOrders / (kpis.totalOrders || 1))} of orders`}
          tone="bad"
        />
        <Kpi
          label="On-time Rate"
          value={formatPercent(kpis.onTimeRate)}
          foot="delivered vs. delayed"
          tone="good"
        />
        <Kpi
          label="Avg Delivery"
          value={`${kpis.avgDeliveryDays.toFixed(1)}d`}
          foot="order → delivery"
        />
      </div>

      <div className="chartgrid" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Order Volume Over Time</div>
            <div className="card__sub">Orders per month</div>
          </div>
          <div className="card__body">
            <TrendLine
              data={data.orderVolumeByMonth}
              xFormat={shortMonth}
              valueFormat={formatNumber}
            />
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Delivery Performance</div>
            <div className="card__sub">Orders by fulfilment status</div>
          </div>
          <div className="card__body">
            <BreakdownBar
              data={data.deliveryPerformance}
              labelFormat={humanize}
              valueFormat={formatNumber}
              colorFor={(label) => STATUS_COLOR[label] ?? "var(--accent)"}
            />
          </div>
        </div>
      </div>

      <div className="card card--span">
        <div className="card__head">
          <div className="card__title">Orders by Carrier</div>
          <div className="card__sub">Volume across delivery partners</div>
        </div>
        <div className="card__body">
          <BreakdownBar
            data={data.carrierBreakdown}
            valueFormat={formatNumber}
            colorFor={(_, i) => CATEGORICAL[i % CATEGORICAL.length] as string}
          />
        </div>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  foot,
  tone,
}: {
  label: string;
  value: string;
  foot?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className={`kpi rise ${tone ? `kpi--${tone}` : ""}`}>
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      {foot && <div className="kpi__foot">{foot}</div>}
    </div>
  );
}
