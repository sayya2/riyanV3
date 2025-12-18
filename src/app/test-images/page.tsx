import Image from "next/image";
import pool from "@/lib/db-new";

export const dynamic = "force-dynamic";

interface ImageData {
  ID: number;
  guid: string;
  post_title: string;
  post_name: string;
}

async function getRandomImages(): Promise<ImageData[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT
      ID,
      guid,
      post_title,
      post_name
    FROM wp_posts
    WHERE post_type = 'attachment'
      AND post_mime_type LIKE 'image/%'
      AND guid IS NOT NULL
      AND guid != ''
    ORDER BY RAND()
    LIMIT 20`
  );

  return rows.map((row) => ({
    ID: Number(row.ID),
    guid: row.guid,
    post_title: row.post_title || "Untitled Image",
    post_name: row.post_name || "",
  }));
}

export default async function TestImagesPage() {
  const images = await getRandomImages();

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Database Image Test
          </h1>
          <p className="text-gray-600">
            Displaying 20 random images from the database
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Total images loaded: {images.length}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.ID}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative h-64 bg-gray-200">
                <Image
                  src={image.guid}
                  alt={image.post_title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                  {image.post_title}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  ID: {image.ID}
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {image.post_name || "No slug"}
                </p>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-600 break-all line-clamp-2">
                    {image.guid}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No images found in the database
            </p>
          </div>
        )}

        <div className="mt-12 text-center">
          <a
            href="/test-images"
            className="inline-block px-6 py-3 bg-[#781213] text-white font-semibold rounded-lg hover:bg-[#5f0e0f] transition-colors"
          >
            Load New Random Images
          </a>
        </div>
      </div>
    </main>
  );
}
