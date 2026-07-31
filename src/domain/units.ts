import type { Dimension, UnitId } from './types'

interface UnitDefinition {
  id: UnitId
  label: string
  dimension: Dimension
  toBase: number
}

export const units: Record<UnitId, UnitDefinition> = {
  rps: { id: 'rps', label: 'requests / second', dimension: 'rate', toBase: 1 },
  'per-day': {
    id: 'per-day',
    label: 'requests / day',
    dimension: 'rate',
    toBase: 1 / 86_400,
  },
  KB: { id: 'KB', label: 'KB', dimension: 'data', toBase: 1_000 },
  MB: { id: 'MB', label: 'MB', dimension: 'data', toBase: 1_000_000 },
  GB: { id: 'GB', label: 'GB', dimension: 'data', toBase: 1_000_000_000 },
  TB: { id: 'TB', label: 'TB', dimension: 'data', toBase: 1_000_000_000_000 },
  PB: {
    id: 'PB',
    label: 'PB',
    dimension: 'data',
    toBase: 1_000_000_000_000_000,
  },
  KiB: { id: 'KiB', label: 'KiB', dimension: 'data', toBase: 1_024 },
  MiB: { id: 'MiB', label: 'MiB', dimension: 'data', toBase: 1_048_576 },
  GiB: { id: 'GiB', label: 'GiB', dimension: 'data', toBase: 1_073_741_824 },
  kbps: { id: 'kbps', label: 'kbps', dimension: 'bandwidth', toBase: 1_000 },
  Mbps: {
    id: 'Mbps',
    label: 'Mbps',
    dimension: 'bandwidth',
    toBase: 1_000_000,
  },
  Gbps: {
    id: 'Gbps',
    label: 'Gbps',
    dimension: 'bandwidth',
    toBase: 1_000_000_000,
  },
  Tbps: {
    id: 'Tbps',
    label: 'Tbps',
    dimension: 'bandwidth',
    toBase: 1_000_000_000_000,
  },
  ms: { id: 'ms', label: 'milliseconds', dimension: 'latency', toBase: 1 },
  seconds: {
    id: 'seconds',
    label: 'seconds',
    dimension: 'latency',
    toBase: 1_000,
  },
  cores: { id: 'cores', label: 'CPU cores', dimension: 'compute', toBase: 1 },
  million: {
    id: 'million',
    label: 'million',
    dimension: 'quantity',
    toBase: 1_000_000,
  },
  billion: {
    id: 'billion',
    label: 'billion',
    dimension: 'quantity',
    toBase: 1_000_000_000,
  },
}

export const unitGroups: Record<Dimension, UnitId[]> = {
  rate: ['rps', 'per-day'],
  data: ['KB', 'MB', 'GB', 'TB', 'PB', 'KiB', 'MiB', 'GiB'],
  bandwidth: ['kbps', 'Mbps', 'Gbps', 'Tbps'],
  latency: ['ms', 'seconds'],
  compute: ['cores'],
  quantity: ['million', 'billion'],
}

export const answerUnitOptions: UnitId[] = [
  'rps',
  'million',
  'billion',
  'GB',
  'TB',
  'PB',
  'Mbps',
  'Gbps',
  'Tbps',
  'ms',
  'seconds',
  'cores',
]

export function toBaseUnit(value: number, unitId: UnitId): number {
  return value * units[unitId].toBase
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)
}

export function formatAnswer(value: number, unitId: UnitId): string {
  return `${formatNumber(value)} ${units[unitId].label}`
}
