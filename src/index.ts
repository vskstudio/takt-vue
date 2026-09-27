import Takt from './Takt.vue'
import TaktBadge from './TaktBadge.vue'
import TaktEmbed from './TaktEmbed.vue'

export { Takt, TaktBadge, TaktEmbed }
export { useTakt } from './useTakt'
export { TaktPlugin, type TaktPluginOptions } from './plugin'
export { vTaktEvent, type TaktEventParams } from './directives/vTaktEvent'
export type { TaktInstance } from './store'
export type { Config } from '@vskstudio/takt-core'

export { createStats, PublicApiError, badgeUrl, embedUrl, optOut, optIn, isOptedOut } from '@vskstudio/takt-core'
export type {
  BadgeOptions,
  EmbedOptions,
  BadgeVariant,
  BadgeGlyph,
  EmbedTheme,
  WidgetLang,
  StatsClient,
  StatsClientOptions,
  StatsParams,
  StatsPeriod,
  StatsDimension,
  StatsMetrics,
  StatsSummary,
  StatsPoint,
  StatsTimeseries,
  StatsBreakdownRow,
  StatsBreakdown,
  StatsRealtime,
} from '@vskstudio/takt-core'
