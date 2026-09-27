import type { RouteTemplateResolver } from '@vskstudio/takt-core'

export interface RouterLike {
  currentRoute: { value: { matched: ReadonlyArray<{ path: string }> } }
}

export function vueRouterTemplate(router: RouterLike): () => string | null {
  return () => {
    const { matched } = router.currentRoute.value
    return matched[matched.length - 1]?.path ?? null
  }
}

export function resolveRouteTemplate(
  routeTemplates: boolean | undefined,
  routeTemplate: RouteTemplateResolver | undefined,
  router: RouterLike | undefined,
): RouteTemplateResolver | undefined {
  if (routeTemplate || !routeTemplates || !router) return routeTemplate
  return vueRouterTemplate(router)
}
