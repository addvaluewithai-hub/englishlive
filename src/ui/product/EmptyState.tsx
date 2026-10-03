import type { ReactNode } from 'react';
import { Card } from '../primitives/Card';
import styles from './learning.module.css';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <Card className={styles.empty}><h1 className={styles.greeting}>{title}</h1><p className={styles.support}>{description}</p>{action}</Card>;
}
