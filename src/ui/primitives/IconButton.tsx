import type { ComponentProps } from 'react';
import { Button, ButtonLink } from './Button';
import styles from './controls.module.css';

export function IconButton({ label, className, ...props }: Omit<ComponentProps<typeof Button>, 'aria-label'> & { label: string }) {
  return <Button variant="secondary" {...props} aria-label={label} className={[styles.icon, className].filter(Boolean).join(' ')} />;
}
export function IconLink({ label, className, ...props }: Omit<ComponentProps<typeof ButtonLink>, 'aria-label'> & { label: string }) {
  return <ButtonLink variant="secondary" {...props} aria-label={label} className={[styles.icon, className].filter(Boolean).join(' ')} />;
}
