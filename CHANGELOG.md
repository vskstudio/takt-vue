# @vskstudio/takt-vue

## 0.7.0

### Minor Changes

- 7c0e054: New `debug` prop on `<Takt>` and `debug` attribute on `<takt-analytics>`. `useTakt().optOut()`, `optIn()` and the new `isOptedOut()` work before `<Takt>` mounts, and the package re-exports `optOut`, `optIn` and `isOptedOut` from core (also from `./directives`). Requires `@vskstudio/takt-core` 0.9.0, where `scrubUrl` also covers outbound-link and file-download URLs.

## 0.6.3

### Patch Changes

- Fix the `useTakt()` no-op instance: it was missing `enableTagged`, so calling it
  before `<Takt>` mounted (or during SSR) threw a `TypeError` instead of doing
  nothing. The no-op is now typed against the full public instance surface, so a
  method added to the core fails the build rather than leaking to runtime.
- Accept `track-404` on `<takt-analytics>`, matching the kebab-case of every other
  multi-word attribute (`respect-dnt`, `exclude-localhost`, `script-origin`,
  `sample-rate`, `track-query`, `query-params`). The historical `track404` spelling
  keeps working.
- README realigned with the code: real default `endpoint`
  (`https://taktlytics.com/api/event`), `useTakt()` resolution timing, the no-op's
  one-time console warning, the components and `createStats` the plugin/entry also
  expose, the Vue-free `/element` bundle and its attribute table, `[data-takt-event]`
  as the tagged autocapture selector, and the peer dependency ranges.

## 0.6.2

### Patch Changes

- 1e342e7: Slim down the self-contained `/element` bundle: the `<takt-analytics>` custom
  element is now authored as a plain `HTMLElement` instead of a Vue custom element,
  dropping the bundled Vue runtime. The element only wired core imperatively on
  mount/unmount and rendered nothing, so no behavior or attribute changes — the
  bundle shrinks from ~25.6 kB to ~3.5 kB gzipped.

## 0.5.1

### Patch Changes

- Require takt-core >=0.6.0, whose default ingest endpoint and stats/widget host are now the hosted Takt origin (https://taktlytics.com). Docs updated to match; no wrapper code change.

## 0.5.0

### Minor Changes

- 2c59470: Expose advanced tracker options: enabled, sampleRate, trackQuery, queryParams,
  scrubUrl (function prop / config only) and tagged. Peer dep raised to takt-core >=0.5.0.

## 0.3.1

### Patch Changes

- Lock widget iframe with a default `referrerpolicy` and register `TaktBadge`/`TaktEmbed` globally in the plugin.

## 0.3.0

### Minor Changes

- Add native `TaktBadge` and `TaktEmbed` widget components and re-export the public stats client (`createStats`) and widget URL builders from `@vskstudio/takt-core`. Requires `@vskstudio/takt-core` >= 0.3.0.

## 0.2.0

### Minor Changes

- Align with `@vskstudio/takt-core` 0.2 (peer dependency bumped to `>=0.2.0`):
  custom event `props` and `revenue` now flow through `useTakt()`, the
  `v-takt-event` directive and `TaktPlugin`.
  - `v-takt-event` routed through the active instance for correct disposal.
  - Trimmed public surface, hardened CI matrix and packaging metadata.

## 0.1.0

### Minor Changes

- Initial release: idiomatic Vue 3 wrapper for Takt analytics.

  - `<Takt>` component (provides the instance, SSR-safe boot in `onMounted`)
  - `useTakt()` composable with a never-throwing no-op fallback
  - `v-takt-event` directive for declarative click tracking
  - `TaktPlugin` for `app.use()` global install
  - `<takt-analytics>` self-contained custom element via `./element`
