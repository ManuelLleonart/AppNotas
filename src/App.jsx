import React, { useEffect, useState } from "react";

const ZONES = [
  { key: "bano", label: "Ba\u00f1o" },
  { key: "comedor", label: "Comedor" },
  { key: "habitacion", label: "Habitaci\u00f3n" },
  { key: "vestidor", label: "Vestidor" },
  { key: "terraza", label: "Terraza" },
  { key: "general", label: "General" }
];

const STORAGE_KEY = "weekly-cyclic-tasks-v2";

function createEmptyZones() {
  return ZONES.reduce((accumulator, zone) => {
    accumulator[zone.key] = [];
    return accumulator;
  }, {});
}

function normalizeStoredTasks(value) {
  const fallback = createEmptyZones();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  return ZONES.reduce((accumulator, zone) => {
    accumulator[zone.key] = Array.isArray(value[zone.key]) ? value[zone.key] : [];
    return accumulator;
  }, {});
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function InstallBanner({ deferredPrompt, onInstall, isStandalone }) {
  if (isStandalone) {
    return (
      <section className="hero-banner success">
        <div>
          <p className="eyebrow">Instalada</p>
          <h2>La app ya funciona como acceso directo</h2>
          <p>
            Puedes abrirla desde la pantalla de inicio y usarla tambien sin conexion.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-banner">
      <div>
        <p className="eyebrow">Version movil</p>
        <h2>Instalala en tu telefono y usala como una app real</h2>
        <p>
          Guarda tus tareas en el movil, abre rapido desde el inicio y sigue usando la lista aunque no tengas red.
        </p>
      </div>
      {deferredPrompt ? (
        <button className="primary-button install-button" onClick={onInstall}>
          Instalar app
        </button>
      ) : (
        <p className="install-hint">
          Si no ves el boton, abre esta web en Chrome o Safari y usa "Anadir a pantalla de inicio".
        </p>
      )}
    </section>
  );
}

export default function App() {
  const [selectedZone, setSelectedZone] = useState(ZONES[0].key);
  const [text, setText] = useState("");
  const [tasksByZone, setTasksByZone] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return normalizeStoredTasks(saved ? JSON.parse(saved) : null);
    } catch {
      return createEmptyZones();
    }
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const currentZone = ZONES.find((zone) => zone.key === selectedZone) || ZONES[0];
  const tasks = tasksByZone[selectedZone] || [];
  const completedCount = tasks.filter((task) => task.done).length;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByZone));
  }, [tasksByZone]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const syncStandalone = () => {
      setIsStandalone(mediaQuery.matches || window.navigator.standalone === true);
    };

    syncStandalone();
    mediaQuery.addEventListener("change", syncStandalone);

    return () => {
      mediaQuery.removeEventListener("change", syncStandalone);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!allCompleted) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setTasksByZone((previous) => ({
        ...previous,
        [selectedZone]: previous[selectedZone].map((task) => ({
          ...task,
          done: false
        }))
      }));
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [allCompleted, selectedZone]);

  const addTask = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setTasksByZone((previous) => ({
      ...previous,
      [selectedZone]: [
        ...previous[selectedZone],
        {
          id: uid(),
          label: trimmed,
          done: false
        }
      ]
    }));
    setText("");
  };

  const toggleTask = (id) => {
    setTasksByZone((previous) => ({
      ...previous,
      [selectedZone]: previous[selectedZone].map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    }));
  };

  const deleteTask = (id) => {
    setTasksByZone((previous) => ({
      ...previous,
      [selectedZone]: previous[selectedZone].filter((task) => task.id !== id)
    }));
  };

  const resetZone = () => {
    setTasksByZone((previous) => ({
      ...previous,
      [selectedZone]: previous[selectedZone].map((task) => ({
        ...task,
        done: false
      }))
    }));
  };

  const clearZone = () => {
    setTasksByZone((previous) => ({
      ...previous,
      [selectedZone]: []
    }));
  };

  const installApp = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-a" />
      <div className="background-glow background-glow-b" />

      <main className="app-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">AppNotas</p>
            <h1>Limpieza por zonas</h1>
            <p className="subtitle">
              Organiza tareas ciclicas, tachalas rapido y deja que se reinicien solas al completar la zona.
            </p>
          </div>
          <div className="status-pill">
            <span className="status-dot" />
            Guardado automatico
          </div>
        </header>

        <InstallBanner
          deferredPrompt={deferredPrompt}
          onInstall={installApp}
          isStandalone={isStandalone}
        />

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Zonas</p>
              <h2>Elige donde vas a trabajar</h2>
            </div>
            <p className="counter-text">
              {completedCount}/{tasks.length || 0} hechas
            </p>
          </div>

          <div className="zone-grid">
            {ZONES.map((zone) => (
              <button
                key={zone.key}
                className={zone.key === selectedZone ? "zone-chip active" : "zone-chip"}
                onClick={() => setSelectedZone(zone.key)}
              >
                {zone.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Hoy</p>
              <h2>{currentZone.label}</h2>
            </div>
            <div className="progress-ring">
              <strong>{progress}%</strong>
              <span>completado</span>
            </div>
          </div>

          <div className="composer">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addTask();
                }
              }}
              placeholder={`Nueva tarea para ${currentZone.label.toLowerCase()}`}
            />
            <button className="primary-button" onClick={addTask}>
              Anadir
            </button>
          </div>

          <div className="progress-bar" aria-hidden="true">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="task-list">
            {tasks.length === 0 ? (
              <article className="empty-state">
                <h3>No hay tareas todavia</h3>
                <p>
                  Crea tu primera tarea para {currentZone.label.toLowerCase()} y la tendras guardada en el movil.
                </p>
              </article>
            ) : (
              tasks.map((task) => (
                <article key={task.id} className={task.done ? "task-card done" : "task-card"}>
                  <label className="task-main">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span>{task.label}</span>
                  </label>
                  <button
                    className="ghost-button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Eliminar ${task.label}`}
                  >
                    Borrar
                  </button>
                </article>
              ))
            )}
          </div>

          <div className="action-row">
            <button className="secondary-button" onClick={resetZone}>
              Desmarcar todas
            </button>
            <button className="secondary-button danger" onClick={clearZone}>
              Vaciar zona
            </button>
          </div>

          {allCompleted ? (
            <div className="done-banner">
              Todo listo en {currentZone.label.toLowerCase()}. Reiniciando las tareas para la siguiente vuelta.
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
