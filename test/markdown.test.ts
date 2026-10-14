import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readmeLinks, rewriteReadmeHref } from "../src/index.js";

describe("rewriteReadmeHref", () => {
  it("rewrites a README.md segment, keeping queries and anchors", () => {
    expect(rewriteReadmeHref("./guide/README.md")).toBe("./guide/index.md");
    expect(rewriteReadmeHref("README.md#setup")).toBe("index.md#setup");
    expect(rewriteReadmeHref("../readme.md?x=1")).toBe("../index.md?x=1");
    expect(rewriteReadmeHref("/guide/README.md")).toBe("/guide/index.md");
  });

  it("leaves external links and other names alone", () => {
    expect(rewriteReadmeHref("https://github.com/a/b/README.md")).toBe(
      "https://github.com/a/b/README.md",
    );
    expect(rewriteReadmeHref("//cdn.example.com/README.md")).toBe("//cdn.example.com/README.md");
    expect(rewriteReadmeHref("./NOT-README.md")).toBe("./NOT-README.md");
    expect(rewriteReadmeHref("./README.md.bak")).toBe("./README.md.bak");
  });
});

describe("readmeLinks", () => {
  let root: string;

  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "vpri-md-")));
    fs.mkdirSync(path.join(root, "guide"));
    fs.mkdirSync(path.join(root, "both"));
    fs.writeFileSync(path.join(root, "both/index.md"), "# index");
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  /** Renders as VitePress would for `docs/<relativePath>`. */
  function render(src: string, relativePath = "page.md") {
    const md = new MarkdownIt();
    md.use(readmeLinks);
    return md.render(src, { path: path.join(root, relativePath), relativePath });
  }

  it("rewrites relative and root-relative links", () => {
    expect(render("[a](./guide/README.md)")).toContain('href="./guide/index.md"');
    expect(render("[b](../README.md#top)", "guide/page.md")).toContain('href="../index.md#top"');
    expect(render("[c](/guide/README.md)", "guide/page.md")).toContain('href="/guide/index.md"');
  });

  it("leaves a link alone when the target folder has its own index.md", () => {
    expect(render("[a](./both/README.md)")).toContain('href="./both/README.md"');
    expect(render("[b](/both/README.md)", "guide/page.md")).toContain('href="/both/README.md"');
  });

  it("works without a VitePress env", () => {
    const md = new MarkdownIt();
    md.use(readmeLinks);
    expect(md.render("[a](./both/README.md)")).toContain('href="./both/index.md"');
  });
});
