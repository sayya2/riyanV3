import Image from "next/image";
import Link from "next/link";
import { getNewsPosts } from "@/lib/directus";

const fallbackImg =
  "/wp-content/uploads/about_gallery/1_Collaboration-Space.jpg";

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "…";
}

export default async function LatestNewsSection() {
  const posts = await getNewsPosts({ limit: 4 });

  return (
    <section className="pb-24 bg-white">
      <div className="container mx-auto px-4 space-y-10">
        <div className="max-w-4xl space-y-3">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900">
            Latest News
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            We hope to remain as a key contributor in the development of
            Maldives in bringing positive change in the future.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {posts.map((post, idx) => {
            const slug = post.slug || String(post.id);
            const href = typeof slug === "string" ? `/news/${slug}` : "#";
            const excerpt =
              post.excerpt && post.excerpt.trim().length > 0
                ? stripHtml(post.excerpt)
                : truncate(stripHtml(post.content || ""), 140);
            const date = new Date(
              post.published_at || post.created_at
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const thumb = post.featured_image || fallbackImg;

            return (
              <article
                key={post.id ?? idx}
                className="group border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col"
              >
                <div className="relative w-full overflow-hidden min-h-40 md:min-h-48 flex-1">
                  <Image
                    src={thumb}
                    alt={post.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="p-6 space-y-3 flex-shrink-0">
                  <p className="text-xs uppercase tracking-widest text-primary font-semibold">
                    {date}
                  </p>
                  <Link href={href} className="block">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                    {excerpt}
                  </p>
                </div>
                <div className="px-6 pb-6 flex-shrink-0">
                  <Link
                    href={href}
                    className="inline-flex items-center text-primary font-semibold hover:text-primary/80 transition-colors"
                  >
                    Read More
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
