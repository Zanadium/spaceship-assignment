import { useState } from "react";
import { clearToken, getToken } from "./lib/api";
import { useTheme } from "./lib/theme";
import { Ask } from "./components/Ask";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";

type View = "dashboard" | "ask";

export function App() {
  const [authed, setAuthed] = useState<boolean>(() => Boolean(getToken()));
  const [view, setView] = useState<View>("dashboard");
  const [theme, toggleTheme] = useTheme();

  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  const signOut = () => {
    clearToken();
    setAuthed(false);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">S</div>
          <div className="brand__text">
            <b>Spaceship</b>
            <span>Logistics Control</span>
          </div>
        </div>

        <nav className="nav">
          <button
            className={`nav__item ${view === "dashboard" ? "nav__item--active" : ""}`}
            onClick={() => setView("dashboard")}
          >
            <span className="nav__dot" />
            Overview
          </button>
          <button
            className={`nav__item ${view === "ask" ? "nav__item--active" : ""}`}
            onClick={() => setView("ask")}
          >
            <span className="nav__dot" />
            Ask AI
          </button>
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__meta">
            DATASET · <b>2025</b>
            <br />
            400 orders · 9 carriers
          </div>
          <button className="rowbtn" onClick={toggleTheme}>
            <span>Theme</span>
            <kbd>{theme === "dark" ? "◐ Dark" : "◑ Light"}</kbd>
          </button>
          <button className="rowbtn" onClick={signOut}>
            <span>Sign out</span>
            <kbd>⏻</kbd>
          </button>
        </div>
      </aside>

      <main className="main">{view === "dashboard" ? <Dashboard /> : <Ask />}</main>
    </div>
  );
}
