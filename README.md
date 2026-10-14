# vitepress-readme-index

[![npm version](https://img.shields.io/npm/v/@binarynoir/vitepress-readme-index.svg)](https://www.npmjs.com/package/@binarynoir/vitepress-readme-index)
[![CI](https://github.com/binarynoir/vitepress-readme-index/actions/workflows/ci.yml/badge.svg)](https://github.com/binarynoir/vitepress-readme-index/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@binarynoir/vitepress-readme-index.svg)](LICENSE)

A [VitePress](https://vitepress.dev) plugin for sites moving from
[VuePress](https://vuepress.vuejs.org): it serves each folder's `README.md` as
its index page, as VuePress did, and keeps links to `README.md` working.

[![Support me on Buy Me a Coffee](https://img.shields.io/badge/Support%20me-Buy%20Me%20a%20Coffee-orange?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/binarynoir)
[![Support me on Ko-fi](https://img.shields.io/badge/Support%20me-Ko--fi-blue?style=for-the-badge&logo=ko-fi)](https://ko-fi.com/binarynoir)
[![More tools](https://img.shields.io/badge/Website-binarynoir.tech-8c8c8c?style=for-the-badge)](https://binarynoir.tech)

## What this does

VuePress uses `README.md` as a folder's index page. VitePress uses `index.md`.
Move a VuePress site to VitePress as it is, and every `docs/guide/README.md`
is served at `/guide/README`, every `/guide/` URL is a 404, and every link to
a `README.md` fails VitePress's dead-link check.

On a large site, fixing that by hand means renaming every `README.md` and
editing every link that points to one. This plugin lets you skip that step and
migrate with the content as it is:

```txt
docs/
  README.md        -> /
  guide/
    README.md      -> /guide/
    setup.md       -> /guide/setup
```

```md
[Guide](./guide/README.md)
```

That link goes to `/guide/`, as it did in VuePress.

- **No renames.** Pages keep their file names, so their history and any open branches stay easy to merge.
- **Links keep working.** A link to `README.md` points to the page it is now served as, so VitePress's dead-link check passes. Query strings and `#anchors` are kept.
- **Rename at your own pace.** Folders you have already moved to `index.md` work as normal. A folder with both keeps `index.md` as its index. Its `README.md` stays a page of its own, with a warning in the log.
- **Any case.** `README.md`, `Readme.md` and `readme.md` all count.

## Install

```sh
npm install --save-dev @binarynoir/vitepress-readme-index
```

## Usage

Wrap your config with `withReadmeIndex` and pass it the docs source directory:

```ts
// .vitepress/config.mts
import path from "node:path";
import { defineConfig } from "vitepress";
import { withReadmeIndex } from "@binarynoir/vitepress-readme-index/vitepress";

export default withReadmeIndex(
  defineConfig({
    // ...your config
  }),
  path.resolve(import.meta.dirname, ".."),
);
```

`withReadmeIndex` sets `rewrites` and adds the link plugin to
`markdown.config`. It keeps your existing `markdown.config`, so it composes
with other `withX()` wrappers in any order.

If you already have a `rewrites` function, it runs first, and any `README.md`
still left after it is renamed. `rewrites` written as an object cannot be
combined: `withReadmeIndex` leaves the config unchanged and logs a warning.
Wire the pieces by hand instead.

### Wiring it by hand

```ts
// .vitepress/config.mts
import path from "node:path";
import { defineConfig } from "vitepress";
import { readmeLinks, readmeRewrites } from "@binarynoir/vitepress-readme-index";

const docsRoot = path.resolve(import.meta.dirname, "..");

export default defineConfig({
  // Serves each README.md as its folder's index.md.
  rewrites: readmeRewrites(docsRoot),

  markdown: {
    config: (md) => {
      // Points links at README.md to the page it is served as.
      md.use(readmeLinks);
    },
  },
});
```

Use both pieces together. Without `readmeLinks`, a link to `README.md` points
at a page that no longer exists under that name. Without `readmeRewrites`, the
links point at `index.md` pages that do not exist.

To combine with your own rewrites, call the function from yours:

```ts
const toIndex = readmeRewrites(docsRoot);

export default defineConfig({
  rewrites: (id) => toIndex(id.replace(/^packages\/(.*)\/docs\//, "$1/")),
});
```

## Exports

| Export                            | From         | Description                                                          |
| --------------------------------- | ------------ | -------------------------------------------------------------------- |
| `withReadmeIndex(config, srcDir)` | `/vitepress` | Adds both pieces to a VitePress config.                              |
| `readmeRewrites(srcDir)`          | `.`          | A `rewrites` function: `guide/README.md` becomes `guide/index.md`.   |
| `readmeLinks`                     | `.`          | markdown-it plugin that rewrites links at `README.md` to `index.md`. |
| `rewriteReadmeHref(href)`         | `.`          | The link rewrite on its own, for use in other plugins.               |

`rewrites` as a function needs VitePress 1.4 or later.

## Sidebar and navbar

[`@binarynoir/vitepress-auto-sidebar`](https://github.com/binarynoir/vitepress-auto-sidebar)
and [`@binarynoir/vitepress-auto-navbar`](https://github.com/binarynoir/vitepress-auto-navbar)
already use a folder's `README.md` as its landing page when it has no
`index.md`, and link to the folder URL, so they work with this plugin as they
are.

## Releasing

Releases are tag-triggered. To ship a new version, from a clean `main` that's
in sync with `origin/main`:

```sh
npm run release:patch   # or release:minor / release:major
```

This runs typecheck/lint/test/build locally, then `npm version <bump>`
(bumps `package.json`, commits, and creates a matching `vX.Y.Z` tag) and
`git push --follow-tags`. Pushing that tag triggers
[`.github/workflows/release.yml`](.github/workflows/release.yml), which
re-runs the checks, publishes to npm (with
[provenance](https://docs.npmjs.com/generating-provenance-statements)), and
creates a GitHub release with auto-generated notes.

For a prerelease or an explicit version, use `npm run release -- <arg>`
(e.g. `npm run release -- 1.2.3` or `npm run release -- prerelease`) — see
[`npm version`](https://docs.npmjs.com/cli/v10/commands/npm-version) for the
full list of accepted values.

This requires an `NPM_TOKEN` repository secret (an npm
[automation token](https://docs.npmjs.com/creating-and-viewing-access-tokens)
with publish access) — set it under Settings → Secrets and variables →
Actions.

## License

[MIT](LICENSE)

---

## Feedback and support

Bug reports, feature requests and questions are all welcome. Please open them on this project's [GitHub issue tracker](https://github.com/binarynoir/vitepress-readme-index/issues):

- **Found a bug?** [Report it](https://github.com/binarynoir/vitepress-readme-index/issues/new?labels=bug&title=Bug%3A%20). Include your version and the steps to reproduce it.
- **Have an idea?** [Request a feature](https://github.com/binarynoir/vitepress-readme-index/issues/new?labels=enhancement&title=Feature%20request%3A%20). Tell us what you are trying to do.
- **Something else?** [Browse open issues](https://github.com/binarynoir/vitepress-readme-index/issues) to see if it has already been raised.

Pull requests are welcome too.

## More from BinaryNoir

<p align="center">
  <a href="https://binarynoir.tech">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://binarynoir.github.io/logo-wide-dark.svg">
      <img alt="BinaryNoir" src="https://binarynoir.github.io/logo-wide-light.svg" width="320">
    </picture>
  </a>
</p>

README Index is one of a family of open-source VitePress plugins, editor extensions and command-line tools from BinaryNoir. Browse them all, with documentation and live demos, at **[binarynoir.github.io](https://binarynoir.github.io)**.

**VitePress plugins**

- [Auto Sidebar](https://binarynoir.github.io/plugins/auto-sidebar): sidebar built from your folders
- [Auto Navbar](https://binarynoir.github.io/plugins/auto-navbar): navbar built from your folders
- [Markdown Tags](https://binarynoir.github.io/plugins/markdown-tags/): inline status badges
- [Reading Time Tag](https://binarynoir.github.io/plugins/reading-time-tag): reading-time estimates
- [Glossary Tooltips](https://binarynoir.github.io/plugins/glossary/): hover definitions from one glossary file
- [HTML Escape](https://binarynoir.github.io/plugins/html-escape/): stray tags and braces shown as text, not build errors
- [Downloads](https://binarynoir.github.io/plugins/downloads): files linked with a relative path, published as downloads
- [Exclude](https://github.com/binarynoir/vitepress-exclude): keep pages out of the build with a `.exclude` file

**Vite plugins**

- [Optimize Images](https://binarynoir.github.io/plugins/optimize-images): smaller images in the build output
- [Image Fallback](https://binarynoir.github.io/plugins/image-fallback): a placeholder instead of a failed build

**Editor extensions**

- [Tags for Markdown for VS Code](https://binarynoir.github.io/plugins/markdown-tags/vscode): status badges in the VS Code Markdown preview
- [Tags for Markdown for Obsidian](https://binarynoir.github.io/plugins/markdown-tags/obsidian): status badges in Obsidian

**Command-line tools**

- [NoirWatch](https://binarynoir.github.io/apps/noirwatch): get notified when a web page changes
- [NoirCon](https://binarynoir.github.io/apps/noircon): get notified when a site, server or port goes down
- [callrx](https://binarynoir.github.io/apps/callrx): amateur radio callsign lookup

Website: **[binarynoir.tech](https://binarynoir.tech)** · Docs and demos: **[binarynoir.github.io](https://binarynoir.github.io)**

## Author

John Smith III, [BinaryNoir](https://binarynoir.tech). Thanks to all contributors and users for their support and feedback.
