<div align="center">

# @vskstudio/takt-vue


> 📚 **Documentation** — [taktlytics.com/docs/wrappers/vue](https://taktlytics.com/docs/wrappers/vue)

**Idiomatic Vue 3 wrapper for [Takt](https://github.com/taktlytics/takt-core) privacy-friendly analytics.**

[![npm version](https://img.shields.io/npm/v/@vskstudio/takt-vue?color=42b883&logo=npm)](https://www.npmjs.com/package/@vskstudio/takt-vue)
[![vue 3](https://img.shields.io/badge/vue-3-42b883?logo=vuedotjs&logoColor=fff)](https://vuejs.org)
[![license](https://img.shields.io/npm/l/@vskstudio/takt-vue?color=42b883)](./LICENSE)

</div>

---

A thin, SSR-safe Vue 3 layer over [`@vskstudio/takt-core`](https://www.npmjs.com/package/@vskstudio/takt-core). It never changes the wire payload or the privacy guarantees — it just makes Takt feel native in a Vue app.

- **`<Takt>` component** — drop it once near the root; it boots analytics after mount and provides the instance to the tree.
- **`useTakt()` composable** — grab the live instance anywhere; returns a never-throwing no-op (which warns once in the console) before mount or during SSR.
- **`v-takt-event` directive** — declarative click tracking, reactive to its binding.
- **`TaktPlugin`** — one-line global install (`app.use`); registers the directive plus the `TaktBadge` / `TaktEmbed` components, and (optionally) bootstraps a single instance.
- **`<takt-analytics>` custom element** — framework-agnostic, self-contained embed for non-Vue pages, with no Vue runtime.
- **`createStats()`** — re-exported from the core to read public stats.

## Install

```bash
pnpm add @vskstudio/takt-vue @vskstudio/takt-core
```

`vue` (`^3.3.0`) and `@vskstudio/takt-core` (`>=0.9.0`) are peer dependencies.

## Quick start — component + composable

Mount `<Takt>` once (e.g. in `App.vue`). It fires an initial pageview, wires SPA navigation, and provides the instance to every descendant:

```vue
<script setup lang="ts">
import { Takt } from '@vskstudio/takt-vue'
</script>

<template>
  <Takt domain="example.com" :outbound="true" :files="['pdf', 'zip']">
    <RouterView />
  </Takt>
</template>
```

Then track custom events from any descendant component. Call `useTakt()` **inside the handler**, not in `setup`:

```vue
<script setup lang="ts">
import { useTakt } from '@vskstudio/takt-vue'

function onSignup() {
  useTakt().track('Signup', {
    props: { plan: 'pro' },
    revenue: { amount: '29.00', currency: 'EUR' },
  })
}
</script>

<template>
  <button @click="onSignup">Subscribe</button>
</template>
```

`useTakt()` resolves the instance and never throws: when none is available yet it returns a no-op that swallows every call and warns once in the console.

Consent calls are the exception: on the no-op, `optOut()`, `optIn()` and `isOptedOut()` delegate to the core module functions, which read and write the `takt_ignore` localStorage flag directly. A cookie banner can record the visitor's choice before `<Takt>` has mounted, and the instance created later honours it.

`<Takt>` only publishes its instance in `onMounted`, which runs **after** the `setup` of its descendants. So `const takt = useTakt()` at the top of a child `setup` captures the no-op and keeps it forever — resolve the instance at call time instead (in the event handler, or in an `onMounted` hook of your own). The one exception is `app.use(TaktPlugin, options)`: it creates the instance synchronously during install, before anything mounts, so a `setup`-level `useTakt()` already sees the live instance in that setup.

### Component props

All props below except `router` are forwarded to the core; `router` only feeds `routeTemplate`.

| Prop | Type | Default | Effect |
| --- | --- | --- | --- |
| `domain` | `string` | `location.hostname` | Site identifier sent with every event |
| `endpoint` | `string` | `https://taktlytics.com/api/event` | Ingestion endpoint — pass `/api/event` for a same-origin first-party proxy |
| `scriptOrigin` | `string` | — | First-party origin to derive the endpoint from (`{origin}/api/event`) — your Takt domain or a custom domain to dodge ad-blockers (endpoint wins over it) |
| `spa` | `boolean` | `true` | Track SPA navigations (history + popstate) |
| `outbound` | `boolean` | `false` | Auto-track outbound link clicks |
| `files` | `boolean \| string[]` | `false` | Auto-track file downloads (optionally an extension allowlist) |
| `track404` | `boolean` | `false` | Report a `404` event when the page is an error page (`[data-takt-404]` / `<meta name="takt:404">` marker, or a 404 HTTP status) |
| `respectDnt` | `boolean` | `true` | Suppress events when Do Not Track is on |
| `excludeLocalhost` | `boolean` | `true` | Suppress events on localhost / private IPs |
| `enabled` | `boolean` | `true` | Master kill-switch — set to `false` to disable all tracking without removing the component |
| `debug` | `boolean` | `false` | Log each payload to the console (`console.debug`) before sending it |
| `sampleRate` | `number` | `1` | Fraction of sessions to track (0–1) |
| `trackQuery` | `boolean` | `false` | Include the query string in tracked URLs |
| `queryParams` | `string[]` | — | Query parameters to preserve when `trackQuery` is false |
| `exclude` | `string[]` | — | Path prefixes never tracked, e.g. `['/app', '/account']` (segment-bounded, checked at send time) |
| `scrubUrl` | `(url: string) => string` | — | Transform each URL before it is sent: the page URL and the `props.url` of outbound clicks and file downloads. Function prop only, it cannot be set as an HTML attribute on `<takt-analytics>` |
| `redactRoutes` | `string[]` |  | Sensitive route patterns: a matching path is sent as the pattern, e.g. `['/verify/:token']` turns `/verify/abc` into `/verify/:token` (see [Route redaction](#route-redaction)) |
| `routeTemplates` | `boolean` | `false` | Send every page as its route template instead of its real path |
| `routeTemplate` | `() => string \| null \| undefined` |  | Resolver of the current route template, read only when `routeTemplates` is on |
| `router` | `RouterLike` |  | A Vue Router instance; when `routeTemplates` is on and no `routeTemplate` is given, `vueRouterTemplate(router)` is used |
| `tagged` | `boolean` | `false` | Auto-track clicks on elements carrying `data-takt-event="Name"` (props read from `data-takt-prop-*`) |

## Consent

`optOut`, `optIn` and `isOptedOut` are exported from the package root (and from `./directives`). They need no instance, so a consent banner can use them anywhere, before or after `<Takt>` mounts:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { optOut, optIn, isOptedOut } from '@vskstudio/takt-vue'

const optedOut = ref(false)
onMounted(() => { optedOut.value = isOptedOut() })

function toggle() {
  if (optedOut.value) optIn()
  else optOut()
  optedOut.value = isOptedOut()
}
</script>

<template>
  <button @click="toggle">{{ optedOut ? 'Accepter la mesure' : 'Refuser la mesure' }}</button>
</template>
```

`isOptedOut()` reads localStorage, so call it in the browser (`onMounted` or an event handler) when the component is server-rendered.

## Declarative tracking — `v-takt-event`

For simple **click** tracking, skip the handler and bind the directive. It is reactive — changing the bound value updates what gets tracked, and the listener is cleaned up on unmount. At click time it tracks through the active instance (the one provided by `<Takt>` or `TaktPlugin`), falling back to the core default instance if you drive `init()` directly:

```vue
<script setup lang="ts">
import { vTaktEvent } from '@vskstudio/takt-vue'
</script>

<template>
  <button v-takt-event="{ name: 'Signup', props: { plan: 'pro' } }">
    Subscribe
  </button>

  <button v-takt-event="{ name: 'Purchase', revenue: { amount: '29.00', currency: 'EUR' } }">
    Buy
  </button>
</template>
```

The directive and the core functions are also available from the `./directives` subpath if you prefer a functional import:

```ts
import { vTaktEvent, init, track, pageview, optOut, optIn, isOptedOut } from '@vskstudio/takt-vue/directives'
```

## Plugin install

`app.use(TaktPlugin)` registers `v-takt-event` and the `TaktBadge` / `TaktEmbed` components globally, so you can use all three without a per-component import. Pass options to also bootstrap a single instance (pageview + autocapture) without a `<Takt>` component:

```ts
import { createApp } from 'vue'
import { TaktPlugin } from '@vskstudio/takt-vue'
import App from './App.vue'

createApp(App)
  .use(TaktPlugin, { domain: 'example.com', outbound: true })
  .mount('#app')
```

Options are the core `Config` (including `debug`, `redactRoutes`, `routeTemplates` and `routeTemplate`) plus `outbound`, `files`, `spa` (default `true`), `track404` and `router`. `tagged` is component-only. The instance is created synchronously during install and lives for the app's lifetime (its autocapture disposers are not retained; use `<Takt>` when you need scoped teardown).

Installing without options registers only the directive and the widget components — use `<Takt>` for instance lifecycle in that case. Instance bootstrapping is also skipped on the server.

## Route redaction

Query strings are stripped by default, but path segments are sent as they are: `/verify/abc123` leaks the token. List the sensitive routes with `redactRoutes` and a matching path is sent as its pattern, while every other page keeps its real path:

```ts
createApp(App)
  .use(TaktPlugin, { domain: 'example.com', redactRoutes: ['/verify/:token', '/reset/:code'] })
  .mount('#app')
```

Patterns accept the Vue Router syntax (`:param`, `:param?`, `*`, `**`) as well as the bracket syntax (`[param]`, `[[optional]]`, `[...rest]`). The rule also covers same-origin referrers, outbound and download links, and 404 paths.

For a fully private app, `routeTemplates: true` sends every page as its route template (`/users/42` becomes `/users/:id`). Pass your router and the plugin reads the matched route for you:

```ts
import { createApp } from 'vue'
import { TaktPlugin } from '@vskstudio/takt-vue'
import { router } from './router'
import App from './App.vue'

createApp(App)
  .use(router)
  .use(TaktPlugin, { domain: 'example.com', routeTemplates: true, router })
  .mount('#app')
```

The same works on the component, `<Takt domain="example.com" route-templates :router="router">`. Under the hood it uses `vueRouterTemplate(router)`, exported from the package root, which returns the `path` of the deepest matched record (Vue Router already stores it as the full normalized path, e.g. `/users/:id`). Pass your own `routeTemplate` resolver to override it. The helper is typed structurally, so the package does not depend on `vue-router`. On a public site this mode merges every article into one row, so prefer `redactRoutes` there.

## Custom element (no Vue required)

For non-Vue pages, import the `./element` subpath once. It registers `<takt-analytics>`, a self-contained custom element written as a plain `HTMLElement` — the core is bundled in, no Vue runtime, no build step or import map needed:

```ts
import '@vskstudio/takt-vue/element'
```

```html
<takt-analytics domain="example.com" outbound></takt-analytics>
```

| Attribute | Maps to | Notes |
| --- | --- | --- |
| `domain` | `domain` | |
| `endpoint` | `endpoint` | |
| `script-origin` | `scriptOrigin` | |
| `respect-dnt` | `respectDnt` | On unless `"false"` / `"0"` |
| `exclude-localhost` | `excludeLocalhost` | On unless `"false"` / `"0"` |
| `enabled` | `enabled` | Only read when the attribute is present |
| `debug` | `debug` | Only read when the attribute is present; `debug="false"` forces it back off |
| `sample-rate` | `sampleRate` | Ignored when not a number |
| `track-query` | `trackQuery` | Only read when the attribute is present |
| `query-params` | `queryParams` | Comma-separated list |
| `exclude` | `exclude` | Comma-separated list |
| `redact-routes` | `redactRoutes` | Comma-separated list of route patterns; no `routeTemplates` mode, since the element has no router |
| `spa` | `enableSpa()` | On unless `"false"` / `"0"` |
| `outbound` | `enableOutbound()` | Presence flag |
| `files` | `enableFiles()` | Presence flag, no extension allowlist (use `<Takt>` for that) |
| `track-404` | `enable404()` | Presence flag; legacy spelling `track404` still accepted |
| `tagged` | `enableTagged()` | Present and not `"false"` / `"0"` |

`scrubUrl` is a function option and has no attribute equivalent. The privacy defaults stay on unless explicitly disabled — `spa`, `respect-dnt`, and `exclude-localhost` only turn off when set to `"false"` (or `"0"`):

```html
<takt-analytics domain="example.com" spa="false" respect-dnt="false"></takt-analytics>
```

`defineTaktElement()` is also exported for explicit, idempotent registration. The bundle is SSR-safe: importing it on the server is a no-op until `customElements` exists.

## Widgets

Thin wrappers over the server-rendered badge SVG and embed iframe. Both take a `domain`; everything else is optional.

```vue
<script setup lang="ts">
import { TaktBadge, TaktEmbed } from '@vskstudio/takt-vue'
</script>

<template>
  <TaktBadge domain="exemple.fr" variant="d" />
  <TaktEmbed domain="exemple.fr" theme="dark" />
</template>
```

`TaktBadge` renders an `<img>` (`variant` `a`/`b`/`d` — default `a`, `glyph` `unplug`/`dash`/`off`/`eyeoff`, `lang` `fr`/`en` — default `fr`, `alt` overridable, default "takt"). `TaktEmbed` renders an `<iframe>` (`theme` `light`/`dark`/`auto` — default `light`, `lang` `fr`/`en` — default `fr`, `width` 404, `height` 264, `title` "takt"). The embed iframe is sandboxed (`sandbox="allow-scripts allow-same-origin"`) and its `referrerpolicy` is locked to `strict-origin-when-cross-origin` — it is no longer configurable. Both accept `host` to point at a custom Takt instance.

`host` must be an absolute `http(s)` URL (validated by core, which reduces it to its origin — any path or query is dropped). Omitted or empty, it falls back to the hosted Takt origin (`https://taktlytics.com`).

Read public stats with `createStats`:

```ts
import { createStats } from '@vskstudio/takt-vue'

const stats = createStats({ domain: 'exemple.fr' })
const summary = await stats.summary({ period: '7d' })
```

## SSR / Nuxt

Every entry is import-safe on the server — no module-load access to `window`, `document`, or `customElements`. The component defers all browser work to `onMounted`, `useTakt()` returns a no-op during the server pass, and the custom element only registers in the browser.

## Privacy

This wrapper sends nothing the core wouldn't: query strings and hashes are stripped from URLs by default, opt-out and Do Not Track are honored, and localhost / private IPs are excluded. See the [`@vskstudio/takt-core` privacy docs](https://www.npmjs.com/package/@vskstudio/takt-core#privacy) for the full contract and the frozen wire payload.

## License

MIT
