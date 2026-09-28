import type { InputHTMLAttributes } from "react";

const base =
  "w-full rounded-xl border border-border bg-background-alt px-3.5 py-2.5 text-foreground placeholder:text-muted-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-muted"
    >
      {children}
    </label>
  );
}
