import path from "node:path";
import type { MarkdownIt } from "markdown-it";
import type { UserConfig } from "vitepress";
import { readmeLinks } from "./markdown.js";
import { README_FILE, readmeRewrites } from "./rewrites.js";

/**
 * Wraps a VitePress config so every `README.md` is served as its folder's
 * index page, and links to it keep working.
 *
 * ```ts
 * // .vitepress/config.mts
 * import path from "node:path";
 * import { defineConfig } from "vitepress";
 * import { withReadmeIndex } from "@binarynoir/vitepress-readme-index/vitepress";
 *
 * export default withReadmeIndex(
 *   defineConfig({ /* ...your config... *\/ }),
 *   path.resolve(import.meta.dirname, ".."),
 * );
 * ```
 *
 * An existing `rewrites` function runs first, and a `README.md` it leaves in
 * place is then renamed. Object-form `rewrites` cannot be combined: the
 * config is returned unchanged, with a warning.
 */
export function withReadmeIndex(config: UserConfig, srcDir: string): UserConfig {
  const existingRewrites = config.rewrites;
  if (existingRewrites && typeof existingRewrites !== "function") {
    console.warn(
      "[vitepress-readme-index] `rewrites` is an object, so README.md pages were not rewritten. " +
        "Use a rewrites function and call readmeRewrites() from it instead.",
    );
    return config;
  }

  const toIndex = readmeRewrites(srcDir);
  config.rewrites = existingRewrites
    ? (id) => {
        const dest = existingRewrites(id);
        // Rename only what is still a README after the user's rewrite.
        if (!README_FILE.test(path.posix.basename(dest))) return dest;
        const renamed = toIndex(id);
        return renamed === id ? dest : `${path.posix.dirname(dest)}/index.md`.replace(/^\.\//, "");
      }
    : toIndex;

  config.markdown ??= {};
  const existingMarkdownConfig = config.markdown.config ?? (() => {});
  config.markdown.config = (md) => {
    // VitePress 2 types this callback against `markdown-it-async`'s MarkdownIt,
    // a structural superset of plain markdown-it's; the cast bridges the two.
    readmeLinks(md as unknown as MarkdownIt);
    existingMarkdownConfig(md);
  };

  return config;
}
