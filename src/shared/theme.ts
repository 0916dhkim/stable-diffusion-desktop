const VARS = {
  // Gradients
  "--gradient-primary": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",

  // Shadow (solid color, no opacity)
  "--shadow": "0 10px 15px -3px #9ca3af, 0 4px 6px -2px #9ca3af",

  // Blues
  "--color-blue-100": "#dbeafe",
  "--color-blue-200": "#bfdbfe",
  "--color-blue-300": "#93c5fd",
  "--color-blue-400": "#60a5fa",
  "--color-blue-500": "#3b82f6",
  "--color-blue-600": "#2563eb",
  "--color-blue-700": "#1d4ed8",
  "--color-blue-800": "#1e40af",

  // Reds
  "--color-red-100": "#fee2e2",
  "--color-red-200": "#fecaca",
  "--color-red-300": "#fca5a5",
  "--color-red-400": "#f87171",
  "--color-red-500": "#ef4444",
  "--color-red-600": "#dc2626",
  "--color-red-700": "#b91c1c",
  "--color-red-800": "#991b1b",

  // Greens
  "--color-green-100": "#dcfce7",
  "--color-green-200": "#bbf7d0",
  "--color-green-300": "#86efac",
  "--color-green-400": "#4ade80",
  "--color-green-500": "#22c55e",
  "--color-green-600": "#16a34a",
  "--color-green-700": "#15803d",
  "--color-green-800": "#166534",

  // Yellows
  "--color-yellow-100": "#fef3c7",
  "--color-yellow-200": "#fde68a",
  "--color-yellow-300": "#fcd34d",
  "--color-yellow-400": "#fbbf24",
  "--color-yellow-500": "#f59e0b",
  "--color-yellow-600": "#d97706",
  "--color-yellow-700": "#b45309",
  "--color-yellow-800": "#92400e",

  // Paper (neutrals)
  "--color-paper-100": "#f3f4f6",
  "--color-paper-200": "#e5e7eb",
  "--color-paper-300": "#d1d5db",
  "--color-paper-400": "#9ca3af",
  "--color-paper-500": "#6b7280",
  "--color-paper-600": "#4b5563",
  "--color-paper-700": "#374151",
  "--color-paper-800": "#1f2937",
} as const;

const APP_THEME = {
  var: <K extends keyof typeof VARS>(key: K): string => `var(${key})`,
  VARS,
} as const;

type AppTheme = typeof APP_THEME;

// For Intellisense, augment the global Theme interface.
declare global {
  namespace FlowCss {
    interface Theme extends AppTheme {}
  }
}

export default APP_THEME;
