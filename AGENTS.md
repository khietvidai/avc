This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
npx emdash dev        # Start dev server (runs migrations, seeds, generates types)
npx emdash types      # Regenerate TypeScript types from schema
```

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, database, and storage                    |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                           |
| `seed/seed.json`         | Schema definition + demo content (collections, fields, taxonomies, menus, widgets) |
| `emdash-env.d.ts`        | Generated types for collections (auto-regenerated on dev server start)             |
| `src/layouts/Base.astro` | Base layout with EmDash wiring (menus, search, page contributions)                 |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |

## Skills

Agent skills are in `.agents/skills/`. Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines). Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content management, seeding, type generation, and visual editing flow.

## Documentation

The EmDash docs are available as an MCP server at `https://docs.emdashcms.com/mcp`. When you need to verify an API, hook, config option, field type, or pattern, call `search_docs` against the live documentation rather than relying on training-data recall. The docs reflect current behaviour; assumptions may not.

This template ships with `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json` so Claude Code, Cursor, and VS Code auto-discover the docs server. Other tools (OpenCode, Windsurf, etc.) need a manual one-time setup -- see [docs.emdashcms.com/docs-mcp](https://docs.emdashcms.com/docs-mcp).

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- Always call `Astro.cache.set(cacheHint)` on pages that query content.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).

## This Template

Corporate one-page site for **Công ty TNHH Thiết Bị Công Nghiệp AVC** (industrial kitchen equipment, Vietnamese) built from the claude.ai/design project `AVC Website v2.dc.html`. The homepage is a single scrolling page (hero → stats → giới thiệu → lĩnh vực grid → footer/liên hệ) with anchor navigation; the `posts` collection is repurposed as **"Dự án"** (completed projects) with list/detail pages, search, and RSS.

## Pages

| Page         | Path               | What it shows                                                                                         |
| ------------ | ------------------ | ----------------------------------------------------------------------------------------------------- |
| Home         | `/`                | One-pager: hero image, stats strip, `#gioi-thieu` intro, `#linh-vuc` 6-card grid (cards link to `/category/<slug>`) |
| Giới thiệu   | `/gioi-thieu`      | Company story, sứ mệnh/tầm nhìn, giá trị + yếu tố cốt lõi, dấu ấn 3 miền, đội ngũ, khách hàng tiêu biểu (static Astro page, content from PROFILE_AVC) |
| Dịch vụ      | `/dich-vu`         | 6 dịch vụ (tư vấn → bảo trì), thiết kế 2D/3D & MEP, biện pháp thi công với ảnh thật (static Astro page) |
| Sản phẩm     | `/san-pham`        | 8 nhóm sản phẩm, 21 thương hiệu phân phối, chính sách chất lượng ISO, nhà máy + kho hàng (static Astro page) |
| Liên hệ      | `/lien-he`         | Showroom/kho/hotline/email + quy trình làm việc 4 bước (static Astro page)                            |
| Dự án        | `/posts`           | 21 dự án thật từ company profile (Crust, Pizza 4P's, K-Mazing, Belgo, Bartels...) with real photos    |
| Dự án detail | `/posts/[slug]`    | Featured image, title, body (chủ đầu tư + địa chỉ), left meta column, right sidebar                   |
| Search       | `/search`          | Full-text search UI                                                                                   |
| Page         | `/pages/[slug]`    | Static page content (Portable Text)                                                                   |
| Category     | `/category/[slug]` | Projects filtered by danh mục (slugs match `linh_vuc` entry slugs)                                    |
| Tag          | `/tag/[slug]`      | Projects filtered by thẻ                                                                              |
| RSS          | `/rss.xml`         | Generated feed                                                                                        |

Primary menu: Trang chủ `/` · Giới thiệu `/gioi-thieu` · Dịch vụ `/dich-vu` · Sản phẩm `/san-pham` · Portfolio `/portfolio` · Liên hệ `/lien-he`. "Giới thiệu", "Dịch vụ" and "Portfolio" have dropdown submenus (children in `_emdash_menu_items`, rendered by Base.astro's `.nav-dropdown`).

Portfolio flow (modeled on ricca design studios): `/portfolio` (checkerboard olive/gray grid of 6 lĩnh vực) → `/category/[slug]` (full-width auto-playing slider of featured projects + 3-col hover-overlay gallery) → `/posts/[slug]` (project detail: horizontal gallery with clickable thumbnails, title + olive subtitle, 2-col info block — năm hoàn thành/quy mô | chủ đầu tư/địa chỉ). `/posts` list page still exists but is not in the menu. `/dich-vu` is section-per-service: wide photo banner (`public/images/banner-*.jpg`) + description + 2-col bullet list, anchors `#tu-van #thiet-ke #cung-cap #thi-cong #bao-hanh #san-xuat`.

`posts` collection extra fields (added via SQL, also in production): `chu_dau_tu`, `dia_chi`, `nam_hoan_thanh` (empty — awaiting real data), `quy_mo` (defaults "Bảo mật"), `gallery` (json array of media objects, 3-4 real photos per project extracted from PROFILE_AVC.pdf).

**Images**: all real photos extracted from `PROFILE_AVC.pdf` (per-page via PyMuPDF, auto-cropped black borders, JPEG-compressed). CMS media (hero, 6 lĩnh vực, 21 project featured images, site logo) live in the media library/R2; static-page images live in `public/images/` (team, thi công, nhà máy, kho, logo…). The site logo is set in settings (`site:logo`) — note settings are cached per worker isolate, restart dev after changing them via SQL.

## Schema

- `posts` collection (label "Dự án"): `title`, `featured_image`, `content` (Portable Text), `excerpt` (text).
- `pages` collection ("Trang tĩnh"): `title`, `content`.
- `home` collection ("Trang chủ", single entry with slug `home`): `hero_image`, `stat_1..stat_4`, `intro_heading`, `intro` (Portable Text -- **bold spans render in the brand colour** on the site), `cta_label`, `cta_url`, `services_heading`, `services_intro`.
- `linh_vuc` collection ("Lĩnh vực", 6 entries): `title`, `image`, `sort_order`.
- Taxonomies: `category` (6 sector terms), `tag`.
- Menus: `primary` (Trang chủ `/`, Giới thiệu `/#gioi-thieu`, Dịch vụ `/#linh-vuc`, Dự án `/posts`, Liên hệ `/#lien-he`), `social` (LinkedIn → footer icon square).
- Widget areas: `footer` (content widget with showroom/warehouse address -- editable), `sidebar` (project detail pages).

Site settings have `title` and `tagline`; the header shows the settings `logo` when uploaded (150×52), else the title as styled text.

**Seeding gotcha:** the runtime auto-seed on first boot applies schema/menus/settings only. To load the demo content into a fresh local DB, run `npx emdash seed seed/seed.json -d .wrangler/state/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`, then copy `uploads/*.jpg` into local R2 with `npx wrangler r2 object put "avc-md/<file>" --file uploads/<file> --content-type image/jpeg --local`.

## Visual character

Single typeface: **Roboto** on `--font-body` (400/500/700), used for everything including headings. **JetBrains Mono** on `--font-mono` for code. Uppercase bold nav links with 1px vertical separators; heading hierarchy carried by weight and the brand colour.

The brand colour is the olive `#BBC647` (`--color-brand`, hover `#a9b43c`) -- used for section headings, nav active/hover state, highlighted intro spans (`strong` inside `.intro`), the CTA button, and the lĩnh vực card label bars. Body text is `#595959`, nav/secondary `#7F7470` (`--avc-nav-text`), dashed dividers `#cfcfcf` (`--avc-divider`). Corners are square (`--radius: 0`). Light mode is pinned (`color-scheme: light` in `theme.css`). Don't add a second accent.

Signature elements from the design: the 440px full-width hero with decorative ‹ › arrows, the bold stats strip ("15+ Năm Kinh Nghiệm | ..."), the 210px dashed divider under each section heading, and the 3-column lĩnh vực grid with olive label bars.

## Customisation

Design tokens live in `src/styles/tokens.css` with their default values. To restyle the site, override tokens in `src/styles/theme.css` -- declarations there are unlayered, so they always beat the `@layer base` defaults. Don't edit `tokens.css` or `Base.astro` for visual changes.

Colours are defined with `light-dark(<light>, <dark>)`, so each token carries both modes. Overriding with a plain colour changes light and dark at once; use `light-dark()` in the override to keep them distinct. There is no separate dark palette to maintain.

Webfonts are configured in `astro.config.mjs` under `fonts:`. To swap the body face, change the `name:` for the entry bound to `cssVariable: "--font-body"`. Good alternatives: Geist, IBM Plex Sans, Söhne (if you have a licence), Public Sans. If you want a serif-bodied blog, swap to a humanist serif like Source Serif, Crimson Pro, or Lora -- but then also raise `--font-size-base` to `1.0625rem` for readability. To give headings their own face (or use a system font) without touching the font pipeline, override `--font-heading` or `--font-body` in `theme.css`.

CSS variables worth knowing (see `tokens.css` for the full list):

- `--color-brand`, `--color-brand-hover`, `--color-on-brand`, `--color-brand-ring`
- `--color-bg`, `--color-bg-subtle`, `--color-surface`, `--color-text`, `--color-text-secondary`, `--color-muted`, `--color-border`, `--color-border-subtle`
- `--font-body`, `--font-heading`, `--font-mono`
- `--font-weight-heading` (600) / `--font-weight-display` (700) -- heading weights; lower them if you switch to a serif
- `--tracking-tight` / `--tracking-snug` / `--tracking-wide` / `--tracking-wider` -- letter-spacing tokens used across headings and meta labels
- `--content-width` (680px) -- article body column
- `--wide-width` (1200px) -- max container
- `--gutter-width` (200px) -- right sidebar (TOC) on article pages
- `--meta-col-width` (180px) -- left meta column on article pages
- `--avatar-size-{xs,sm,md,lg}` -- byline avatar sizes at different scales

## What not to do

- Don't add a second accent colour or coloured section backgrounds. The page is white, grey text, and one olive (`#BBC647`).
- Don't replace Roboto with a display sans. Headings rely on weight and the brand colour, not novelty faces.
- Don't round corners -- the design uses square buttons and cards (`--radius: 0`).
- Don't hardcode homepage copy in `index.astro`; it lives in the `home` entry (slug `home`) and the `linh_vuc` entries, editable in the admin.
- Don't re-enable dark mode without designing for it; `color-scheme: light` is pinned in `theme.css` to match the corporate white design.
- Don't enable comments on dự án -- `commentsEnabled` is off deliberately.
