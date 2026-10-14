import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readmeRewrites } from "../src/index.js";

describe("readmeRewrites", () => {
  let root: string;

  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "vpri-")));
    for (const file of [
      "README.md",
      "guide/README.md",
      "guide/page.md",
      "both/README.md",
      "both/index.md",
    ]) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), "# page");
    }
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("serves README.md as the folder index, in any case", () => {
    const rewrite = readmeRewrites(root);
    expect(rewrite("README.md")).toBe("index.md");
    expect(rewrite("guide/README.md")).toBe("guide/index.md");
    expect(rewrite("guide/readme.md")).toBe("guide/index.md");
  });

  it("leaves other pages alone", () => {
    const rewrite = readmeRewrites(root);
    expect(rewrite("guide/page.md")).toBe("guide/page.md");
    expect(rewrite("guide/README-old.md")).toBe("guide/README-old.md");
  });

  it("keeps an existing index.md as the index, and warns once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rewrite = readmeRewrites(root);
    expect(rewrite("both/README.md")).toBe("both/README.md");
    expect(rewrite("both/README.md")).toBe("both/README.md");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("both/index.md exists");
    warn.mockRestore();
  });
});
