import { describe, it, expect, vi, beforeEach } from 'vitest'

const { enableSpa, enableOutbound, enableFiles, enable404, pageview, createTakt } = vi.hoisted(() => {
  const enableSpa = vi.fn(() => vi.fn())
  const enableOutbound = vi.fn(() => vi.fn())
  const enableFiles = vi.fn(() => vi.fn())
  const enable404 = vi.fn(() => vi.fn())
  const pageview = vi.fn()
  const instance = { enableSpa, enableOutbound, enableFiles, enable404, pageview, track: vi.fn(), optOut: vi.fn(), optIn: vi.fn(), isOptedOut: vi.fn(() => false) }
  const createTakt = vi.fn(() => instance)
  return { enableSpa, enableOutbound, enableFiles, enable404, pageview, createTakt }
})
vi.mock('@vskstudio/takt-core', () => ({
  createTakt,
  badgeUrl: vi.fn(() => 'https://h/badge.svg'),
  embedUrl: vi.fn(() => 'https://h/embed'),
}))

import { TaktPlugin } from '../src/plugin'
import { vTaktEvent } from '../src/directives/vTaktEvent'
import TaktBadge from '../src/TaktBadge.vue'
import TaktEmbed from '../src/TaktEmbed.vue'
import { taktStore } from '../src/store'

function fakeApp() {
  return { directive: vi.fn(), component: vi.fn() }
}

// The Plugin union doesn't expose `.install` cleanly; narrow to the object form.
const install = (TaktPlugin as { install: (app: unknown, options?: unknown) => void }).install

describe('TaktPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    taktStore.value = null
  })

  it('always registers the v-takt-event directive', () => {
    const app = fakeApp()
    install(app)
    expect(app.directive).toHaveBeenCalledWith('takt-event', vTaktEvent)
  })

  it('registers the TaktBadge and TaktEmbed components globally', () => {
    const app = fakeApp()
    install(app)
    expect(app.component).toHaveBeenCalledWith('TaktBadge', TaktBadge)
    expect(app.component).toHaveBeenCalledWith('TaktEmbed', TaktEmbed)
  })

  it('registers the directive but does NOT bootstrap when called without options', () => {
    const app = fakeApp()
    install(app)
    expect(createTakt).not.toHaveBeenCalled()
    expect(taktStore.value).toBeNull()
  })

  it('bootstraps a single instance when options are supplied', () => {
    const app = fakeApp()
    install(app, { domain: 'exemple.fr', outbound: true })
    expect(createTakt).toHaveBeenCalledWith({ domain: 'exemple.fr' })
    expect(enableSpa).toHaveBeenCalledTimes(1)
    expect(enableOutbound).toHaveBeenCalledTimes(1)
    expect(enableFiles).not.toHaveBeenCalled()
    expect(enable404).not.toHaveBeenCalled()
    expect(pageview).toHaveBeenCalledTimes(1)
    expect(taktStore.value).not.toBeNull()
  })

  it('forwards debug to the core', () => {
    const app = fakeApp()
    install(app, { domain: 'exemple.fr', debug: true })
    expect(createTakt).toHaveBeenCalledWith({ domain: 'exemple.fr', debug: true })
  })

  it('enables 404 tracking when track404 is set', () => {
    const app = fakeApp()
    install(app, { domain: 'exemple.fr', track404: true })
    expect(enable404).toHaveBeenCalledTimes(1)
  })
})
