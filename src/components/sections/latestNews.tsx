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
    <section className="container mx-auto px-4 py-12 md:py-16 bg-white">
        <div className="space-y-5 md:space-y-6">
          <div className="max-w-4xl space-y-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 font-roboto">
              Latest News
            </h2>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-3xl font-roboto">
              We hope to remain as a key contributor in the development of
              Maldives in bringing positive change in the future.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
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
                className="widget-card group border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col"
              >
                <div className="relative w-full overflow-hidden h-[6.6rem] md:h-[7.7rem]">
                  <Image
                    src={thumb}
                    alt={post.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="p-3 space-y-1.5 flex-shrink-0">
                  <h6 className="widget-meta uppercase tracking-widest text-primary">
                    {date}
                  </h6>
                  <Link href={href} className="block">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                  {/* <p className="text-gray-700 line-clamp-2">
                    {excerpt}
                  </p> */}
                </div>
                <div className="px-3 pb-3 flex-shrink-0">
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
