import fs from "node:fs";
import path from "node:path";

/** A `README.md` file name, any case. */
export const README_FILE = /^readme\.md$/i;

/**
 * Whether a `README.md` in `dir` should be served as the folder's index:
 * true unless the folder also has an `index.md`, which keeps that role.
 */
export function readmeIsIndex(dir: string): boolean {
  return !fs.existsSync(path.join(dir, "index.md"));
}

const warned = new Set<string>();

/**
 * A VitePress `rewrites` function that serves every `README.md` as its
 * folder's `index.md`, so `guide/README.md` is the `/guide/` page.
 *
 * A folder that has both keeps its `index.md` as the index, and its
 * `README.md` stays a page of its own, with a warning.
 */
export function readmeRewrites(srcDir: string): (id: string) => string {
  const root = path.resolve(srcDir);
  return (id) => {
    const name = path.posix.basename(id);
    if (!README_FILE.test(name)) return id;

    const dir = path.posix.dirname(id);
    if (!readmeIsIndex(path.join(root, dir))) {
      if (!warned.has(id)) {
        warned.add(id);
        console.warn(
          `[vitepress-readme-index] ${id} is not the folder index: ${dir === "." ? "" : `${dir}/`}index.md exists`,
        );
      }
      return id;
    }
    return dir === "." ? "index.md" : `${dir}/index.md`;
  };
}
