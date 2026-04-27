export const DEFAULT_CATEGORIES = [
  { key: "bano", label: "Ba\u00f1o" },
  { key: "comedor", label: "Comedor" },
  { key: "habitacion", label: "Habitaci\u00f3n" },
  { key: "vestidor", label: "Vestidor" },
  { key: "terraza", label: "Terraza" },
  { key: "general", label: "General" }
];

export const TASKS_STORAGE_KEY = "weekly-cyclic-tasks-v3";
export const CATEGORIES_STORAGE_KEY = "weekly-cyclic-categories-v1";
export const STORAGE_META_KEY = "weekly-cyclic-meta-v1";

const MIGRATION_PARAM = "appnotas-migrate";
const STORAGE_KEYS = [CATEGORIES_STORAGE_KEY, TASKS_STORAGE_KEY, STORAGE_META_KEY];

function readCurrentStorage() {
  return STORAGE_KEYS.reduce((accumulator, key) => {
    const value = window.localStorage.getItem(key);
    if (value !== null) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

function writeStorageSnapshot(snapshot) {
  Object.entries(snapshot).forEach(([key, value]) => {
    if (typeof value === "string") {
      window.localStorage.setItem(key, value);
    }
  });
}

function getSnapshotTimestamp(snapshot) {
  const value = snapshot?.[STORAGE_META_KEY];
  if (typeof value !== "string") {
    return 0;
  }

  try {
    const parsed = JSON.parse(value);
    return typeof parsed?.updatedAt === "number" ? parsed.updatedAt : 0;
  } catch {
    return 0;
  }
}

function encodeSnapshot(snapshot) {
  return window.btoa(
    encodeURIComponent(JSON.stringify(snapshot)).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    )
  );
}

function decodeSnapshot(value) {
  try {
    const json = decodeURIComponent(
      Array.from(window.atob(value))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getCanonicalHost() {
  const configuredHost = import.meta.env.VITE_APP_CANONICAL_HOST;
  const vercelProductionHost = import.meta.env.VITE_VERCEL_PROJECT_PRODUCTION_URL;

  return (configuredHost || vercelProductionHost || "").trim().replace(/^https?:\/\//, "");
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function importMigrationPayload() {
  const url = new URL(window.location.href);
  const payload = url.searchParams.get(MIGRATION_PARAM);

  if (!payload) {
    return;
  }

  const snapshot = decodeSnapshot(payload);
  const currentSnapshot = readCurrentStorage();

  if (snapshot && getSnapshotTimestamp(snapshot) >= getSnapshotTimestamp(currentSnapshot)) {
    writeStorageSnapshot(snapshot);
  }

  url.searchParams.delete(MIGRATION_PARAM);
  window.history.replaceState({}, "", url.toString());
}

export function bootstrapPersistentStorage() {
  importMigrationPayload();

  const canonicalHost = getCanonicalHost();
  const currentHost = window.location.hostname;

  if (!canonicalHost || canonicalHost === currentHost || isLocalHost(currentHost)) {
    return;
  }

  const snapshot = readCurrentStorage();
  const nextUrl = new URL(window.location.href);
  nextUrl.protocol = "https:";
  nextUrl.host = canonicalHost;

  if (Object.keys(snapshot).length > 0) {
    nextUrl.searchParams.set(MIGRATION_PARAM, encodeSnapshot(snapshot));
  }

  window.location.replace(nextUrl.toString());
}
