import Image from "next/image";

type PageHeroProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  imageUrl: string;
  heightClass?: string;
  bgColor?: string;
};

const contentShell = "w-full mx-auto px-[var(--gutter-phi-1)] md:mb-10";

export default function PageHero({
  title,
  eyebrow,
  description,
  imageUrl,
  heightClass = "min-h-[60vh] md:min-h-[80vh]",
  bgColor = "bg-black",
}: PageHeroProps) {
  return (
    <section
      className={`relative isolate w-screen max-w-none left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden ${heightClass} ${bgColor}`}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        priority
        className="object-cover"
        sizes="100vw"
        unoptimized={imageUrl.endsWith(".gif")}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

      <div className="absolute inset-0 flex items-end">
        <div className={`${contentShell} pb-10 space-y-3`}>
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white max-w-4xl leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-lg text-white/80 md:max-w-6xl lg:max-w-7xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
