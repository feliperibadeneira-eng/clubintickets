import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_24px_-8px_var(--accent)]",
  secondary:
    "bg-surface text-foreground border border-border hover:border-border-hover hover:bg-surface-hover",
  ghost: "text-muted hover:text-foreground hover:bg-surface",
  danger: "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

// Para estilizar un <Link>/<a> exactamente igual que un <Button> cuando la
// acción es navegar en vez de enviar un formulario (ej. "Exportar CSV").
export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className = "",
): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}
