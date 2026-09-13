"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { IconLoader } from "./Icons";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "workout" | "chill";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-text text-bg hover:bg-white active:scale-[0.98]",
  secondary: "bg-surface-3 text-text hover:bg-[#333338] active:scale-[0.98]",
  ghost: "text-muted hover:text-text hover:bg-surface-3",
  danger: "bg-danger/15 text-danger hover:bg-danger hover:text-white",
  workout: "bg-workout text-black hover:brightness-110 active:scale-[0.98]",
  chill: "bg-chill text-black hover:brightness-110 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  icon,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <IconLoader size={16} /> : icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  size = 40,
  className = "",
  active,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: number; active?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
        active ? "text-text" : "text-muted hover:text-text hover:bg-surface-3"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 pb-10 pt-6 md:px-8 md:pt-10 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-sm text-muted hover:text-text">
            &larr; {back.label}
          </Link>
        )}
        <h1 className="truncate text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      {icon && <div className="mb-4 text-subtle">{icon}</div>}
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-3 ${className}`} />;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <IconLoader size={20} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: "neutral" | "workout" | "chill" | "brand";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/10 text-muted",
    workout: "bg-workout/15 text-workout",
    chill: "bg-chill/15 text-chill",
    brand: "bg-brand/15 text-brand",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Thumb({
  src,
  alt,
  className = "",
  rounded = "rounded-lg",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden bg-surface-3 ${rounded} ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- YouTube CDN thumbnails are already sized and cached.
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-subtle">
          <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}
    </div>
  );
}
