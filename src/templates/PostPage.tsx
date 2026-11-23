import { ContentTOC } from "@/components/Editor/ContentTOC";
import { useContentRenderer } from "@/components/Editor/hooks/useContentRenderer";

interface PostPageProps {
  title?: string; content?: string; date?: string; author?: string; category?: string;
  commentsCount?: number; rating?: number; featuredImage?: string; customCss?: string;
  postId?: string; wordCount?: number; metaTitle?: string; metaDescription?: string;
  metaKeywords?: string; canonicalUrl?: string; metaRobots?: string; ogTitle?: string;
  ogDescription?: string; ogImage?: string; twitterTitle?: string;
  twitterDescription?: string; twitterImage?: string; contentType?: string;
}

export default function PostPage({
  title, content, date, author, category, featuredImage, customCss = "", postId = "", wordCount,
}: PostPageProps) {
  const { processedContent, scopedId } = useContentRenderer(content ?? "", {
    processLineBreaks: true,
    customCss,
    postId,
  });
  const text = (content ?? "").replace(/<[^>]+>/g, " ");
  const words = wordCount || text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));

  return (
    <main className="mx-auto w-full max-w-3xl bg-white px-4 py-10 font-sans text-gray-900">
      <header className="mb-8 text-center">
        {category && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
            {category}
          </p>
        )}
        <h1 className="mb-3 text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="text-sm text-gray-500">
          {[date, author, `${minutes} min de lectura`].filter(Boolean).join(" · ")}
        </p>
      </header>
      {featuredImage && (
        <img
          src={featuredImage}
          alt={title}
          className="mb-8 w-full rounded-lg object-cover"
          style={{ maxHeight: 480 }}
        />
      )}
      <div className="mb-8">
        <ContentTOC content={processedContent} />
      </div>
      <article id={scopedId} className="ProseMirror prose prose-lg max-w-none">
        <section
          className="ProseMirror editor-rendered-content"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      </article>
    </main>
  );
}
