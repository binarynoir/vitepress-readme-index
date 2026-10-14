import path from "node:path";
import type { MarkdownIt } from "markdown-it";
import { readmeIsIndex } from "./rewrites.js";

const EXTERNAL = /^([a-z][a-z\d+.-]*:|\/\/)/i;
// A whole `README.md` path segment, followed by an optional ?query or #anchor.
const README_SEGMENT = /(^|\/)README\.md(?=[?#]|$)/i;

/** What VitePress puts in the markdown-it env for each page. */
interface PageEnv {
  /** Absolute path the page is served as, after rewrites. */
  path?: string;
  /** `path`, relative to the source directory. */
  relativePath?: string;
}

/**
 * Points a link at `README.md` to the `index.md` it is served as. Query
 * strings and #anchors are kept. External links are untouched.
 *
 * Pass `targetDir`, the folder the link points into, to leave the link alone
 * when that folder has its own `index.md` (its `README.md` is then a page of
 * its own).
 */
export function rewriteReadmeHref(href: string, targetDir?: string): string {
  if (EXTERNAL.test(href) || !README_SEGMENT.test(href)) return href;
  if (targetDir !== undefined && !readmeIsIndex(targetDir)) return href;
  return href.replace(README_SEGMENT, "$1index.md");
}

/** The folder a page-relative or root-relative link points into, if it can be worked out. */
function linkTargetDir(href: string, env: PageEnv): string | undefined {
  if (!env.path) return undefined;
  const linkPath = decodeURIComponent(href.split(/[?#]/)[0] ?? "");
  if (linkPath.startsWith("/")) {
    if (env.relativePath === undefined) return undefined;
    const srcDir = env.path.slice(0, env.path.length - env.relativePath.length);
    return path.dirname(path.join(srcDir, linkPath));
  }
  return path.dirname(path.resolve(path.dirname(env.path), linkPath));
}

/**
 * markdown-it plugin: rewrites relative links at `README.md` to `index.md`.
 *
 * VitePress resolves relative links against the rewritten page paths, so with
 * `readmeRewrites` in place `[Guide](./guide/README.md)` would point at a page
 * that no longer exists under that name and fail the dead-link check. This
 * runs before VitePress's own link handling, so the link resolves exactly as
 * `./guide/index.md` would.
 */
export function readmeLinks(md: MarkdownIt): void {
  md.core.ruler.push("vitepress_readme_index_links", (state) => {
    const env = (state.env ?? {}) as PageEnv;
    for (const block of state.tokens) {
      if (block.type !== "inline" || !block.children) continue;
      for (const token of block.children) {
        if (token.type !== "link_open") continue;
        const href = token.attrGet("href");
        if (typeof href !== "string" || EXTERNAL.test(href) || !README_SEGMENT.test(href)) continue;

        let targetDir: string | undefined;
        try {
          targetDir = linkTargetDir(href, env);
        } catch {
          // A malformed %-escape: rewrite it without the index.md check.
        }
        token.attrSet("href", rewriteReadmeHref(href, targetDir));
      }
    }
  });
}
