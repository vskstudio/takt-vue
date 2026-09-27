import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock core: createTakt returns spies so tests assert wiring, never real reqs.
const { enableSpa, enableOutbound, enableFiles, enable404, enableTagged, pageview, createTakt } = vi.hoisted(() => {
  const enableSpa = vi.fn(() => vi.fn())
  const enableOutbound = vi.fn(() => vi.fn())
  const enableFiles = vi.fn(() => vi.fn())
  const enable404 = vi.fn(() => vi.fn())
  const enableTagged = vi.fn(() => vi.fn())
  const pageview = vi.fn()
  const instance = {
    enableSpa,
    enableOutbound,
    enableFiles,
    enable404,
    enableTagged,
    pageview,
    track: vi.fn(),
    optOut: vi.fn(),
    optIn: vi.fn(),
    isOptedOut: vi.fn(() => false),
  }
  const createTakt = vi.fn(() => instance)
  return { enableSpa, enableOutbound, enableFiles, enable404, enableTagged, pageview, createTakt }
})
vi.mock('@vskstudio/takt-core', () => ({ createTakt }))

// Importing the index registers <takt-analytics> as a side effect.
import { defineTaktElement } from '../src/element/index'

/** Create, configure, mount the element, then wait for onMounted to flush. */
async function boot(attrs: Record<string, string> = {}): Promise<HTMLElement> {
  const el = document.createElement('takt-analytics')
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  document.body.appendChild(el)
  await Promise.resolve()
  await new Promise((r) => setTimeout(r, 0))
  return el
}

describe('<takt-analytics> registration', () => {
  it('defineTaktElement registers the custom element and is idempotent', () => {
    expect(() => defineTaktElement()).not.toThrow()
    expect(() => defineTaktElement()).not.toThrow()
    expect(customElements.get('takt-analytics')).toBeTruthy()
  })
})

describe('<takt-analytics> boot behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('with no boolean attributes: privacy defaults stay TRUE, SPA on, pageview fires', async () => {
    await boot({ domain: 'exemple.fr' })
    expect(createTakt).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: 'exemple.fr',
        respectDnt: true,
        excludeLocalhost: true,
      }),
    )
    expect(enableSpa).toHaveBeenCalledTimes(1)
    expect(enableOutbound).not.toHaveBeenCalled()
    expect(enableFiles).not.toHaveBeenCalled()
    expect(pageview).toHaveBeenCalledTimes(1)
  })

  it('with outbound attribute present: enableOutbound is called', async () => {
    await boot({ domain: 'exemple.fr', outbound: '' })
    expect(enableOutbound).toHaveBeenCalledTimes(1)
  })

  it('with track404 attribute present: enable404 is called', async () => {
    await boot({ domain: 'exemple.fr', track404: '' })
    expect(enable404).toHaveBeenCalledTimes(1)
  })

  // Graphie kebab-case alignée sur les autres attributs multi-mots ; l'ancienne
  // graphie collée reste acceptée pour ne pas casser les intégrations.
  it('with track-404 attribute present: enable404 is called', async () => {
    await boot({ domain: 'exemple.fr', 'track-404': '' })
    expect(enable404).toHaveBeenCalledTimes(1)
  })

  it('without any 404 attribute: enable404 is not called', async () => {
    await boot({ domain: 'exemple.fr' })
    expect(enable404).not.toHaveBeenCalled()
  })

  it('forwards script-origin to the core (kebab attr maps to camel prop)', async () => {
    await boot({ domain: 'exemple.fr', 'script-origin': 'https://t.example.com' })
    expect(createTakt).toHaveBeenCalledWith(
      expect.objectContaining({ scriptOrigin: 'https://t.example.com' }),
    )
  })

  it('with spa="false": enableSpa is NOT called but pageview still fires', async () => {
    await boot({ domain: 'exemple.fr', spa: 'false' })
    expect(enableSpa).not.toHaveBeenCalled()
    expect(pageview).toHaveBeenCalledTimes(1)
  })

  it('with respectDnt="false" / excludeLocalhost="false": privacy flags are disabled', async () => {
    await boot({ domain: 'exemple.fr', 'respect-dnt': 'false', 'exclude-localhost': 'false' })
    expect(createTakt).toHaveBeenCalledWith(
      expect.objectContaining({ respectDnt: false, excludeLocalhost: false }),
    )
  })

  it('on disconnect: collected disposers run', async () => {
    const spaDispose = vi.fn()
    enableSpa.mockReturnValueOnce(spaDispose)
    const el = await boot({ domain: 'exemple.fr' })
    el.remove()
    await Promise.resolve()
    expect(spaDispose).toHaveBeenCalledTimes(1)
  })

  it('sample-rate="0.5" forwards numeric sampleRate to createTakt', async () => {
    await boot({ domain: 'exemple.fr', 'sample-rate': '0.5' })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ sampleRate: 0.5 }))
  })

  it('track-query attribute forwards trackQuery: true to createTakt', async () => {
    await boot({ domain: 'exemple.fr', 'track-query': '' })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ trackQuery: true }))
  })

  it('query-params="utm_source, utm_medium" forwards trimmed array to createTakt', async () => {
    await boot({ domain: 'exemple.fr', 'query-params': 'utm_source, utm_medium' })
    expect(createTakt).toHaveBeenCalledWith(
      expect.objectContaining({ queryParams: ['utm_source', 'utm_medium'] }),
    )
  })

  it('enabled="false" forwards enabled: false to createTakt', async () => {
    await boot({ domain: 'exemple.fr', enabled: 'false' })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('debug attribute present forwards debug: true; debug="false" forwards false; absent forwards nothing', async () => {
    await boot({ domain: 'exemple.fr', debug: '' })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ debug: true }))

    vi.clearAllMocks()
    document.body.innerHTML = ''
    await boot({ domain: 'exemple.fr', debug: 'false' })
    expect(createTakt).toHaveBeenCalledWith(expect.objectContaining({ debug: false }))

    vi.clearAllMocks()
    document.body.innerHTML = ''
    await boot({ domain: 'exemple.fr' })
    expect(createTakt).not.toHaveBeenCalledWith(expect.objectContaining({ debug: expect.anything() }))
  })

  it('tagged attribute present: enableTagged is called; absent: not called', async () => {
    await boot({ domain: 'exemple.fr', tagged: '' })
    expect(enableTagged).toHaveBeenCalledTimes(1)
    vi.clearAllMocks()
    document.body.innerHTML = ''
    await boot({ domain: 'exemple.fr' })
    expect(enableTagged).not.toHaveBeenCalled()
  })

  it('tagged="false" does NOT call enableTagged', async () => {
    await boot({ domain: 'exemple.fr', tagged: 'false' })
    expect(enableTagged).not.toHaveBeenCalled()
  })

  it('tagged="0" does NOT call enableTagged', async () => {
    await boot({ domain: 'exemple.fr', tagged: '0' })
    expect(enableTagged).not.toHaveBeenCalled()
  })
})
