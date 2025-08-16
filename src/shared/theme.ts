const VARS = {
  // Gradients
  "--bg-primary-gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "--accent-gradient": "linear-gradient(45deg, #667eea, #764ba2)",
  "--bg-muted-gradient": "linear-gradient(45deg, #e5e7eb, #d1d5db)",

  // Text colors
  "--text-primary": "#1f2937",
  "--text-strong": "#374151",
  "--text-darker": "#111827",
  "--text-muted": "#6b7280",
  "--text-subtle": "#9ca3af",
  "--text-inverse": "#ffffff",

  // Borders & Surfaces
  "--border-default": "#e5e7eb",
  "--border-muted": "#d1d5db",
  "--surface-muted": "#f3f4f6",

  // Brand / Primary
  "--brand": "#3b82f6",
  "--brand-hover": "#2563eb",

  // Success
  "--success": "#10b981",
  "--success-hover": "#059669",
  "--success-50": "rgba(16, 185, 129, 0.5)",
  "--success-soft-bg": "#f0fdf4",
  "--success-soft-border": "#bbf7d0",
  "--success-soft-text": "#166534",

  // Danger / Error
  "--danger": "#ef4444",
  "--danger-80": "rgba(239, 68, 68, 0.8)",
  "--danger-90": "rgba(239, 68, 68, 0.9)",
  "--danger-100": "rgba(239, 68, 68, 1)",
  "--danger-border": "rgba(239, 68, 68, 0.5)",
  "--danger-soft-bg": "#fef2f2",
  "--danger-soft-border": "#fecaca",
  "--danger-soft-text": "#dc2626",

  // Informational / Warning (for toasts)

  "--info-90": "rgba(59, 130, 246, 0.9)",
  "--warning-90": "rgba(245, 158, 11, 0.9)",

  // White alpha tokens
  "--white-95": "rgba(255, 255, 255, 0.95)",
  "--white-90": "rgba(255, 255, 255, 0.9)",
  "--white-75": "rgba(255, 255, 255, 0.75)",
  "--white-40": "rgba(255, 255, 255, 0.4)",
  "--white-30": "rgba(255, 255, 255, 0.3)",
  "--white-25": "rgba(255, 255, 255, 0.25)",
  "--white-20": "rgba(255, 255, 255, 0.2)",
  "--white-15": "rgba(255, 255, 255, 0.15)",
  "--white-12": "rgba(255, 255, 255, 0.12)",
  "--white-10": "rgba(255, 255, 255, 0.1)",

  // Black alpha tokens
  "--black-50": "rgba(0, 0, 0, 0.5)",
  "--black-25": "rgba(0, 0, 0, 0.25)",
  "--black-15": "rgba(0, 0, 0, 0.15)",
  "--black-10": "rgba(0, 0, 0, 0.1)",
  "--black-05": "rgba(0, 0, 0, 0.05)",

  // Opacity variants
  "--success-90": "rgba(16, 185, 129, 0.9)",
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
