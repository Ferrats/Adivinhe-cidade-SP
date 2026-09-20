import catalog from './municipalities.json'
import type { LngLat } from './geo'

export type Municipality = { id: number; name: string; center: LngLat }
export const municipalities: Municipality[] = catalog.map(item => ({
  ...item, center: [item.center[0], item.center[1]],
}))

export function normalizeName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ')
}

const byName = new Map(municipalities.map(item => [normalizeName(item.name), item]))
const byId = new Map(municipalities.map(item => [item.id, item]))
// Variants present in the coordinate source; canonical display names follow IBGE.
for (const [name, id] of [['Biritiba-Mirim', 3506607], ['Florínia', 3516101], ['Itaóca', 3522158]] as const) {
  byName.set(normalizeName(name), byId.get(id)!)
}
export const findMunicipality = (name: string) => byName.get(normalizeName(name))
export function getMunicipality(id: number) {
  const municipality = byId.get(id)
  if (!municipality) throw new Error(`Município ausente do catálogo: ${id}`)
  return municipality
}

export function searchMunicipalities(input: string, excludedIds: number[] = []) {
  const query = normalizeName(input)
  if (!query) return []
  return municipalities.filter(item => !excludedIds.includes(item.id) && normalizeName(item.name).includes(query))
    .sort((a, b) => Number(normalizeName(b.name).startsWith(query)) - Number(normalizeName(a.name).startsWith(query))
      || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, 10)
}
