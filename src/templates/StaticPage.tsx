import { ContentTOC } from "@/components/Editor/ContentTOC";
import { useContentRenderer } from "@/components/Editor/hooks/useContentRenderer";

interface StaticPageProps {
  title: string; content: string; featuredImage?: string; category?: string;
  commentsCount?: number; rating?: number; customCss?: string; postId?: string;
  metaTitle?: string; metaDescription?: string; metaKeywords?: string;
  canonicalUrl?: string; metaRobots?: string; ogTitle?: string; ogDescription?: string;
  ogImage?: string; twitterTitle?: string; twitterDescription?: string;
  twitterImage?: string; contentType?: string;
}

export default function StaticPage({
  title, content, featuredImage, customCss = "", postId = "",
}: StaticPageProps) {
  const { processedContent, scopedId } = useContentRenderer(content ?? "", {
    processLineBreaks: true,
    customCss,
    postId,
  });

  return (
    <main className="mx-auto w-full max-w-3xl bg-white px-4 py-10 font-sans text-gray-900">
      <h1 className="mb-6 text-center text-3xl font-bold md:text-4xl">{title}</h1>
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
