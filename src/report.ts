export type Fixture = {
  scope: string; source: string; referenceDate: string; modelVersion: string
  indicators: { id: string; label: string; unit: string }[]
  periods: { id: string; label: string; values: Record<string, number | null> }[]
  negativeCases: { id: string; label: string; periodId: string; overrideValues?: Record<string, number | null>; expected: string }[]
}
export function previewReport(fixture: Fixture, selection: string) {
  const negative = fixture.negativeCases.find(item => item.id === selection)
  const periodId = negative?.periodId ?? selection
  const period = fixture.periods.find(item => item.id === periodId)
  if (!period) return { title: `Period unavailable: ${periodId}`, errors: [`Period unavailable: ${periodId}`], rows: [], canInsert: false, expected: negative?.expected }
  const values = { ...period.values, ...negative?.overrideValues }
  const rows = fixture.indicators.map(indicator => ({ ...indicator, value: values[indicator.id] }))
  const errors = rows.filter(row => row.value == null || !Number.isFinite(row.value)).map(row => `Data unavailable: ${row.label}`)
  return { title: period.label, rows, errors, canInsert: errors.length === 0, expected: negative?.expected }
}
