export type ExperienceProfile = 'adult' | 'teen';
export type ThemeTokens = Record<`--${string}`, string>;
export interface ExperienceDefinition {
  id: ExperienceProfile;
  mascotFamily: ExperienceProfile;
  tokens: ThemeTokens;
}

export const adult: ExperienceDefinition = {
  id: 'adult',
  mascotFamily: 'adult',
  tokens: {
    '--color-primary': '#176b66',
    '--color-primary-hover': '#10524e',
    '--color-on-primary': '#ffffff',
    '--color-secondary': '#493f73',
    '--color-accent': '#ab4b35',
    '--color-background': '#f7f6f2',
    '--color-surface': '#ffffff',
    '--color-surface-raised': '#edf4f1',
    '--color-text': '#182d39',
    '--color-text-muted': '#53626c',
    '--color-border': '#d9e1df',
    '--color-success': '#176b48',
    '--color-warning': '#8b590c',
    '--color-danger': '#b33434',
    '--color-info': '#275e97',
    '--color-focus': '#176b66',
    '--radius-sm': '8px',
    '--radius-md': '14px',
    '--radius-lg': '22px',
    '--radius-pill': '999px',
    '--space-1': '4px',
    '--space-2': '8px',
    '--space-3': '12px',
    '--space-4': '16px',
    '--space-5': '24px',
    '--space-6': '32px',
    '--space-7': '48px',
    '--font-body': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    '--font-display': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    '--text-xs': '0.8125rem',
    '--text-sm': '0.9375rem',
    '--text-md': '1rem',
    '--text-lg': '1.25rem',
    '--text-xl': '1.5rem',
    '--text-2xl': 'clamp(1.75rem, 4vw, 2.75rem)',
    '--shadow-card': '0 6px 24px rgb(24 45 57 / 4%)',
    '--shadow-floating': '0 8px 32px rgb(24 45 57 / 10%)',
    '--motion-fast': '120ms',
    '--motion-normal': '180ms',
    '--motion-slow': '280ms',
    '--mascot-size': '180px',
  },
};

export const teen: ExperienceDefinition = {
  id: 'teen',
  mascotFamily: 'teen',
  tokens: {
    ...adult.tokens,
    '--color-primary': '#5945a1',
    '--color-primary-hover': '#42317c',
    '--color-focus': '#5945a1',
    '--color-secondary': '#176b66',
    '--color-surface-raised': '#f0edf8',
    '--radius-sm': '10px',
    '--radius-md': '18px',
    '--radius-lg': '28px',
    '--space-5': '20px',
    '--space-6': '28px',
    '--motion-normal': '240ms',
    '--mascot-size': '200px',
  },
};

export const experienceProfiles = { adult, teen };
export function resolveExperienceProfile(value: unknown): ExperienceProfile {
  return value === 'teen' ? 'teen' : 'adult';
}
