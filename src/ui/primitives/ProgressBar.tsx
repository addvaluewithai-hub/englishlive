import styles from './surfaces.module.css';
import { normalizedProgress } from './progress';

export function ProgressBar({ value, max, label, valueText }: { value: number; max: number; label: string; valueText?: string }) {
  return <progress {...normalizedProgress(value, max)} className={styles.progress} aria-label={label} aria-valuetext={valueText} />;
}
