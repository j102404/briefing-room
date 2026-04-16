import type { SubjectType } from '@/lib/data-strategies'
import { BASE_SYSTEM_PROMPT, STOCK_ADDENDUM } from './base'
import { STOCK_SYSTEM_PROMPT } from './stock'

export { BASE_SYSTEM_PROMPT, STOCK_ADDENDUM }

const NON_STOCK_ADDENDUM: Partial<Record<SubjectType, string>> = {
  commodity:   ' For commodities: focus on supply/demand dynamics, futures curve structure, macro tailwinds/headwinds, and positioning data. Reference specific inventory levels and production figures.',
  asset_class: ' For asset classes: evaluate the macro environment, rate sensitivity, historical drawdown behavior, and relative value versus alternatives.',
  macro:       ' For macro themes: assess the economic indicators, central bank policy trajectory, historical precedents, and second-order effects across asset classes.',
}

export function getSystemPrompt(subjectType: SubjectType): string {
  if (subjectType === 'stock') return STOCK_SYSTEM_PROMPT
  return BASE_SYSTEM_PROMPT + (NON_STOCK_ADDENDUM[subjectType] ?? '')
}
