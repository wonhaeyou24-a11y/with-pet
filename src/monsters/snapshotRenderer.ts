// 3D 펫을 한 번만 그려서 사진(PNG)으로 저장해 두는 도구.
// 광장처럼 펫이 여러 마리 보이는 화면에서 실시간 3D(WebGL) 여러 개를 돌리면 느려지므로,
// 같은 3D 모델을 공용 렌더러 하나로 찍어 두고 <img>로 보여 준다.

import * as THREE from 'three'
import type { DessertBaseId, MallangCustom } from './MallangChameleon'
import { build3DCharacterMesh, build3DDessertBase, createPatisserieEnvMap } from './Monster3DView'
import type { MonsterLook } from './types'

type Look = MonsterLook & { mallang?: MallangCustom }

const SNAP_SIZE = 256
const cache = new Map<string, string>()
let renderer: THREE.WebGLRenderer | null = null
let envTex: THREE.Texture | null = null
let failed = false

function getRenderer(): THREE.WebGLRenderer | null {
  if (failed) return null
  if (renderer) return renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(1)
    renderer.setSize(SNAP_SIZE, SNAP_SIZE)
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02
    envTex = createPatisserieEnvMap(renderer)
    renderer.domElement.addEventListener('webglcontextlost', () => {
      failed = true
    })
    return renderer
  } catch {
    failed = true
    return null
  }
}

export function snapshotKey(look: Look): string {
  const m = look.mallang
  return JSON.stringify([
    m?.morphForm ?? look.species,
    m?.dessertBase ?? 'strawberry-cake',
    m?.skinPalette ?? look.palette ?? 0,
    look.shiny ? 1 : 0,
    look.mutation ?? null,
    m?.syrups ?? null,
    m?.wingKind ?? null,
    m?.decorations ?? look.decorations ?? null,
  ])
}

// 캐시에 있으면 바로 돌려주고, 없으면 한 번 그려서 저장한다. WebGL을 못 쓰면 null.
export function getMonsterSnapshot(look: Look): string | null {
  const key = snapshotKey(look)
  const hit = cache.get(key)
  if (hit) return hit

  const r = getRenderer()
  if (!r || !envTex) return null

  const species = look.mallang?.morphForm ?? look.species
  const dessertBase: DessertBaseId = look.mallang?.dessertBase ?? 'strawberry-cake'
  const scene = new THREE.Scene()
  scene.environment = envTex

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
  camera.position.set(0, 0.42, 4.85)
  camera.lookAt(0, -0.1, 0)

  scene.add(new THREE.AmbientLight('#FFF5E8', 0.78))
  const key1 = new THREE.DirectionalLight('#FFFDF9', 1.85)
  key1.position.set(2.6, 4.2, 3.8)
  scene.add(key1)
  const rim = new THREE.DirectionalLight('#FFB3C6', 1.35)
  rim.position.set(-3.2, 2.0, -2.2)
  scene.add(rim)
  const bounce = new THREE.DirectionalLight('#FFE5B4', 0.75)
  bounce.position.set(0, -3.0, 2.0)
  scene.add(bounce)

  const stage = new THREE.Group()
  scene.add(stage)
  stage.add(build3DDessertBase(dessertBase))
  const { root } = build3DCharacterMesh(species, look)
  root.position.y = 0.08
  stage.add(root)

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 32),
    new THREE.MeshBasicMaterial({ color: '#5D4037', transparent: true, opacity: 0.16 }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -0.88
  stage.add(shadow)

  r.render(scene, camera)
  const url = r.domElement.toDataURL('image/png')

  scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    mesh.geometry?.dispose()
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
    else mat?.dispose()
  })

  cache.set(key, url)
  return url
}
