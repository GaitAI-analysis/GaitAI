"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "./wiki.module.css";

export function CodeBlock({ children, language }: { children: ReactNode; language: string }) {
  const code = useRef<HTMLElement>(null);
  const [state, setState] = useState("Copy");
  return <div className={styles.codeBlock}>
    <div className={styles.codeToolbar}><span>{language}</span><button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(code.current?.textContent ?? ""); setState("Copied"); }
      catch { setState("Select code to copy"); const selection = window.getSelection(); const range = document.createRange(); if (code.current) { range.selectNodeContents(code.current); selection?.removeAllRanges(); selection?.addRange(range); } }
    }} aria-label={`Copy ${language} code`}><span role="status">{state}</span></button></div>
    <pre tabIndex={0} aria-label={`${language} code`}><code ref={code} className={`language-${language}`}>{children}</code></pre>
  </div>;
}
