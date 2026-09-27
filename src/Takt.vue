<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { createTakt, type RouteTemplateResolver } from '@vskstudio/takt-core'
import { provideTakt, taktStore } from './store'
import { resolveRouteTemplate, type RouterLike } from './routeTemplate'

defineOptions({ name: 'Takt' })

interface Props {
  /** Site identifier sent with every event. Defaults to `location.hostname`. */
  domain?: string
  /** Ingestion endpoint. Defaults to `https://taktlytics.com/api/event` (the hosted Takt origin); pass `/api/event` for a same-origin first-party proxy. */
  endpoint?: string
  /** First-party origin to derive the endpoint from (`{origin}/api/event`). `endpoint` wins over it. */
  scriptOrigin?: string
  /** Auto-track outbound link clicks. */
  outbound?: boolean
  /** Auto-track file downloads. Pass an array to restrict to those extensions. */
  files?: boolean | string[]
  /** Track SPA navigations (history pushState/replaceState + popstate). */
  spa?: boolean
  /** Report a `404` event when the page is an error page (`[data-takt-404]` / `<meta name="takt:404">` marker, or a 404 HTTP status). */
  track404?: boolean
  /** Suppress events when the browser's Do Not Track is enabled. */
  respectDnt?: boolean
  /** Suppress events on localhost and private IP ranges. */
  excludeLocalhost?: boolean
  /** Master kill-switch: set to `false` to disable all tracking without removing the component. */
  enabled?: boolean
  debug?: boolean
  /** Fraction of sessions to track (0–1). Defaults to 1 (all sessions). */
  sampleRate?: number
  /** Include the query string in tracked URLs. */
  trackQuery?: boolean
  /** Query parameters to preserve when `trackQuery` is false. */
  queryParams?: string[]
  /** Path prefixes never tracked, e.g. ['/app','/account']. Segment-bounded: '/app' matches '/app' and '/app/…' but not '/application'. */
  exclude?: string[]
  /** Transform the URL before it is sent (dev/controlled use only). */
  scrubUrl?: (url: string) => string
  redactRoutes?: string[]
  routeTemplates?: boolean
  routeTemplate?: RouteTemplateResolver
  router?: RouterLike
  /** Auto-track clicks on elements carrying `data-takt-event` (props read from `data-takt-prop-*`). */
  tagged?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  outbound: false,
  files: false,
  spa: true,
  track404: false,
  respectDnt: true,
  excludeLocalhost: true,
  // Vue caste un prop Boolean absent en `false` ; sans ce défaut le kill-switch s'activerait tout seul.
  enabled: true,
  debug: false,
  routeTemplates: false,
})

const store = provideTakt()
let disposers: VoidFunction[] = []

onMounted(() => {
  const { domain, endpoint, scriptOrigin, respectDnt, excludeLocalhost, spa, outbound, files, track404, enabled, debug, sampleRate, trackQuery, queryParams, exclude, scrubUrl, tagged, redactRoutes, routeTemplates, router } = props
  const routeTemplate = resolveRouteTemplate(routeTemplates, props.routeTemplate, router)
  const takt = createTakt({ domain, endpoint, scriptOrigin, respectDnt, excludeLocalhost, enabled, debug, sampleRate, trackQuery, queryParams, exclude, scrubUrl, redactRoutes, routeTemplates, routeTemplate })
  if (spa) disposers.push(takt.enableSpa())
  if (outbound) disposers.push(takt.enableOutbound())
  if (files) disposers.push(takt.enableFiles(Array.isArray(files) ? files : undefined))
  if (track404) disposers.push(takt.enable404())
  if (tagged) disposers.push(takt.enableTagged())
  takt.pageview()

  store.value = takt
  taktStore.value = takt
})

onBeforeUnmount(() => {
  disposers.forEach((dispose) => dispose())
  disposers = []
  store.value = null
  taktStore.value = null
})
</script>

<template>
  <slot />
</template>
