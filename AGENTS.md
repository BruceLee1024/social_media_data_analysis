# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A Chinese-language social media data analytics dashboard that unifies data from three platforms: **抖音 (Douyin/TikTok)**, **视频号 (WeChat Channels)**, and **小红书 (Xiaohongshu/RED)**. Users upload Excel/CSV export files from each platform, and the app auto-detects the platform, normalizes fields into a unified schema (`UnifiedData`), then provides analytics visualizations and goal tracking.

## Build & Dev Commands

- `npm run dev` — Start Vite dev server on localhost:5173
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript type checking (`tsc --noEmit -p tsconfig.app.json`)
- `npm run deploy` — Build + deploy to GitHub Pages via `gh-pages -d dist`

Docker: `docker compose up web` (production on :8080), `docker compose up dev` (HMR on :5174)

## Tech Stack

React 18 + TypeScript + Vite + Tailwind CSS. Charts via `recharts`. File parsing via `xlsx` (Excel) and `papaparse` (CSV). PDF/image export via `jspdf` + `html2canvas`. Icons exclusively from `lucide-react`. Backend: **Supabase** (client configured via `@supabase/supabase-js`). No router — single-page app with tab-based navigation managed in `App.tsx` state.

## Architecture

### Data Pipeline (core flow)

1. **File Upload** (`components/FileUpload.tsx`) — accepts `.xlsx`, `.xls`, `.csv` via drag-drop or file picker
2. **File Parsing** (`utils/fileProcessor.ts`) — `FileProcessor` reads Excel via `xlsx` or CSV via `papaparse`
3. **Platform Detection** (`utils/dataProcessor.ts`) — `DataProcessor.detectPlatform()` identifies the platform by checking for signature column headers (e.g. `作品名称` → 抖音, `视频描述` → 视频号, `笔记标题` → 小红书)
4. **Field Mapping & Normalization** (`utils/fieldMapping.ts`) — `FIELD_MAPPINGS` maps each platform's native column names to the unified schema fields. `DataProcessor.processData()` applies the mapping, normalizes dates/numbers/percentages, and collects unmapped columns into `扩展字段`
5. **Analytics Generation** (`utils/analyticsProcessor.ts`) — `AnalyticsProcessor.generateAnalytics()` produces platform comparison, time series, content type analysis, performance metrics, and top content rankings
6. **Export** (`utils/exporter.ts`) — `DataExporter.exportToExcel()` writes a multi-sheet Excel file (unified data, extended fields, field mapping reference)

### Unified Data Schema

All platform data is normalized to the `UnifiedData` interface (`types/index.ts`). Key fields: `来源平台`, `标题描述`, `发布时间`, `播放量`, `点赞量`, `评论量`, `收藏量`, `分享量`, `粉丝增量`, `完播率`, `平均播放时长`. Unmapped platform-specific columns go into `扩展字段`.

### Completion Rate (完播率) Handling

Platforms report completion rates differently — 抖音 uses decimal (0.15 = 15%), 视频号 uses percentage values, 小红书 doesn't provide it. All normalization logic is in `utils/completionRateUtils.ts`. Always use the utility functions (`normalizeCompletionRate`, `calculateAverageCompletionRate`) rather than doing manual conversion.

### Snapshot System

`utils/snapshotManager.ts` provides localStorage-based snapshots that save the full app state (processed data + analytics + goal data). Snapshots can be exported/imported as JSON files.

### App State & Navigation

`App.tsx` is the single orchestrator — it manages all top-level state (files, processedData, analytics, summary, goalData) and a 5-tab navigation: 首页 (home), 数据处理 (data processing), 数据分析 (analytics), 目标达成 (goals), 快照管理 (snapshots). There is no React Router.

### Analytics Dashboard Tabs

`components/Analytics/AnalyticsDashboard.tsx` has 7 sub-tabs: 数据概览, 平台对比, 趋势分析, 内容分析, 互动分析, 粉丝增长, 时间热力图. Each is a separate component under `components/Analytics/`.

## Key Conventions

- All UI text and field names are in **Chinese** — maintain this consistency
- The `vite.config.ts` sets `base: '/social_media_data_analysis/'` for GitHub Pages deployment — this affects asset paths
- Use `lucide-react` exclusively for icons (per `.bolt/prompt` convention)
- Tailwind CSS for all styling — no separate CSS modules except `index.css` and `styles/animations.css`
- When adding a new platform, update: `FIELD_MAPPINGS` in `fieldMapping.ts`, `detectPlatform()` in `dataProcessor.ts`, platform type union in `types/index.ts`, and completion rate handling in `completionRateUtils.ts`
