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
        <div className="space-y-8 md:space-y-10">
          <div className="max-w-4xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 font-roboto">
              Latest News
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {posts.map((post, idx) => {
            const slug = post.slug || String(post.id);
            const href = typeof slug === "string" ? `/news/${slug}` : "#";
            const excerpt =
              post.excerpt && post.excerpt.trim().length > 0
                ? stripHtml(post.excerpt)
                : truncate(stripHtml(post.content || ""), 160);
            const thumb = post.featured_image || fallbackImg;
            const categoryName = (post.categories || [])
              .map((c: any) => c.category_id?.name)
              .filter(Boolean)[0] || "News";

            return (
              <Link
                key={post.id ?? idx}
                href={href}
                className="group flex flex-col bg-white  "
              >
                <div className="relative w-full overflow-hidden aspect-[4/3]">
                  <Image
                    src={thumb}
                    alt={post.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                  <span className="absolute top-4 left-4 bg-[#722F37] text-white text-[0.65rem]! md:text-xs! font-semibold uppercase tracking-wider px-3 py-1.5">
                    {categoryName}
                  </span>
                </div>
                <div className="pt-5 space-y-2.5 px-2">
                  <h3 className="text-lg! md:text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm md:text-[0.9rem] text-gray-600 leading-relaxed line-clamp-3">
                    {excerpt}
                  </p>
                </div>
              </Link>
            );
          })}
          </div>
        </div>
    </section>
  );
}
