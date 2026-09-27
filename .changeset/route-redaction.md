---
"@vskstudio/takt-vue": minor
---

New `redactRoutes`, `routeTemplates` and `routeTemplate` options on `<Takt>` and `TaktPlugin`, forwarded to core, plus a `redact-routes` attribute on `<takt-analytics>`. A new `router` option (plugin) and prop (component) wires route templates from Vue Router when `routeTemplates` is on and no `routeTemplate` is given, through the new `vueRouterTemplate(router)` helper exported from the package root, which reads the deepest matched route path without depending on `vue-router`. Requires `@vskstudio/takt-core` 0.10.0.
