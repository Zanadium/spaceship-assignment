import { type FormEvent, useRef, useState } from "react";
import type { AnswerEnvelope } from "@spaceship/shared";
import { ask } from "../lib/api";
import { ResultCard } from "./ResultCard";

const EXAMPLES = [
  "Which carrier has the highest delay rate?",
  "Show delayed orders by week for the last 3 months",
  "How many orders were delivered late last month?",
  "Order volume by month",
  "Predict demand for SKU PAPER-0197 for the next 4 months",
  "Total order value by region",
];

interface Entry {
  id: number;
  env: AnswerEnvelope;
}

export function Ask() {
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);

  async function run(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const env = await ask(text);
      setEntries((prev) => [{ id: nextId.current++, env }, ...prev]);
      setQ("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setBusy(false);
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(q);
  };

  return (
    <div className="view">
      <div className="topbar">
        <div className="topbar__title">
          <h1>Ask the Data</h1>
          <p>
            Ask in plain English. The AI interprets your question, selects the
            right tool, and every answer is computed directly from the data —
            never guessed. Expand “Explainability” to see exactly how.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="askbar">
        <input
          className="askbar__input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Which carrier has the highest delay rate?"
          aria-label="Ask a question"
          autoFocus
        />
        <button className="btn btn--primary" type="submit" disabled={busy || !q.trim()}>
          {busy ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="chips">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            className="chip"
            onClick={() => run(ex)}
            disabled={busy}
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <div className="alert">{error}</div>}

      {busy && (
        <div className="loading panel">
          <div className="spinner" />
          Interpreting your question…
        </div>
      )}

      {entries.map((entry) => (
        <ResultCard key={entry.id} env={entry.env} />
      ))}
    </div>
  );
}
