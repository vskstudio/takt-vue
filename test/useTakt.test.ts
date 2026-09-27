import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isOptedOut } from '@vskstudio/takt-core'
import { taktStore, resolveTakt, type TaktInstance } from '../src/store'
import { useTakt } from '../src/useTakt'

describe('store / useTakt', () => {
  beforeEach(() => {
    taktStore.value = null
  })

  it('resolveTakt returns null when nothing is provided and no module instance', () => {
    expect(resolveTakt()).toBeNull()
  })

  it('resolveTakt falls back to the module ref', () => {
    const fake = { track: () => {} } as unknown as TaktInstance
    taktStore.value = fake
    expect(resolveTakt()).toBe(fake)
    expect(taktStore.value).toBe(fake)
  })

  it('useTakt returns a never-throwing no-op when no instance exists', () => {
    const takt = useTakt()
    expect(() => takt.track('X')).not.toThrow()
    expect(() => takt.pageview()).not.toThrow()
    expect(() => takt.optOut()).not.toThrow()
    expect(() => takt.optIn()).not.toThrow()
  })

  it('useTakt returns the live module instance when present', () => {
    const fake = { track: () => {}, pageview: () => {}, optOut: () => {}, optIn: () => {} } as unknown as TaktInstance
    taktStore.value = fake
    expect(useTakt()).toBe(fake)
  })

  // Chaque autocapture activable par <Takt> / TaktPlugin doit être inerte sur le
  // no-op : `tagged` levait un TypeError faute d'`enableTagged`.
  it.each(['enableSpa', 'enableOutbound', 'enableFiles', 'enable404', 'enableTagged'] as const)(
    'the no-op exposes %s and returns a disposer',
    (method) => {
      const takt = useTakt()
      expect(typeof takt[method]).toBe('function')
      const dispose = takt[method]()
      expect(typeof dispose).toBe('function')
      expect(() => dispose()).not.toThrow()
    },
  )

  it('the no-op covers the whole public instance surface', () => {
    const takt = useTakt()
    const surface = [
      'track',
      'pageview',
      'optOut',
      'optIn',
      'isOptedOut',
      'enableSpa',
      'enableOutbound',
      'enableFiles',
      'enable404',
      'enableTagged',
    ] as const
    for (const method of surface) expect(typeof takt[method]).toBe('function')
  })
})

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const entries = new Map<string, string>()
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, String(value)),
    removeItem: (key) => void entries.delete(key),
  }
}

describe('no-op consent', () => {
  beforeEach(() => {
    taktStore.value = null
    vi.stubGlobal('localStorage', memoryStorage())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('optOut() and optIn() write the core consent before any instance exists', () => {
    const takt = useTakt()
    takt.optOut()
    expect(isOptedOut()).toBe(true)
    expect(takt.isOptedOut()).toBe(true)
    takt.optIn()
    expect(isOptedOut()).toBe(false)
    expect(takt.isOptedOut()).toBe(false)
  })

  it('isOptedOut() reads the core consent', () => {
    localStorage.setItem('takt_ignore', '1')
    expect(useTakt().isOptedOut()).toBe(true)
    localStorage.removeItem('takt_ignore')
    expect(useTakt().isOptedOut()).toBe(false)
  })
})
