import Link from "next/link";

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
}

export function PostList({ posts }: { posts: PostListItem[] }) {
  if (posts.length === 0) {
    return <p className="text-gray-400">記事が見つかりませんでした</p>;
  }

  return (
    <ul className="mt-8 space-y-8">
      {posts.map((post) => (
        <li key={post.id}>
          <p className="text-xs text-gray-400">
            {post.publishedAt?.toLocaleDateString("ja-JP")}
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="ml-2 text-accent hover:underline"
              >
                {post.category.name}
              </Link>
            )}
          </p>
          <Link href={`/blog/${post.slug}`} className="group block">
            <h2 className="mt-1 text-lg font-semibold text-gray-900 group-hover:text-accent dark:text-gray-100">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{post.excerpt}</p>
            )}
          </Link>
          {post.tags.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-2">
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
      ))}
    </ul>
  );
}
