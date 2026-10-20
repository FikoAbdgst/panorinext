import Link from "next/link";

export type CategoryFilterOption = {
  label: string;
  href: string;
  active: boolean;
};

export function CategorySelector({ options }: { options: CategoryFilterOption[] }) {
  return (
    <nav aria-label="Kategori frame" className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? "page" : undefined}
          className={`inline-flex min-h-10 items-center border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BF3131] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FEF3E2] ${
            option.active
              ? "border-[#BF3131] bg-[#BF3131] text-[#FEF3E2]"
              : "border-[#BF3131]/25 bg-[#FFFBF3]/60 text-[#5B3A32] hover:border-[#BF3131] hover:text-[#BF3131]"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
