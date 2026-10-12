import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import GithubSlugger from "github-slugger";
import { CodeBlock } from "./CodeBlock";
import { StaticDiagram } from "./StaticDiagram";
import styles from "./wiki.module.css";

function plainText(children: ReactNode): string {
  return Children.toArray(children).map((child) => typeof child === "string" || typeof child === "number" ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? plainText(child.props.children) : "").join("");
}

export function WikiMarkdown({ markdown }: { markdown: string }) {
  const slugger = new GithubSlugger();
  const heading = (level: "h2" | "h3", children: ReactNode) => {
    const title = plainText(children);
    const id = slugger.slug(title);
    const Tag = level;
    return <Tag id={id}><a href={`#${id}`} className={styles.headingAnchor}>{children}<span aria-hidden="true">#</span></a></Tag>;
  };
  return <div className={styles.prose}><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, { ignoreMissing: true, plainText: ["diagram", "text"] }]]} skipHtml components={{
    h2: ({ children }) => heading("h2", children),
    h3: ({ children }) => heading("h3", children),
    pre: ({ children }) => <>{children}</>,
    code: ({ children, className }) => {
      const language = /language-(\S+)/.exec(className ?? "")?.[1];
      if (language === "diagram") return <StaticDiagram name={plainText(children).trim()} />;
      if (language) return <CodeBlock language={language}>{children}</CodeBlock>;
      return <code>{children}</code>;
    },
    table: ({ children }) => <div className={styles.tableScroll} role="region" tabIndex={0} aria-label="Documentation table, scroll horizontally if needed"><table>{children}</table></div>,
    a: ({ children, href }) => <a href={href} rel={href?.startsWith("https:") ? "noreferrer" : undefined}>{children}</a>,
  }}>{markdown}</ReactMarkdown></div>;
}
