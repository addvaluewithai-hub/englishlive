import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './controls.module.css';

interface ButtonAppearance { variant?: 'primary' | 'secondary' | 'quiet'; size?: 'md' | 'lg' }
function buttonClass({ variant = 'primary', size = 'md' }: ButtonAppearance, className?: string) {
  return [styles.button, variant !== 'primary' ? styles[variant] : '', size === 'lg' ? styles.large : '', className].filter(Boolean).join(' ');
}
export function Button({ variant, size, className, type = 'button', loading = false, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & ButtonAppearance & { loading?: boolean }) {
  return <button {...props} type={type} className={buttonClass({ variant, size }, className)} disabled={disabled || loading} aria-busy={loading || undefined} />;
}
export function ButtonLink({ variant, size, className, ...props }: LinkProps & ButtonAppearance) {
  return <Link {...props} className={buttonClass({ variant, size }, className)} />;
}
