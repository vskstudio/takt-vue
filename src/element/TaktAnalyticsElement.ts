import { createTakt } from '@vskstudio/takt-core'

// Privacy attrs are default-on: only an explicit "false"/"0" disables them, so an
// absent attribute keeps the core default. Presence flags (outbound/files/track404)
// are on when the attribute exists at all; `tagged` additionally honors a false-y
// spelling so `tagged="false"` stays off.
const truthy = (v: string | null): boolean => v !== 'false' && v !== '0'

// Built lazily: referencing HTMLElement at module load throws under SSR (Node),
// so the class is created only when registration runs in a DOM environment. This
// is a plain custom element — it wires core imperatively and pulls in no Vue
// runtime, keeping the self-contained /element bundle tiny.
export function createTaktAnalyticsElement(): CustomElementConstructor {
  return class TaktAnalyticsElement extends HTMLElement {
    private disposers: Array<() => void> = []

    connectedCallback(): void {
      const attr = (name: string): string | null => this.getAttribute(name)

      const sampleRateAttr = attr('sample-rate')
      const queryParamsAttr = attr('query-params')
      const queryParams = queryParamsAttr
        ? queryParamsAttr.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined
      const excludeAttr = attr('exclude')
      const exclude = excludeAttr
        ? excludeAttr.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined

      const takt = createTakt({
        domain: attr('domain') ?? undefined,
        endpoint: attr('endpoint') ?? undefined,
        scriptOrigin: attr('script-origin') ?? undefined,
        respectDnt: truthy(attr('respect-dnt')),
        excludeLocalhost: truthy(attr('exclude-localhost')),
        ...(this.hasAttribute('enabled') ? { enabled: truthy(attr('enabled')) } : {}),
        ...(this.hasAttribute('debug') ? { debug: truthy(attr('debug')) } : {}),
        ...(sampleRateAttr !== null && Number.isFinite(parseFloat(sampleRateAttr)) ? { sampleRate: parseFloat(sampleRateAttr) } : {}),
        ...(this.hasAttribute('track-query') ? { trackQuery: truthy(attr('track-query')) } : {}),
        ...(queryParams && queryParams.length > 0 ? { queryParams } : {}),
        ...(exclude && exclude.length > 0 ? { exclude } : {}),
      })
      if (truthy(attr('spa'))) this.disposers.push(takt.enableSpa())
      if (this.hasAttribute('outbound')) this.disposers.push(takt.enableOutbound())
      if (this.hasAttribute('files')) this.disposers.push(takt.enableFiles())
      // `track-404` aligne la graphie sur les autres attributs multi-mots ;
      // `track404` reste accepté pour ne pas casser les intégrations existantes.
      if (this.hasAttribute('track-404') || this.hasAttribute('track404')) {
        this.disposers.push(takt.enable404())
      }
      const tagged = attr('tagged')
      if (tagged !== null && truthy(tagged)) this.disposers.push(takt.enableTagged())
      takt.pageview()
    }

    disconnectedCallback(): void {
      this.disposers.forEach((dispose) => dispose())
      this.disposers = []
    }
  }
}
