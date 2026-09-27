import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock the core so tests assert wiring, never real requests.
const { enableSpa, enableOutbound, enableFiles, enable404, enableTagged, pageview, createTakt } = vi.hoisted(() => {
  const enableSpa = vi.fn(() => vi.fn())
  const enableOutbound = vi.fn(() => vi.fn())
  const enableFiles = vi.fn(() => vi.fn())
  const enable404 = vi.fn(() => vi.fn())
  const enableTagged = vi.fn(() => vi.fn())
  const pageview = vi.fn()
  const instance = { enableSpa, enableOutbound, enableFiles, enable404, enableTagged, pageview, track: vi.fn(), optOut: vi.fn(), optIn: vi.fn(), isOptedOut: vi.fn(() => false) }
  const createTakt = vi.fn(() => instance)
  return { enableSpa, enableOutbound, enableFiles, enable404, enableTagged, pageview, createTakt }
})
vi.mock('@vskstudio/takt-core', () => ({ createTakt }))

import Takt from '../src/Takt.vue'
import { taktStore } from '../src/store'

describe('<Takt>', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    taktStore.value = null
  })

  it('inits with mapped config, enables SPA by default, fires initial pageview', () => {
    mount(Takt, { props: { domain: 'exemple.fr', endpoint: '/api/event' } })
    expect(createTakt).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'exemple.fr',
        endpoint: '/api/event',
        scriptOrigin: undefined,
        respectDnt: true,
        excludeLocalhost: true,
      }),
    )
    expect(enableSpa).toHaveBeenCalledTimes(1)
    expect(enableOutbound).not.toHaveBeenCalled()
    expect(enableFiles).not.toHaveBeenCalled()
    expect(enable404).not.toHaveBeenCalled()
    expect(pageview).toHaveBeenCalledTimes(1)
    expect(taktStore.value).not.toBeNull()
  })

  it('defaults enabled to true when the prop is absent (Vue would cast it to false)', () => {
    mount(Takt, { props: { domain: 'exemple.fr', endpoint: '/api/event' } })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('honors enabled=false as an explicit kill-switch', () => {
    mount(Takt, { props: { domain: 'exemple.fr', endpoint: '/api/event', enabled: false } })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('defaults debug to false when the prop is absent', () => {
    mount(Takt, { props: { domain: 'exemple.fr' } })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ debug: false }))
  })

  it('forwards debug to the core', () => {
    mount(Takt, { props: { domain: 'exemple.fr', debug: true } })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ debug: true, enabled: true }))
  })

  it('forwards scriptOrigin to the core', () => {
    mount(Takt, { props: { domain: 'exemple.fr', scriptOrigin: 'https://t.exemple.fr' } })
    expect(createTakt).toHaveBeenCalledWith(
      expect.objectContaining({ scriptOrigin: 'https://t.exemple.fr' }),
    )
  })

  it('enables only the toggled features and passes a file extension list', () => {
    mount(Takt, { props: { spa: false, outbound: true, files: ['pdf', 'zip'] } })
    expect(enableSpa).not.toHaveBeenCalled()
    expect(enableOutbound).toHaveBeenCalledTimes(1)
    expect(enableFiles).toHaveBeenCalledWith(['pdf', 'zip'])
  })

  it('files=true enables file tracking with no extension list (default set)', () => {
    mount(Takt, { props: { domain: 'exemple.fr', files: true } })
    expect(enableFiles).toHaveBeenCalledWith(undefined)
  })

  it('enables 404 tracking only when track404 is set', () => {
    mount(Takt, { props: { domain: 'exemple.fr' } })
    expect(enable404).not.toHaveBeenCalled()
    mount(Takt, { props: { domain: 'exemple.fr', track404: true } })
    expect(enable404).toHaveBeenCalledTimes(1)
  })

  it('disposes every enabled feature on unmount', () => {
    const spaDispose = vi.fn()
    const outboundDispose = vi.fn()
    enableSpa.mockReturnValueOnce(spaDispose)
    enableOutbound.mockReturnValueOnce(outboundDispose)
    const wrapper = mount(Takt, { props: { outbound: true } })
    wrapper.unmount()
    expect(spaDispose).toHaveBeenCalledTimes(1)
    expect(outboundDispose).toHaveBeenCalledTimes(1)
    expect(taktStore.value).toBeNull()
  })

  it('enables tagged tracking when tagged prop is set', () => {
    const taggedDispose = vi.fn()
    enableTagged.mockReturnValueOnce(taggedDispose)
    const wrapper = mount(Takt, { props: { domain: 'exemple.fr', tagged: true } })
    expect(enableTagged).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(taggedDispose).toHaveBeenCalledTimes(1)
  })

  it('renders default slot content', () => {
    const wrapper = mount(Takt, { slots: { default: '<p>child</p>' } })
    expect(wrapper.html()).toContain('child')
  })
  it('forwards redactRoutes, routeTemplates and routeTemplate to the core', () => {
    const routeTemplate = () => '/users/:id'
    mount(Takt, { props: { domain: 'exemple.fr', redactRoutes: ['/verify/:token'], routeTemplates: true, routeTemplate } })
    expect(createTakt).toHaveBeenCalledWith(
      expect.objectContaining({ redactRoutes: ['/verify/:token'], routeTemplates: true, routeTemplate }),
    )
  })

  it('defaults routeTemplates to false when the prop is absent', () => {
    mount(Takt, { props: { domain: 'exemple.fr' } })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ routeTemplates: false, routeTemplate: undefined }))
  })

  it('derives routeTemplate from the router prop when routeTemplates is on', () => {
    const router = { currentRoute: { value: { matched: [{ path: '/users' }, { path: '/users/:id' }] } } }
    mount(Takt, { props: { domain: 'exemple.fr', routeTemplates: true, router } })
    const [config] = createTakt.mock.calls[0] as unknown as [{ routeTemplate?: () => string | null; router?: unknown }]
    expect(config.router).toBeUndefined()
    expect(config.routeTemplate?.()).toBe('/users/:id')
  })

  it('keeps an explicit routeTemplate over the router prop', () => {
    const routeTemplate = () => '/explicit'
    const router = { currentRoute: { value: { matched: [{ path: '/users/:id' }] } } }
    mount(Takt, { props: { domain: 'exemple.fr', routeTemplates: true, routeTemplate, router } })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ routeTemplate }))
  })

  it('ignores the router prop when routeTemplates is off', () => {
    const router = { currentRoute: { value: { matched: [{ path: '/users/:id' }] } } }
    mount(Takt, { props: { domain: 'exemple.fr', router } })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ routeTemplate: undefined }))
  })
})
