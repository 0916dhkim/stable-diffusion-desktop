const VARS = {
  "--bg-primary-gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
