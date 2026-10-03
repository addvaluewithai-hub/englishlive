import type { HTMLAttributes } from 'react';
import styles from './surfaces.module.css';

export function Card({ className, tone = 'default', ...props }: HTMLAttributes<HTMLElement> & { tone?: 'default' | 'raised' }) {
  return <section {...props} className={[styles.card, tone === 'raised' ? styles.raised : '', className].filter(Boolean).join(' ')} />;
}
