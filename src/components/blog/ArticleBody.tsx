import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SmartLink from "@/components/site/SmartLink";

/**
 * Corps d'un article (Markdown : intertitres, listes, tableaux, liens). Les liens internes
 * passent par le routeur ; les liens externes s'ouvrent dans un nouvel onglet.
 */
export default function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-neutral max-w-none prose-headings:font-ks-display prose-headings:tracking-[-0.02em] prose-h2:mt-12 prose-h2:text-[28px] prose-h3:text-[21px] prose-p:leading-[1.7] prose-a:text-ks-pink prose-a:no-underline hover:prose-a:underline prose-strong:text-ks-ink prose-table:text-[15px] prose-th:bg-ks-secondary prose-th:px-3 prose-td:px-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <SmartLink href={href}>{children}</SmartLink>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
            ),
          // Le titre de l'article est le seul H1 de la page
          h1: ({ children }) => <h2>{children}</h2>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
