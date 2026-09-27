// @vitest-environment node
//
// SSR-safety contract: importing any public entry on the server must touch no
// browser globals (window, document, location, customElements). This runs in a
// real Node environment (no jsdom) so any module-load access to those globals
// throws and fails the test — locking in the deferral to onMounted and the
// customElements guard in the element entry.
import { describe, it, expect, vi } from 'vitest'

vi.mock('@vskstudio/takt-core', () => ({
  createTakt: vi.fn(),
  init: vi.fn(),
  track: vi.fn(),
  pageview: vi.fn(),
  optOut: vi.fn(),
  optIn: vi.fn(),
  isOptedOut: vi.fn(),
}))

describe('SSR safety (node environment, no DOM globals)', () => {
  it('has no browser globals available', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')
    expect(typeof customElements).toBe('undefined')
  })

  it('imports entry A (component + composable + plugin) without touching the DOM', async () => {
    const mod = await import('../src/index')
    expect(mod.Takt).toBeDefined()
    expect(typeof mod.useTakt).toBe('function')
    expect(mod.TaktPlugin).toBeDefined()
    expect(mod.vTaktEvent).toBeDefined()
  })

  it('imports the directives entry without touching the DOM', async () => {
    const mod = await import('../src/directives/index')
    expect(typeof mod.track).toBe('function')
    expect(mod.vTaktEvent).toBeDefined()
  })

  it('imports the element entry — registration is a no-op without customElements', async () => {
    const mod = await import('../src/element/index')
    expect(typeof mod.defineTaktElement).toBe('function')
    expect(() => mod.defineTaktElement()).not.toThrow()
  })

  it('TaktPlugin.install registers the directive but skips bootstrap on the server', async () => {
    const { TaktPlugin } = await import('../src/index')
    const core = await import('@vskstudio/takt-core')
    const directive = vi.fn()
    const component = vi.fn()
    const install = (TaktPlugin as { install: (app: unknown, options?: unknown) => void }).install
    install({ directive, component }, { domain: 'exemple.fr' })
    expect(directive).toHaveBeenCalledOnce()
    // No window on the server → no instance is created.
    expect(core.createTakt).not.toHaveBeenCalled()
  })

  it('useTakt() returns a never-throwing no-op on the server', async () => {
    const { useTakt } = await import('../src/index')
    const takt = useTakt()
    expect(() => takt.track('Evt')).not.toThrow()
    expect(() => takt.pageview()).not.toThrow()
  })
})
