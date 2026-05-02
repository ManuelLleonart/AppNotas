import React, { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES_STORAGE_KEY,
  DEFAULT_CATEGORIES,
  STORAGE_META_KEY,
  TASKS_STORAGE_KEY,
  THEME_STORAGE_KEY
} from "./storage";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_TASK_LABELS = {
  general: ["Limpiar el polvo", "Pasar el aspirador"],
  bano: [
    "Limpiar los cristales",
    "Limpiar el vater",
    "Limpiar la ducha",
    "Limpiar el lavabo",
    "Limpiar los metales",
    "Vaciar papelera",
    "Aspirar detras del vater"
  ],
  comedor: ["Limpiar ventanales", "Aspirar sofa", "Limpiar sillas"],
  habitacion: [
    "Hacer la cama",
    "Mover las mesitas",
    "Aspirar la cama",
    "Limpiar la ventana"
  ],
  terraza: ["Aspirar el suelo", "Pasar el mocho"],
  vestidor: []
};

function createDefaultTasks(categories) {
  return categories.reduce((accumulator, category) => {
    const labels = DEFAULT_TASK_LABELS[category.key] || [];
    accumulator[category.key] = labels.map((label, index) => ({
      id: `${category.key}-${index + 1}`,
      label,
      done: false
    }));
    return accumulator;
  }, {});
}

function buildEmptyTasks(categories) {
  return categories.reduce((accumulator, category) => {
    accumulator[category.key] = [];
    return accumulator;
  }, {});
}

function normalizeCategories(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_CATEGORIES;
  }

  const seen = new Set();
  const normalized = value
    .map((category) => {
      if (!category || typeof category !== "object") {
        return null;
      }

      const key = typeof category.key === "string" && category.key.trim() ? category.key.trim() : uid();
      const label =
        typeof category.label === "string" && category.label.trim()
          ? category.label.trim()
          : "Sin nombre";

      if (seen.has(key)) {
        return null;
      }

      seen.add(key);
      return { key, label };
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : DEFAULT_CATEGORIES;
}

function normalizeTasks(value, categories) {
  const fallback = createDefaultTasks(categories);

  if (!value || typeof value !== "object") {
    return fallback;
  }

  return categories.reduce((accumulator, category) => {
    accumulator[category.key] = Array.isArray(value[category.key]) ? value[category.key] : [];
    return accumulator;
  }, {});
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
    } catch {
      return "light";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      return normalizeCategories(saved ? JSON.parse(saved) : null);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState(() => DEFAULT_CATEGORIES[0].key);
  const [taskText, setTaskText] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [tasksByCategory, setTasksByCategory] = useState(() => {
    try {
      const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      const activeCategories = normalizeCategories(savedCategories ? JSON.parse(savedCategories) : null);
      const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      return normalizeTasks(savedTasks ? JSON.parse(savedTasks) : null, activeCategories);
    } catch {
      return createDefaultTasks(DEFAULT_CATEGORIES);
    }
  });

  const currentCategory =
    categories.find((category) => category.key === selectedCategory) || categories[0] || null;
  const tasks = currentCategory ? tasksByCategory[currentCategory.key] || [] : [];
  const completedCount = tasks.filter((task) => task.done).length;
  const allCompleted = tasks.length > 0 && completedCount === tasks.length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasksByCategory));
    localStorage.setItem(
      STORAGE_META_KEY,
      JSON.stringify({
        updatedAt: Date.now()
      })
    );
  }, [categories, tasksByCategory]);

  useEffect(() => {
    setTasksByCategory((previous) => {
      const next = normalizeTasks(previous, categories);
      const previousKeys = Object.keys(previous || {});
      const nextKeys = Object.keys(next);
      const sameShape =
        previousKeys.length === nextKeys.length &&
        nextKeys.every((key) => previous[key] === next[key]);

      return sameShape ? previous : next;
    });

    if (!currentCategory && categories[0]) {
      setSelectedCategory(categories[0].key);
    }
  }, [categories, currentCategory]);

  useEffect(() => {
    if (!allCompleted || !currentCategory) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setTasksByCategory((previous) => ({
        ...previous,
        [currentCategory.key]: previous[currentCategory.key].map((task) => ({
          ...task,
          done: false
        }))
      }));
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [allCompleted, currentCategory]);

  const addTask = () => {
    const trimmed = taskText.trim();
    if (!trimmed || !currentCategory) {
      return;
    }

    setTasksByCategory((previous) => ({
      ...previous,
      [currentCategory.key]: [
        ...previous[currentCategory.key],
        { id: uid(), label: trimmed, done: false }
      ]
    }));
    setTaskText("");
  };

  const toggleTask = (id) => {
    if (!currentCategory) {
      return;
    }

    setTasksByCategory((previous) => ({
      ...previous,
      [currentCategory.key]: previous[currentCategory.key].map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    }));
  };

  const deleteTask = (id) => {
    if (!currentCategory) {
      return;
    }

    setTasksByCategory((previous) => ({
      ...previous,
      [currentCategory.key]: previous[currentCategory.key].filter((task) => task.id !== id)
    }));
  };

  const resetCategory = () => {
    if (!currentCategory) {
      return;
    }

    setTasksByCategory((previous) => ({
      ...previous,
      [currentCategory.key]: previous[currentCategory.key].map((task) => ({
        ...task,
        done: false
      }))
    }));
  };

  const clearCategory = () => {
    if (!currentCategory) {
      return;
    }

    setTasksByCategory((previous) => ({
      ...previous,
      [currentCategory.key]: []
    }));
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      return;
    }

    const category = { key: uid(), label: trimmed };
    setCategories((previous) => [...previous, category]);
    setTasksByCategory((previous) => ({
      ...previous,
      [category.key]: []
    }));
    setSelectedCategory(category.key);
    setNewCategory("");
  };

  const renameCategory = (key, label) => {
    const trimmed = label.trimStart();

    setCategories((previous) =>
      previous.map((category) =>
        category.key === key ? { ...category, label: trimmed || category.label } : category
      )
    );
  };

  const finishRenameCategory = (key, label) => {
    const trimmed = label.trim();
    if (!trimmed) {
      return;
    }

    setCategories((previous) =>
      previous.map((category) =>
        category.key === key ? { ...category, label: trimmed } : category
      )
    );
  };

  const deleteCategory = (key) => {
    if (categories.length === 1) {
      return;
    }

    setCategories((previous) => previous.filter((category) => category.key !== key));
    setTasksByCategory((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });

    if (selectedCategory === key) {
      const remaining = categories.find((category) => category.key !== key);
      if (remaining) {
        setSelectedCategory(remaining.key);
      }
    }
  };

  const categoriesSummary = useMemo(
    () => `${categories.length} categor${categories.length === 1 ? "ia" : "ias"}`,
    [categories.length]
  );

  const toggleTheme = () => {
    setTheme((previous) => (previous === "dark" ? "light" : "dark"));
  };

  if (!currentCategory) {
    return null;
  }

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-a" />
      <div className="background-glow background-glow-b" />

      <main className="app-frame">
        <section className="panel top-panel">
          <div className="topbar">
            <div>
              <p className="eyebrow">Limpia tu casa</p>
              <h1>Rutina de limpieza</h1>
            </div>
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
              title={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
            >
              <span aria-hidden="true">{theme === "dark" ? "\u2600" : "\u263E"}</span>
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Categorias</p>
              <h2>Organiza tu casa a tu manera</h2>
            </div>
            <p className="counter-text">{categoriesSummary}</p>
          </div>

          <div className="composer category-composer">
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addCategory();
                }
              }}
              placeholder="Nueva categoria"
            />
            <button className="primary-button" onClick={addCategory}>
              Anadir categoria
            </button>
          </div>

          <div className="zone-grid">
            {categories.map((category) => (
              <button
                key={category.key}
                className={category.key === selectedCategory ? "zone-chip active" : "zone-chip"}
                onClick={() => setSelectedCategory(category.key)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="category-editor-toggle-row">
            <button
              className="secondary-button category-toggle-button"
              onClick={() => setIsCategoryEditorOpen((previous) => !previous)}
            >
              {isCategoryEditorOpen ? "Ocultar edicion de categorias" : "Editar y borrar categorias"}
            </button>
          </div>

          {isCategoryEditorOpen ? (
            <div className="category-editor-list">
              {categories.map((category) => (
                <article key={category.key} className="category-editor-card">
                  <input
                    value={category.label}
                    onChange={(event) => renameCategory(category.key, event.target.value)}
                    onBlur={(event) => finishRenameCategory(category.key, event.target.value)}
                  />
                  <button
                    className="ghost-button"
                    onClick={() => deleteCategory(category.key)}
                    disabled={categories.length === 1}
                  >
                    Borrar
                  </button>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Hoy</p>
              <h2>{currentCategory.label}</h2>
            </div>
            <div className="progress-ring">
              <strong>{progress}%</strong>
              <span>completado</span>
            </div>
          </div>

          <div className="composer">
            <input
              value={taskText}
              onChange={(event) => setTaskText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addTask();
                }
              }}
              placeholder={`Nueva tarea para ${currentCategory.label.toLowerCase()}`}
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
                  Crea tu primera tarea para {currentCategory.label.toLowerCase()} y la tendras guardada en el movil.
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
            <button className="secondary-button" onClick={resetCategory}>
              Desmarcar todas
            </button>
            <button className="secondary-button danger" onClick={clearCategory}>
              Vaciar categoria
            </button>
          </div>

          {allCompleted ? (
            <div className="done-banner">
              Todo listo en {currentCategory.label.toLowerCase()}. Reiniciando las tareas para la siguiente vuelta.
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
