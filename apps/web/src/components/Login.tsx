import { type FormEvent, useState } from "react";
import { ApiError, login } from "../lib/api";

const DEMO_USER = import.meta.env.VITE_DEMO_USERNAME ?? "";
const DEMO_PASS = import.meta.env.VITE_DEMO_PASSWORD ?? "";

export function Login({ onAuthed }: { onAuthed: () => void }) {
  const [username, setUsername] = useState(DEMO_USER);
  const [password, setPassword] = useState(DEMO_PASS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      onAuthed();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Sign in failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card rise" onSubmit={submit}>
        <div className="login__brand">
          <div className="brand__mark">S</div>
          <div>
            <h1>Spaceship</h1>
            <span>Logistics Control</span>
          </div>
        </div>

        <p className="login__lead">
          AI-powered logistics analytics — dashboards, natural-language queries,
          and demand forecasting over your operational data.
        </p>

        {error && <div className="alert">{error}</div>}

        <div className="field">
          <label className="field__label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            placeholder="reviewer"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          className="btn btn--primary"
          type="submit"
          disabled={busy}
          style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        {DEMO_USER && (
          <div className="login__hint">
            Demo access — user <b>{DEMO_USER}</b>
            {DEMO_PASS ? (
              <>
                {" "}
                / pass <b>{DEMO_PASS}</b>
              </>
            ) : null}
            . Prefilled above; just press Sign in.
          </div>
        )}
      </form>
    </div>
  );
}
