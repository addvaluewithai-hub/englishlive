import type { en } from './catalogs/en';

export type Message = string | (Partial<Record<Intl.LDMLPluralRule, string>> & { other: string });
export type MessageKey = keyof typeof en;

export interface MessageParams {
  'home.greeting': { name: string };
  'home.unit': { number: number };
  'home.lesson': { number: number };
  'home.progressCount': { count: number; total: number };
  'home.completed': { count: number };
  'learn.progressCount': { completed: number; total: number };
  'progress.title': { level: string };
  'progress.completedCount': { count: number; total: number };
  'progress.unitTitle': { number: number };
}

export type Translator = <K extends MessageKey>(
  key: K,
  ...args: K extends keyof MessageParams ? [params: MessageParams[K]] : [params?: never]
) => string;
