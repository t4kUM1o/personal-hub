import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string; // 最後の要素(現在地)はhref無し
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="パンくずリスト" className="text-xs text-gray-400">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-accent hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
