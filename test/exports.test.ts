import { describe, it, expect } from 'vitest'
import * as core from '@vskstudio/takt-core'
import * as root from '../src/index'
import * as directives from '../src/directives/index'

describe('consent re-exports', () => {
  it('the package root re-exports optOut, optIn and isOptedOut from core', () => {
    expect(root.optOut).toBe(core.optOut)
    expect(root.optIn).toBe(core.optIn)
    expect(root.isOptedOut).toBe(core.isOptedOut)
  })

  it('the directives entry re-exports isOptedOut next to optOut and optIn', () => {
    expect(directives.optOut).toBe(core.optOut)
    expect(directives.optIn).toBe(core.optIn)
    expect(directives.isOptedOut).toBe(core.isOptedOut)
  })
})
