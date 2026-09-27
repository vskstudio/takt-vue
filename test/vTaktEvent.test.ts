import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@vskstudio/takt-core', () => ({
  track: vi.fn(),
  init: vi.fn(),
  pageview: vi.fn(),
  optOut: vi.fn(),
  optIn: vi.fn(),
  isOptedOut: vi.fn(),
}))

import { vTaktEvent } from '../src/directives/vTaktEvent'
import { taktStore, type TaktInstance } from '../src/store'
import TaktEventFixture from './fixtures/TaktEventFixture.vue'
import * as core from '@vskstudio/takt-core'

const track = vi.mocked(core.track)

/** Drive the bare directive lifecycle hooks against a node, as Vue would. */
function bind(el: HTMLElement, value: { name: string; props?: Record<string, string>; revenue?: { amount: string; currency: string } }) {
  // @ts-expect-error — minimal binding shape; only `value` is read.
  vTaktEvent.mounted?.(el, { value })
  return {
    update: (next: typeof value) => {
      // @ts-expect-error — minimal binding shape.
      vTaktEvent.updated?.(el, { value: next })
    },
    // @ts-expect-error — unmounted only reads the element.
    destroy: () => vTaktEvent.unmounted?.(el, {}),
  }
}

describe('vTaktEvent directive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    taktStore.value = null
  })

  it('tracks on click with the configured name and props', () => {
    const node = document.createElement('button')
    bind(node, { name: 'Signup', props: { plan: 'pro' } })
    node.click()
    expect(track).toHaveBeenCalledWith('Signup', { props: { plan: 'pro' } })
  })

  it('forwards revenue on click', () => {
    const node = document.createElement('button')
    bind(node, { name: 'Purchase', revenue: { amount: '29.00', currency: 'EUR' } })
    node.click()
    expect(track).toHaveBeenCalledWith('Purchase', { revenue: { amount: '29.00', currency: 'EUR' } })
  })

  it('forwards both props and revenue', () => {
    const node = document.createElement('button')
    bind(node, {
      name: 'Purchase',
      props: { plan: 'pro' },
      revenue: { amount: '29.00', currency: 'EUR' },
    })
    node.click()
    expect(track).toHaveBeenCalledWith('Purchase', {
      props: { plan: 'pro' },
      revenue: { amount: '29.00', currency: 'EUR' },
    })
  })

  it('reacts to value updates', () => {
    const node = document.createElement('button')
    const action = bind(node, { name: 'A' })
    action.update({ name: 'B', props: { x: '1' } })
    node.click()
    expect(track).toHaveBeenCalledWith('B', { props: { x: '1' } })
  })

  it('routes through the active instance (set by <Takt>/plugin) when present', () => {
    const instanceTrack = vi.fn()
    taktStore.value = { track: instanceTrack } as unknown as TaktInstance
    const node = document.createElement('button')
    bind(node, { name: 'Scoped', props: { plan: 'pro' } })
    node.click()
    expect(instanceTrack).toHaveBeenCalledWith('Scoped', { props: { plan: 'pro' } })
    // The core default-instance fallback must NOT also fire.
    expect(track).not.toHaveBeenCalled()
  })

  it('falls back to core track() when no instance is published', () => {
    const node = document.createElement('button')
    bind(node, { name: 'Standalone' })
    node.click()
    expect(track).toHaveBeenCalledWith('Standalone', undefined)
  })

  it('removes the listener on unmount', () => {
    const node = document.createElement('button')
    const action = bind(node, { name: 'A' })
    action.destroy()
    node.click()
    expect(track).not.toHaveBeenCalled()
  })

  it('reacts to reactive value changes through v-takt-event (real Vue wiring)', async () => {
    const wrapper = mount(TaktEventFixture, { props: { params: { name: 'A' } } })
    const btn = wrapper.get('[data-testid="btn"]')
    await btn.trigger('click')
    expect(track).toHaveBeenLastCalledWith('A', undefined)

    await wrapper.setProps({ params: { name: 'B', props: { x: '1' } } })
    await btn.trigger('click')
    expect(track).toHaveBeenLastCalledWith('B', { props: { x: '1' } })
  })
})
