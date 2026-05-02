export const DARK = {
  bg: '#05090f', surface: '#0a1120', card: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.07)', borderAccent: 'rgba(0,201,167,0.35)',
  teal: '#00c9a7', tealDim: 'rgba(0,201,167,0.12)',
  blue: '#4a7bff', blueDim: 'rgba(74,123,255,0.12)',
  purple: '#a78bfa', purpleDim: 'rgba(167,139,250,0.12)',
  amber: '#fbbf24', amberDim: 'rgba(251,191,36,0.12)',
  red: '#f87171', redDim: 'rgba(248,113,113,0.12)',
  pink: '#f472b6', pinkDim: 'rgba(244,114,182,0.12)',
  green: '#4ade80', greenDim: 'rgba(74,222,128,0.12)',
  text: '#e2e8f0', textSub: '#94a3b8', textMuted: '#475569',
};

export const LIGHT = {
  bg: '#f1f5f9', surface: '#ffffff', card: 'rgba(0,0,0,0.03)',
  border: 'rgba(0,0,0,0.1)', borderAccent: 'rgba(0,145,122,0.45)',
  teal: '#00917a', tealDim: 'rgba(0,145,122,0.12)',
  blue: '#2563eb', blueDim: 'rgba(37,99,235,0.1)',
  purple: '#6d4fdb', purpleDim: 'rgba(109,79,219,0.1)',
  amber: '#b45309', amberDim: 'rgba(180,83,9,0.1)',
  red: '#dc2626', redDim: 'rgba(220,38,38,0.1)',
  pink: '#be185d', pinkDim: 'rgba(190,24,93,0.1)',
  green: '#16a34a', greenDim: 'rgba(22,163,74,0.1)',
  text: '#1e293b', textSub: '#475569', textMuted: '#94a3b8',
};

// T is mutable — applyTheme() updates it before each render
export const T = { ...DARK };

export const applyTheme = (themeName) => {
  const colors = themeName === 'light' ? LIGHT : DARK;
  Object.assign(T, colors);
  const root = document.documentElement;
  // CSS vars for global class styles (btn-ghost, input-base, scrollbar)
  root.style.setProperty('--input-bg',       colors.card);
  root.style.setProperty('--input-border',   colors.border);
  root.style.setProperty('--input-color',    colors.text);
  root.style.setProperty('--input-ph',       colors.textMuted);
  root.style.setProperty('--input-opt-bg',   colors.surface);
  root.style.setProperty('--ghost-border',   colors.border);
  root.style.setProperty('--ghost-color',    colors.textSub);
  root.style.setProperty('--ghost-hover',    colors.text);
  root.style.setProperty('--scrollbar',      themeName === 'light' ? 'rgba(0,145,122,0.4)' : 'rgba(0,201,167,0.3)');
};

export const avatarColors = [
  '#4a7bff','#00c9a7','#a78bfa','#fbbf24',
  '#f472b6','#f87171','#34d399','#60a5fa',
];
export const avatarBg = (name) => avatarColors[name.charCodeAt(0) % avatarColors.length];
