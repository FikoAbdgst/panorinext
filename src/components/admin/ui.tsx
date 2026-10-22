import type { ReactNode } from "react";

export function AdminSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-[#7A5A50]">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AdminLoading({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="admin-skeleton h-11 w-full max-w-xs" />
      <div className="admin-card overflow-hidden p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="admin-skeleton my-2 h-9" />
        ))}
      </div>
    </div>
  );
}
