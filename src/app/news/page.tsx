import Link from "next/link";
import Image from "next/image";
import { getNewsCategories, getNewsPosts } from "@/lib/directus";
import FiltersBarNews from "@/components/news/FiltersBarNews";
import Reveal from "@/components/Reveal";
import ScrollToTopButton from "@/components/ScrollToTopButton";

const fallbackImg =
  "/wp-content/uploads/about_gallery/1_Collaboration-Space.jpg";

const contentShell = "w-full mx-auto px-[6%] md:px-[138px]";
const cardHeights = [
  "h-52 md:h-60",
  "h-96 md:h-[32rem]",
  "h-72 md:h-[24rem]",
  "h-56 md:h-64",
  "h-80 md:h-[26rem]",
  "h-52 md:h-60",
  "h-[18rem] md:h-[28rem]",
  "h-60 md:h-[20rem]",
];

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type SearchParams =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedParams =
    searchParams && typeof (searchParams as Promise<any>).then === "function"
      ? await (searchParams as Promise<
          Record<string, string | string[] | undefined>
        >)
      : ((searchParams || {}) as Record<string, string | string[] | undefined>);

  const category =
    typeof resolvedParams?.category === "string" ? resolvedParams.category : "";
  const search = typeof resolvedParams?.q === "string" ? resolvedParams.q : "";
  const perPage =
    typeof resolvedParams?.perPage === "string"
      ? Number(resolvedParams.perPage)
      : 12;
  const limit = [12, 24, 36, 48].includes(perPage) ? perPage : 12;

  const [categories, articles] = await Promise.all([
    getNewsCategories(),
    getNewsPosts({
      categorySlug: category || undefined,
      search: search || undefined,
      limit,
    }),
  ]);

  if (process.env.NODE_ENV !== "production") {
    console.log("[NewsPage] filters", { category, search, limit });
    console.log(
      "[NewsPage] articles sample",
      articles.slice(0, 3).map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        categories: a.categories,
      })),
      "total",
      articles.length
    );
    console.log("[NewsPage] categories", categories);
  }

  return (
    <main className="min-h-screen bg-white">
      <div className={`${contentShell} py-16 space-y-10 mt-17`}>
        <Reveal>
          <div className="flex flex-col gap-1">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900">
                News &amp; Announcements
              </h1>
              <p className="text-gray-700 mt-2 max-w-2xl">
                Browse articles, announcements, and press from our multidisciplinary teams.
              </p>
            </div>

            <FiltersBarNews
              categories={categories}
              selectedCategory={category}
              search={search}
              perPage={limit}
            />
          </div>
        </Reveal>

        <div className="columns-1 md:columns-2 xl:columns-3  gap-x-6">
          {articles.map((article, index) => {
            const href = article.slug ? `/news/${article.slug}` : "#";
            const categoriesText = (article.categories || [])
              .map(c => c.category_id?.name)
              .filter(Boolean)
              .join(", ");
            const excerpt =
              article.excerpt && article.excerpt.trim().length > 0
                ? stripHtml(article.excerpt)
                : stripHtml(article.content || "").slice(0, 140);
            const img = article.featured_image || fallbackImg;
            const cardHeight = cardHeights[index % cardHeights.length];

            return (
              <Reveal
                key={article.id}
                delay={index * 0.04}
                duration={0.65}
                offsetY={18}
                className="mb-4 break-inside-avoid "
              >
                <Link
                  href={href}
                  className={`group relative block overflow-hidden mb-6 ${cardHeight} bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300`}
                >
                  <Image
                    src={img}
                    alt={article.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end gap-2 p-5 !text-[98%]">
                    <p className="!text-[0.7rem] uppercase tracking-widest text-white/80 font-semibold">
                      {categoriesText || "News"}
                    </p>
                    <h3 className="news-card-title line-clamp-2 min-h-[2.6rem] font-semibold text-white drop-shadow-sm">
                      {article.title}
                    </h3>
                    {/* <p className="hidden sm:block min-h-[2.6rem] text-sm text-white/80 leading-relaxed md:line-clamp-3">
                      {excerpt}
                    </p> */}
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
      <ScrollToTopButton />
    </main>
  );
}
