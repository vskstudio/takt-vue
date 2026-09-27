import { describe, it, expect } from 'vitest'
import { vueRouterTemplate } from '../src/index'

describe('vueRouterTemplate', () => {
  it('returns the path of the deepest matched record', () => {
    const router = { currentRoute: { value: { matched: [{ path: '/users' }, { path: '/users/:id' }] } } }
    expect(vueRouterTemplate(router)()).toBe('/users/:id')
  })

  it('returns null when no route matched', () => {
    const router = { currentRoute: { value: { matched: [] } } }
    expect(vueRouterTemplate(router)()).toBeNull()
  })

  it('reads the current route at call time, not at creation', () => {
    const router = { currentRoute: { value: { matched: [{ path: '/' }] } } }
    const resolve = vueRouterTemplate(router)
    router.currentRoute.value = { matched: [{ path: '/posts/:slug' }] }
    expect(resolve()).toBe('/posts/:slug')
  })
})
