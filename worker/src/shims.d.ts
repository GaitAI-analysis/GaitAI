/**
 * `src/lib/ask/corpus.ts` reads `process.env.NEXT_PUBLIC_ASK_CORPUS_VERSION`
 * behind a `typeof process !== "undefined"` guard so Next can inline it in the
 * browser. Workers have no `process`; this declaration only lets the shared
 * module typecheck here. At runtime the guard makes the branch dead code.
 */
declare const process: { env: Record<string, string | undefined> } | undefined;
