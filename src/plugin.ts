import type { App, Plugin } from 'vue'
import { createTakt, type Config } from '@vskstudio/takt-core'
import { vTaktEvent } from './directives/vTaktEvent'
import { taktStore } from './store'
import { resolveRouteTemplate, type RouterLike } from './routeTemplate'
import TaktBadge from './TaktBadge.vue'
import TaktEmbed from './TaktEmbed.vue'

export interface TaktPluginOptions extends Config {
  /** Auto-track outbound link clicks. */
  outbound?: boolean
  /** Auto-track file downloads. Pass an array to restrict to those extensions. */
  files?: boolean | string[]
  /** Track SPA navigations. Defaults to `true`. */
  spa?: boolean
  /** Report a `404` event when the page is an error page (`[data-takt-404]` / `<meta name="takt:404">` marker, or a 404 HTTP status). */
  track404?: boolean
  router?: RouterLike
}

// Type the globally-registered `v-takt-event` directive in consumer templates
// (Vue 3.4+ `GlobalDirectives`; an additive no-op on older versions).
declare module 'vue' {
  interface GlobalDirectives {
    vTaktEvent: typeof vTaktEvent
  }
}

/**
 * Vue plugin: `app.use(TaktPlugin, options?)`. Always registers the global
 * `v-takt-event` directive. When `options` are supplied, also bootstraps a
 * single browser instance (pageview + autocapture), so a `<Takt>` component is
 * optional. Init is deferred off the server — `install` may run during SSR.
 */
export const TaktPlugin: Plugin<[TaktPluginOptions?]> = {
  install(app: App, options?: TaktPluginOptions) {
    app.directive('takt-event', vTaktEvent)
    app.component('TaktBadge', TaktBadge)
    app.component('TaktEmbed', TaktEmbed)
    if (!options || typeof window === 'undefined') return

    const { outbound = false, files = false, spa = true, track404 = false, router, ...config } = options
    const routeTemplate = resolveRouteTemplate(config.routeTemplates, config.routeTemplate, router)
    const takt = createTakt(routeTemplate ? { ...config, routeTemplate } : config)
    // The bootstrapped instance lives for the app's lifetime; its autocapture
    // disposers are intentionally not retained (use <Takt> for scoped teardown).
    if (spa) takt.enableSpa()
    if (outbound) takt.enableOutbound()
    if (files) takt.enableFiles(Array.isArray(files) ? files : undefined)
    if (track404) takt.enable404()
    takt.pageview()
    taktStore.value = takt
  },
}
