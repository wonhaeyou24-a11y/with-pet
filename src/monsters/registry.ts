import { beongaekkori } from './species/Beongaekkori'
import { byeolbineul } from './species/Byeolbineul'
import { gangcheoldeung } from './species/Gangcheoldeung'
import { heugyeom } from './species/Heugyeom'
import { kongkong } from './species/Kongkong'
import { mongsil } from './species/Mongsil'
import type { SpeciesDef } from './types'

// 종족을 추가할 때 여기에 등록한다. 서버가 정하는 부품 개수(partCounts)와 맞춰야 한다.
export const SPECIES: Record<string, SpeciesDef> = {
  [mongsil.id]: mongsil,
  [kongkong.id]: kongkong,
  [beongaekkori.id]: beongaekkori,
  [gangcheoldeung.id]: gangcheoldeung,
  [heugyeom.id]: heugyeom,
  [byeolbineul.id]: byeolbineul,
}
