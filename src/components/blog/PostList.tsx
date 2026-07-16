import Link from "next/link";
import { FadeInSection } from "@/components/motion/FadeInSection";

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
}

export function PostList({ posts }: { posts: PostListItem[] }) {
  if (posts.length === 0) {
    return <p className="text-gray-400">記事が見つかりませんでした</p>;
  }

  return (
    <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2">
      {posts.map((post, index) => (
        <FadeInSection key={post.id} delay={Math.min(index, 5) * 0.08} className="list-none">
          <li>
            <Link href={`/blog/${post.slug}`} className="group block">
              <div className="overflow-hidden rounded-card bg-gray-100 dark:bg-gray-900">
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt=""
                    className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-accent/10 via-gray-50 to-gray-100 dark:from-accent/10 dark:via-gray-900 dark:to-gray-950">
                    <span className="font-display text-4xl font-bold text-accent/30">
                      {post.title.slice(0, 1)}
                    </span>
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-gray-400">
                {post.publishedAt?.toLocaleDateString("ja-JP")}
                {post.category && <span className="ml-2 text-accent">{post.category.name}</span>}
              </p>
              <h2 className="mt-1 font-display text-xl font-bold leading-snug text-gray-900 transition-colors group-hover:text-accent dark:text-gray-100">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {post.excerpt}
                </p>
              )}
            </Link>

            {post.tags.length > 0 && (
              <p className="mt-3 flex flex-wrap gap-2">
                {post.tags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="rounded-card bg-gray-100 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </p>
            )}
          </li>
        </FadeInSection>
      ))}
    </ul>
  );
}
