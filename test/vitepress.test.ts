import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserConfig } from "vitepress";
import { withReadmeIndex } from "../src/vitepress.js";

describe("withReadmeIndex", () => {
  let root: string;

  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "vpri-config-")));
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("adds rewrites and the markdown plugin to an empty config", () => {
    const config = withReadmeIndex({}, root);
    const rewrites = config.rewrites as (id: string) => string;
    expect(rewrites("guide/README.md")).toBe("guide/index.md");

    const md = new MarkdownIt();
    config.markdown!.config!(md as never);
    expect(md.render("[a](./README.md)")).toContain('href="./index.md"');
  });

  it("keeps an existing markdown.config", () => {
    const existing = vi.fn();
    const config = withReadmeIndex({ markdown: { config: existing } }, root);
    const md = new MarkdownIt();
    config.markdown!.config!(md as never);
    expect(existing).toHaveBeenCalledWith(md);
  });

  it("runs an existing rewrites function first", () => {
    const config = withReadmeIndex(
      { rewrites: (id: string) => id.replace(/^packages\/(.*)\/docs\//, "$1/") },
      root,
    );
    const rewrites = config.rewrites as (id: string) => string;
    expect(rewrites("packages/a/docs/README.md")).toBe("a/index.md");
    expect(rewrites("packages/a/docs/page.md")).toBe("a/page.md");
    expect(rewrites("README.md")).toBe("index.md");
  });

  it("leaves object rewrites alone, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = withReadmeIndex({ rewrites: { "a.md": "b.md" } } as UserConfig, root);
    expect(config.rewrites).toEqual({ "a.md": "b.md" });
    expect(config.markdown).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
