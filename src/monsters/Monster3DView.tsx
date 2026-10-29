// 실시간 3D (Three.js WebGL) 말랑·쫀득·바삭·과즙 디저트 캐릭터 & 물리 탄성 엔진
// 메챠 카멜레온(Meccha Chameleon) 감성의 입체 3D 셰이딩(서브서피스 벨벳 광택, 유리알 굴절 코팅, 반투명 과즙 코어, 카다이프 결)과
// 터치/드래그 시 실시간 스프링 물리(Squash & Stretch, 젤리 워블, 크런치 파편 튀김, 360도 입체 회전)를 수행합니다.

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getSpeciesSoundKind } from '../lib/sound'
import { CHAMELEON_PALETTES, type DessertBaseId, type MallangCustom } from './MallangChameleon'
import type { MonsterLook } from './types'

interface Props {
  look: MonsterLook & { mallang?: MallangCustom }
  size?: number
  fluid?: boolean
  interactive?: boolean
  onFallbackNeeded?: () => void
}

interface CrumbParticle {
  mesh: THREE.Mesh
  vel: THREE.Vector3
  rotVel: THREE.Vector3
  life: number
  maxLife: number
}

// 종족별 3D 물리 탄성 파라미터 (쫀득/탱글/바삭/사르르 차별화)
function getPhysicsProfile(species: string): {
  stiffness: number
  damping: number
  pokeImpulse: number
  wobbleSpeed: number
  wobbleAmp: number
  kind: 'crispy' | 'chewy' | 'jiggly' | 'melty'
} {
  if (species === 'dubai-cookie' || species === 'tanghulu' || species === 'wax-ball' || species === 'kongkong' || species === 'gangcheoldeung') {
    return { stiffness: 320, damping: 14, pokeImpulse: 3.4, wobbleSpeed: 28, wobbleAmp: 0.08, kind: 'crispy' }
  }
  if (species === 'pudding' || species === 'jelly') {
    return { stiffness: 190, damping: 5.2, pokeImpulse: 4.6, wobbleSpeed: 16, wobbleAmp: 0.22, kind: 'jiggly' }
  }
  if (species === 'choco' || species === 'smore') {
    return { stiffness: 115, damping: 6.8, pokeImpulse: 3.8, wobbleSpeed: 9, wobbleAmp: 0.18, kind: 'melty' }
  }
  // mochi, chameleon, mongsil 등 쫀득 말랑 계열
  return { stiffness: 135, damping: 6.2, pokeImpulse: 4.8, wobbleSpeed: 11, wobbleAmp: 0.24, kind: 'chewy' }
}

// 스튜디오 반사광용 절차적 환경맵 생성 (유리알 탕후루·왁싱볼·푸딩·젤리의 영롱한 하이라이트용)
function createPatisserieEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envScene = new THREE.Scene()
  envScene.background = new THREE.Color('#FFF6E8')

  const topLight = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFFFFF') }),
  )
  topLight.position.set(0, 5, 2)
  topLight.lookAt(0, 0, 0)
  envScene.add(topLight)

  const warmSide = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFD1B3') }),
  )
  warmSide.position.set(-5, 2, 3)
  warmSide.lookAt(0, 0, 0)
  envScene.add(warmSide)

  const coolRim = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#D4F5E9') }),
  )
  coolRim.position.set(5, 3, -3)
  coolRim.lookAt(0, 0, 0)
  envScene.add(coolRim)

  const rt = pmrem.fromScene(envScene, 0.04)
  pmrem.dispose()
  return rt.texture
}

// 3D 케이크·쿠키·푸딩·파르페 받침대 생성
function build3DDessertBase(baseId: DessertBaseId): THREE.Group {
  const group = new THREE.Group()
  group.position.y = -0.92

  if (baseId === 'strawberry-cake') {
    // 생딸기 홀케이크 3D
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(1.52, 1.38, 0.1, 36),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF9', roughness: 0.2, clearcoat: 0.8 }),
    )
    plate.position.y = -0.22
    group.add(plate)

    const sponge = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.28, 0.36, 36),
      new THREE.MeshPhysicalMaterial({ color: '#FFF5E4', roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#FFE0B2') }),
    )
    sponge.position.y = -0.02
    group.add(sponge)

    const jamLayer = new THREE.Mesh(
      new THREE.CylinderGeometry(1.29, 1.29, 0.07, 36),
      new THREE.MeshPhysicalMaterial({ color: '#FF6B81', roughness: 0.25, clearcoat: 0.6 }),
    )
    jamLayer.position.y = -0.02
    group.add(jamLayer)

    // 가장자리 생크림 볼 & 딸기 토핑 8개
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2
      const rx = Math.cos(ang) * 1.06
      const rz = Math.sin(ang) * 1.06
      const cream = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 14),
        new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.35, clearcoat: 0.3 }),
      )
      cream.scale.set(1, 0.72, 1)
      cream.position.set(rx, 0.16, rz)
      group.add(cream)

      if (i % 2 === 0) {
        const berry = new THREE.Mesh(
          new THREE.ConeGeometry(0.11, 0.2, 14),
          new THREE.MeshPhysicalMaterial({ color: '#E11D48', roughness: 0.2, clearcoat: 0.7 }),
        )
        berry.position.set(rx, 0.28, rz)
        group.add(berry)
      }
    }
  } else if (baseId === 'choco-cookie') {
    // 오독 초코칩 버터쿠키 3D
    const cookie = new THREE.Mesh(
      new THREE.CylinderGeometry(1.36, 1.42, 0.24, 36),
      new THREE.MeshPhysicalMaterial({
        color: '#D99B52',
        roughness: 0.68,
        bumpScale: 0.04,
      }),
    )
    cookie.position.y = -0.06
    group.add(cookie)

    const chipCoords = [
      [-0.85, 0.07, 0.55],
      [0.88, 0.07, 0.48],
      [0.15, 0.08, 0.96],
      [-0.35, 0.08, 0.92],
      [-0.95, 0.06, -0.35],
      [0.92, 0.06, -0.4],
    ]
    chipCoords.forEach(([x, y, z]) => {
      const chip = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 14, 12),
        new THREE.MeshPhysicalMaterial({ color: '#3E2723', roughness: 0.25, clearcoat: 0.5 }),
      )
      chip.scale.set(1, 0.55, 1)
      chip.position.set(x, y, z)
      group.add(chip)
    })
  } else if (baseId === 'custard-pudding') {
    // 커스터드 푸딩 접시 3D
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(1.48, 1.25, 0.14, 36),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF9', roughness: 0.15, clearcoat: 0.9 }),
    )
    plate.position.y = -0.14
    group.add(plate)

    const caramelPool = new THREE.Mesh(
      new THREE.CylinderGeometry(1.18, 1.18, 0.06, 36),
      new THREE.MeshPhysicalMaterial({ color: '#8D4004', roughness: 0.08, clearcoat: 1.0 }),
    )
    caramelPool.position.y = -0.05
    group.add(caramelPool)
  } else if (baseId === 'macaron-cushion') {
    // 파스텔 마카롱 방석 3D
    const bottomShell = new THREE.Mesh(
      new THREE.SphereGeometry(1.32, 32, 20),
      new THREE.MeshPhysicalMaterial({ color: '#FFB7C5', roughness: 0.32, clearcoat: 0.45, sheen: 0.5 }),
    )
    bottomShell.scale.set(1, 0.22, 1)
    bottomShell.position.y = -0.06
    group.add(bottomShell)

    const creamFilling = new THREE.Mesh(
      new THREE.CylinderGeometry(1.24, 1.24, 0.12, 32),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF9', roughness: 0.35 }),
    )
    creamFilling.position.y = 0.04
    group.add(creamFilling)
  } else if (baseId === 'parfait-cup') {
    // 베리 파르페 유리컵 3D
    const glassRim = new THREE.Mesh(
      new THREE.CylinderGeometry(1.38, 0.95, 0.42, 36),
      new THREE.MeshPhysicalMaterial({
        color: '#E0F7FA',
        transmission: 0.72,
        opacity: 0.88,
        transparent: true,
        roughness: 0.06,
        clearcoat: 1.0,
      }),
    )
    glassRim.position.y = -0.15
    group.add(glassRim)

    const yogurtTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.26, 1.15, 0.12, 32),
      new THREE.MeshPhysicalMaterial({ color: '#FCE4EC', roughness: 0.22, clearcoat: 0.6 }),
    )
    yogurtTop.position.y = 0.02
    group.add(yogurtTop)
  } else {
    // 기본 포근 타르트 둥지 3D
    const tart = new THREE.Mesh(
      new THREE.CylinderGeometry(1.36, 1.16, 0.26, 32),
      new THREE.MeshPhysicalMaterial({ color: '#C68B59', roughness: 0.65 }),
    )
    tart.position.y = -0.1
    group.add(tart)
  }

  return group
}

// 종족별 3D 디저트 캐릭터 메쉬 조립
function build3DCharacterMesh(
  species: string,
  look: MonsterLook & { mallang?: MallangCustom },
): { root: THREE.Group; bodyGroup: THREE.Group; innerLiquid?: THREE.Object3D } {
  const root = new THREE.Group()
  const bodyGroup = new THREE.Group()
  root.add(bodyGroup)

  const palIdx = look.mallang?.skinPalette ?? look.palette ?? 0
  const basePal = CHAMELEON_PALETTES[palIdx % CHAMELEON_PALETTES.length]
  let innerLiquid: THREE.Object3D | undefined

  // 공통 3D 초롱초롱 눈 + 하이라이트 + 볼터치 + 입 부착 헬퍼
  const addCute3DFace = (zOffset: number, yOffset: number, cheekColor = '#FF8A9E') => {
    const faceGroup = new THREE.Group()
    faceGroup.position.set(0, yOffset, zOffset)

    const eyeMat = new THREE.MeshPhysicalMaterial({ color: '#231815', roughness: 0.08, clearcoat: 1.0 })
    const glintMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
    const cheekMat = new THREE.MeshPhysicalMaterial({
      color: cheekColor,
      roughness: 0.4,
      transparent: true,
      opacity: 0.82,
    })

    ;[-0.34, 0.34].forEach((xSide) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 18), eyeMat)
      eye.scale.set(1, 1.08, 0.65)
      eye.position.set(xSide, 0.06, 0)
      faceGroup.add(eye)

      // 큰 반짝이 하이라이트
      const glint1 = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), glintMat)
      glint1.position.set(xSide - 0.032, 0.1, 0.068)
      faceGroup.add(glint1)

      // 작은 보조 하이라이트
      const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), glintMat)
      glint2.position.set(xSide + 0.035, 0.02, 0.068)
      faceGroup.add(glint2)

      // 말랑 볼터치
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 14), cheekMat)
      cheek.scale.set(1.25, 0.68, 0.45)
      cheek.position.set(xSide * 1.48, -0.08, -0.04)
      faceGroup.add(cheek)
    })

    // 앙증맞은 3D 미소 입 (Torus 호)
    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.022, 12, 24, Math.PI),
      new THREE.MeshBasicMaterial({ color: '#3B2F2F' }),
    )
    mouth.rotation.z = Math.PI
    mouth.position.set(0, -0.02, 0.04)
    faceGroup.add(mouth)

    bodyGroup.add(faceGroup)
  }

  if (species === 'dubai-cookie') {
    // 💚 1. 두바이 쫀득쿠키 3D: 다크초코 쿠키 돔 + 피스타치오 스프레드 코어 + 입체 황금 카다이프 면발 수십 가닥
    const cookieMat = new THREE.MeshPhysicalMaterial({
      color: '#4A2C1D',
      roughness: 0.38,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
    })
    const mainBody = new THREE.Mesh(new THREE.SphereGeometry(0.96, 40, 36), cookieMat)
    mainBody.scale.set(1.08, 0.94, 0.96)
    bodyGroup.add(mainBody)

    // 쿠키 귀 & 쫀득 앞손
    ;[-0.64, 0.64].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), cookieMat)
      ear.position.set(x, 0.76, -0.05)
      bodyGroup.add(ear)

      const earInner = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 16, 14),
        new THREE.MeshPhysicalMaterial({ color: '#9CCC65', roughness: 0.3 }),
      )
      earInner.position.set(x, 0.76, 0.1)
      bodyGroup.add(earInner)

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 16), cookieMat)
      hand.scale.set(0.85, 1.1, 0.85)
      hand.position.set(x * 1.42, -0.08, 0.35)
      bodyGroup.add(hand)
    })

    // 배 한가운데 열린 꾸덕한 피스타치오 크림 코어 3D
    const pistachioCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 32, 28),
      new THREE.MeshPhysicalMaterial({
        color: '#9CCC65',
        roughness: 0.22,
        clearcoat: 0.65,
        sheen: 0.5,
        sheenColor: new THREE.Color('#DCEDC8'),
      }),
    )
    pistachioCore.scale.set(1.12, 0.78, 0.55)
    pistachioCore.position.set(0, -0.24, 0.66)
    bodyGroup.add(pistachioCore)

    // 볶은 황금 카다이프 면발 24가닥 (3D 원통 캡슐들이 배 위에서 입체적으로 얽혀 있음)
    const kataifiMat = new THREE.MeshPhysicalMaterial({
      color: '#F59E0B',
      roughness: 0.3,
      metalness: 0.15,
      clearcoat: 0.5,
    })
    for (let i = 0; i < 24; i++) {
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 8), kataifiMat)
      const ang = (i / 24) * Math.PI * 2
      const rad = (i % 3) * 0.14 + 0.06
      strand.position.set(Math.cos(ang) * rad * 1.2, -0.24 + Math.sin(ang) * rad * 0.75, 0.94 + (i % 2) * 0.02)
      strand.rotation.set(0.3 * Math.sin(i), 0.3 * Math.cos(i), (i * 1.1) % Math.PI)
      bodyGroup.add(strand)
    }

    // 머리 위 피스타치오 가나슈 드리즐 모자
    const topCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 24, 18),
      new THREE.MeshPhysicalMaterial({ color: '#7CB342', roughness: 0.18, clearcoat: 0.85 }),
    )
    topCap.scale.set(1.2, 0.35, 1.0)
    topCap.position.set(0, 0.82, 0)
    bodyGroup.add(topCap)

    addCute3DFace(0.92, 0.26, '#FF8A9E')
  } else if (species === 'wax-ball') {
    // 🫧 2. 톡톡 과즙 왁싱볼 3D: 반투명 파스텔 밀랍 구슬 + 내부에서 출렁이는 고농축 과일 시럽 코어 & 기포 + 상단 병마개 꼭지
    const waxPalette = [
      { shell: '#F3E5F5', core: '#9C27B0', drop: '#BA68C8' },
      { shell: '#E1F5FE', core: '#0288D1', drop: '#29B6F6' },
      { shell: '#FCE4EC', core: '#D81B60', drop: '#F06292' },
      { shell: '#FFF8E1', core: '#F57C00', drop: '#FFB300' },
      { shell: '#E8F5E9', core: '#388E3C', drop: '#66BB6A' },
    ][palIdx % 5]

    // 외곽 반투명 밀랍 왁스 캡슐
    const waxShellMat = new THREE.MeshPhysicalMaterial({
      color: waxPalette.shell,
      transmission: 0.68,
      thickness: 0.9,
      roughness: 0.12,
      ior: 1.46,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.9,
    })
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.95, 44, 40), waxShellMat)
    bodyGroup.add(shell)

    // 내부에서 실제로 찰랑거리는 과즙 시럽 액체 코어
    const liquidGroup = new THREE.Group()
    const liquidCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.76, 36, 32),
      new THREE.MeshPhysicalMaterial({
        color: waxPalette.core,
        emissive: new THREE.Color(waxPalette.core).multiplyScalar(0.18),
        roughness: 0.1,
        clearcoat: 1.0,
      }),
    )
    liquidCore.scale.set(1.0, 0.78, 1.0)
    liquidCore.position.y = -0.14
    liquidGroup.add(liquidCore)

    // 과즙 속 기포 방울 6개
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      transmission: 0.9,
      roughness: 0.05,
      clearcoat: 1.0,
    })
    ;[
      [-0.32, 0.1, 0.52, 0.09],
      [0.38, 0.02, 0.48, 0.11],
      [0.12, -0.25, 0.58, 0.07],
      [-0.22, 0.25, -0.35, 0.08],
    ].forEach(([bx, by, bz, br]) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(br, 14, 14), bubbleMat)
      b.position.set(bx, by, bz)
      liquidGroup.add(b)
    })
    bodyGroup.add(liquidGroup)
    innerLiquid = liquidGroup

    // 상단 트위스트 밀랍 병마개 꼭지
    const capStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.2, 0.34, 24),
      waxShellMat,
    )
    capStem.position.set(0, 1.02, 0)
    bodyGroup.add(capStem)

    const capRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.055, 14, 28),
      new THREE.MeshPhysicalMaterial({ color: waxPalette.drop, roughness: 0.2, clearcoat: 0.9 }),
    )
    capRim.rotation.x = Math.PI / 2
    capRim.position.set(0, 1.18, 0)
    bodyGroup.add(capRim)

    // 꼭지 옆에서 톡! 터져 맺힌 과즙 시럽 방울
    const juicyDrop = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 18, 16),
      new THREE.MeshPhysicalMaterial({ color: waxPalette.core, roughness: 0.05, clearcoat: 1.0 }),
    )
    juicyDrop.scale.set(0.85, 1.25, 0.85)
    juicyDrop.position.set(0.32, 0.88, 0.35)
    bodyGroup.add(juicyDrop)

    // 앙증맞은 왁스 구슬 양손 & 발
    ;[-0.96, 0.96].forEach((x) => {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 16), waxShellMat)
      hand.position.set(x, -0.04, 0.28)
      bodyGroup.add(hand)
    })

    addCute3DFace(0.92, 0.06, '#FF8A9E')
  } else if (species === 'tanghulu') {
    // 🍓 3. 유리알 설탕 탕후루 3D: 대나무 꼬치 + 생딸기·샤인머스캣 2단 과일 + 영롱한 고굴절 유리 설탕 코팅막
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 2.55, 16),
      new THREE.MeshPhysicalMaterial({ color: '#D7B377', roughness: 0.6 }),
    )
    stick.position.y = 0.12
    bodyGroup.add(stick)

    // 상단 큰 생딸기/체리 알맹이
    const topFruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 36, 32),
      new THREE.MeshPhysicalMaterial({ color: '#FF3B5C', roughness: 0.22, clearcoat: 0.7 }),
    )
    topFruit.scale.set(1.04, 0.96, 1.0)
    topFruit.position.y = 0.28
    bodyGroup.add(topFruit)

    // 하단 샤인머스캣 알맹이
    const botFruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 32, 28),
      new THREE.MeshPhysicalMaterial({ color: '#8BC34A', roughness: 0.22, clearcoat: 0.7 }),
    )
    botFruit.scale.set(1.08, 0.85, 1.04)
    botFruit.position.y = -0.52
    bodyGroup.add(botFruit)

    // 💎 핵심: 겉을 두껍게 감싸는 투명 유리알 설탕 시럽 코팅막
    const sugarGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      transmission: 0.86,
      thickness: 1.2,
      ior: 1.54,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      transparent: true,
      opacity: 0.92,
    })
    const topGlass = new THREE.Mesh(new THREE.SphereGeometry(0.81, 36, 32), sugarGlassMat)
    topGlass.scale.set(1.04, 0.96, 1.0)
    topGlass.position.y = 0.28
    bodyGroup.add(topGlass)

    const botGlass = new THREE.Mesh(new THREE.SphereGeometry(0.65, 32, 28), sugarGlassMat)
    botGlass.scale.set(1.08, 0.86, 1.04)
    botGlass.position.y = -0.52
    bodyGroup.add(botGlass)

    // 초록 딸기 꼭지 왕관
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.36, 12),
        new THREE.MeshPhysicalMaterial({ color: '#4ADE80', roughness: 0.35 }),
      )
      leaf.position.set(Math.cos(ang) * 0.22, 0.98, Math.sin(ang) * 0.22)
      leaf.rotation.z = -Math.cos(ang) * 0.8
      leaf.rotation.x = Math.sin(ang) * 0.8
      bodyGroup.add(leaf)
    }

    addCute3DFace(0.82, 0.32, '#FFCDD2')
  } else if (species === 'pudding') {
    // 🍮 4. 말랑말랑 커스터드 푸딩 3D: 사다리꼴 탱글 커스터드 + 윤기 흐르는 카라멜 시럽 모자 + 체리
    const custardMat = new THREE.MeshPhysicalMaterial({
      color: '#FFE066',
      roughness: 0.09,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transmission: 0.22,
      thickness: 0.8,
    })
    const puddingBody = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.98, 1.38, 40), custardMat)
    puddingBody.position.y = -0.05
    bodyGroup.add(puddingBody)

    // 상단 둥근 베벨 돔
    const topDome = new THREE.Mesh(new THREE.SphereGeometry(0.68, 36, 24), custardMat)
    topDome.scale.set(1, 0.38, 1)
    topDome.position.y = 0.62
    bodyGroup.add(topDome)

    // 진한 카라멜 시럽 모자 & 흘러내리는 시럽 물방울 6개
    const caramelMat = new THREE.MeshPhysicalMaterial({
      color: '#6D2E00',
      roughness: 0.04,
      clearcoat: 1.0,
    })
    const caramelCap = new THREE.Mesh(new THREE.SphereGeometry(0.7, 36, 24), caramelMat)
    caramelCap.scale.set(1.02, 0.35, 1.02)
    caramelCap.position.y = 0.66
    bodyGroup.add(caramelCap)

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.3
      const drip = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), caramelMat)
      drip.scale.set(0.8, 1.65, 0.8)
      drip.position.set(Math.cos(ang) * 0.66, 0.48, Math.sin(ang) * 0.66)
      bodyGroup.add(drip)
    }

    // 꼭대기 빨간 체리
    const cherry = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 20, 18),
      new THREE.MeshPhysicalMaterial({ color: '#E11D48', roughness: 0.08, clearcoat: 1.0 }),
    )
    cherry.position.set(0, 0.94, 0)
    bodyGroup.add(cherry)

    addCute3DFace(0.84, -0.02, '#FF8A9E')
  } else if (species === 'jelly') {
    // 🐻 5. 쫀득 구미 젤리베어 3D: 반투명 유리알 젤리 재질 + 배 속에 비치는 하트 과일 코어
    const jellyMat = new THREE.MeshPhysicalMaterial({
      color: basePal.fur,
      transmission: 0.65,
      thickness: 1.1,
      ior: 1.48,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      transparent: true,
      opacity: 0.92,
    })
    const torso = new THREE.Mesh(new THREE.SphereGeometry(0.88, 40, 36), jellyMat)
    torso.scale.set(1.02, 1.06, 0.94)
    bodyGroup.add(torso)

    // 젤리곰 동글동글 귀 & 손
    ;[-0.58, 0.58].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 20), jellyMat)
      ear.position.set(x, 0.78, 0)
      bodyGroup.add(ear)

      const arm = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 18), jellyMat)
      arm.scale.set(0.85, 1.15, 0.85)
      arm.position.set(x * 1.4, -0.08, 0.3)
      bodyGroup.add(arm)
    })

    // 반투명 젤리 배 속에서 반짝이는 과일 시럽 코어
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 24),
      new THREE.MeshPhysicalMaterial({
        color: '#FF4081',
        emissive: new THREE.Color('#FF4081').multiplyScalar(0.32),
        roughness: 0.15,
      }),
    )
    core.position.set(0, -0.1, 0.1)
    bodyGroup.add(core)
    innerLiquid = core

    addCute3DFace(0.84, 0.18, '#FF80AB')
  } else if (species === 'smore') {
    // 🔥 6. 구운 스모어 마시멜로 3D: 노릇하게 토스트된 폭신 마시멜로 원통 + 고양이 귀 + 분홍 젤리 발바닥 육구
    const smoreMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFDF7',
      roughness: 0.42,
      sheen: 0.9,
      sheenColor: new THREE.Color('#FDE68A'),
      clearcoat: 0.25,
    })
    const marshmallow = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.86, 1.32, 36), smoreMat)
    marshmallow.position.y = -0.04
    bodyGroup.add(marshmallow)

    // 노릇노릇하게 구워진 카라멜라이즈 상단 캡
    const roastedTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.79, 36, 24),
      new THREE.MeshPhysicalMaterial({ color: '#D97706', roughness: 0.25, clearcoat: 0.65 }),
    )
    roastedTop.scale.set(1, 0.38, 1)
    roastedTop.position.y = 0.6
    bodyGroup.add(roastedTop)

    // 고양이 귀 & 분홍 육구 앞손
    const pawPadMat = new THREE.MeshPhysicalMaterial({ color: '#FF8A9E', roughness: 0.2, clearcoat: 0.8 })
    ;[-0.52, 0.52].forEach((x) => {
      const ear = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.42, 16),
        new THREE.MeshPhysicalMaterial({ color: '#B45309', roughness: 0.3 }),
      )
      ear.position.set(x, 0.86, 0)
      ear.rotation.z = x > 0 ? -0.22 : 0.22
      bodyGroup.add(ear)

      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), smoreMat)
      paw.position.set(x * 1.38, -0.16, 0.56)
      bodyGroup.add(paw)

      const mainPad = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 12), pawPadMat)
      mainPad.scale.set(1.2, 0.9, 0.6)
      mainPad.position.set(x * 1.38, -0.18, 0.78)
      bodyGroup.add(mainPad)
    })

    addCute3DFace(0.84, 0.14, '#FF8A9E')
  } else if (species === 'choco') {
    // 🍫 7. 달콤 퐁듀 초코 3D: 진한 가나슈 트러플 돔 + 따뜻한 초코 드리즐 + 금박 토핑
    const chocoMat = new THREE.MeshPhysicalMaterial({
      color: '#3E2217',
      roughness: 0.12,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06,
    })
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.94, 40, 36), chocoMat)
    dome.scale.set(1.08, 0.92, 1.0)
    bodyGroup.add(dome)

    // 녹아내리는 밀크초코 퐁듀 모자
    const fondueCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.76, 32, 24),
      new THREE.MeshPhysicalMaterial({ color: '#6D4C41', roughness: 0.08, clearcoat: 1.0 }),
    )
    fondueCap.scale.set(1.06, 0.48, 1.04)
    fondueCap.position.y = 0.56
    bodyGroup.add(fondueCap)

    // 반짝이는 식용 금박 포인트
    const goldLeaf = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshPhysicalMaterial({ color: '#FFD700', metalness: 0.9, roughness: 0.15, clearcoat: 1.0 }),
    )
    goldLeaf.position.set(0.22, 0.86, 0.18)
    bodyGroup.add(goldLeaf)

    addCute3DFace(0.94, 0.1, '#FF8A9E')
  } else {
    // 🍡🦎 8. 쫀득 찹쌀떡 모찌 & 말랑 카멜레온 & 클래식 체형 3D:
    // 통통하고 입체감 있는 반투명 찹쌀떡 젤리 재질 + 3D 생딸기 생크림 토핑
    const vividMochiColor = new THREE.Color(basePal.fur).lerp(new THREE.Color('#FF8DA8'), palIdx === 0 ? 0.35 : 0.15)
    const mochiMat = new THREE.MeshPhysicalMaterial({
      color: vividMochiColor,
      roughness: 0.16,
      transmission: 0.25,
      thickness: 1.1,
      ior: 1.38,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      sheen: 0.85,
      sheenRoughness: 0.25,
      sheenColor: new THREE.Color('#FFF0F5'),
    })
    const mochiBody = new THREE.Mesh(new THREE.SphereGeometry(0.95, 44, 40), mochiMat)
    // 통통하고 쫀득한 3D 모찌 비율
    mochiBody.scale.set(1.06, 0.96, 1.02)
    mochiBody.position.y = 0.02
    bodyGroup.add(mochiBody)

    // 포근한 우유빛 배 패치
    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 32, 28),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF9', roughness: 0.25, clearcoat: 0.6 }),
    )
    belly.scale.set(1.05, 0.84, 0.45)
    belly.position.set(0, -0.14, 0.76)
    bodyGroup.add(belly)

    // 말랑 찹쌀떡 귀 & 앞손
    ;[-0.56, 0.56].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 18), mochiMat)
      ear.scale.set(1.05, 0.95, 0.9)
      ear.position.set(x, 0.78, 0)
      bodyGroup.add(ear)

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 18), mochiMat)
      hand.scale.set(0.95, 0.88, 1.1)
      hand.position.set(x * 1.32, -0.08, 0.62)
      bodyGroup.add(hand)
    })

    // 카멜레온 체형일 때 돌돌 말린 3D 젤리 꼬리 추가
    if (species === 'chameleon') {
      const tail = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.12, 16, 32, Math.PI * 1.65), mochiMat)
      tail.position.set(0.82, -0.25, -0.35)
      bodyGroup.add(tail)
    }

    // 머리 위 생크림 쿠션 + 반짝이는 3D 생딸기 토핑
    const creamDollop = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.07, 14, 24),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF9', roughness: 0.25, clearcoat: 0.5 }),
    )
    creamDollop.rotation.x = Math.PI / 2
    creamDollop.position.set(0, 0.88, 0.05)
    bodyGroup.add(creamDollop)

    const topBerry = new THREE.Mesh(
      new THREE.ConeGeometry(0.19, 0.34, 20),
      new THREE.MeshPhysicalMaterial({ color: '#FF2E55', roughness: 0.12, clearcoat: 1.0 }),
    )
    topBerry.position.set(0, 1.04, 0.05)
    bodyGroup.add(topBerry)

    addCute3DFace(0.95, 0.14, '#FF5C8A')
  }

  return { root, bodyGroup, innerLiquid }
}

// 브라우저의 동시 WebGL 컨텍스트 한도(최대 16개) 초과로 인한 컨텍스트 소실을 완벽 차단하기 위한 안전 카운터
let activeWebglContexts = 0
const MAX_ACTIVE_WEBGL = 8

export default function Monster3DView({
  look,
  size = 220,
  fluid = false,
  onFallbackNeeded,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [webglFailed, setWebglFailed] = useState(false)

  const activeSpecies = look.mallang?.morphForm ?? look.species
  const dessertBase: DessertBaseId = look.mallang?.dessertBase ?? 'strawberry-cake'
  const paletteKey = look.mallang?.skinPalette ?? look.palette ?? 0

  // 스프링 물리 상태 레퍼런스 (포인터 터치·드래그 시 실시간 반응)
  const physRef = useRef({
    squash: 0, // +면 위아래로 납작해지고 옆으로 퍼짐 (Squash), -면 위로 솟음 (Stretch)
    squashVel: 0,
    wobblePhase: 0,
    wobbleAmp: 0,
    rotY: 0,
    rotX: 0,
    targetRotY: 0,
    targetRotX: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    spawnBurst: false,
  })

  // 부모 컴포넌트(스테이지 클릭 등)에서 리렌더가 일어날 때도 3D 말랑 탄성이 부드럽게 튀어오르도록 연동
  useEffect(() => {
    const profile = getPhysicsProfile(activeSpecies)
    physRef.current.squashVel = profile.pokeImpulse * 0.25
    physRef.current.wobbleAmp = profile.wobbleAmp * 0.4
  }, [activeSpecies, dessertBase, paletteKey])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (activeWebglContexts >= MAX_ACTIVE_WEBGL) {
      setWebglFailed(true)
      onFallbackNeeded?.()
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      activeWebglContexts += 1
    } catch {
      setWebglFailed(true)
      onFallbackNeeded?.()
      return
    }

    const handleContextLost = (ev: Event) => {
      ev.preventDefault()
      setWebglFailed(true)
      onFallbackNeeded?.()
    }
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false)

    const side = fluid ? Math.min(el.clientWidth || 210, el.clientHeight || 210, 220) : Math.max(125, size || 200)
    const w = side
    const h = side
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(w, h)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02

    el.innerHTML = ''
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const envTex = createPatisserieEnvMap(renderer)
    scene.environment = envTex

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30)
    camera.position.set(0, 0.42, 4.85)
    camera.lookAt(0, -0.1, 0)

    // 따뜻한 파티세리 3점 조명
    const ambient = new THREE.AmbientLight('#FFF5E8', 0.78)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight('#FFFDF9', 1.85)
    keyLight.position.set(2.6, 4.2, 3.8)
    scene.add(keyLight)

    const pinkRim = new THREE.DirectionalLight('#FFB3C6', 1.35)
    pinkRim.position.set(-3.2, 2.0, -2.2)
    scene.add(pinkRim)

    const bottomBounce = new THREE.DirectionalLight('#FFE5B4', 0.75)
    bottomBounce.position.set(0, -3.0, 2.0)
    scene.add(bottomBounce)

    // 3D 플레이팅 받침대 + 3D 디저트 캐릭터 조립
    const stageGroup = new THREE.Group()
    scene.add(stageGroup)

    const baseGroup = build3DDessertBase(dessertBase)
    stageGroup.add(baseGroup)

    const { root: charRoot, bodyGroup, innerLiquid } = build3DCharacterMesh(activeSpecies, look)
    charRoot.position.y = 0.08
    stageGroup.add(charRoot)

    // 바닥 소프트 그림자 디스크
    const shadowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.15, 32),
      new THREE.MeshBasicMaterial({ color: '#5D4037', transparent: true, opacity: 0.16 }),
    )
    shadowDisc.rotation.x = -Math.PI / 2
    shadowDisc.position.y = -0.88
    stageGroup.add(shadowDisc)

    // 터치 시 튀어오르는 3D 식감 파편(카다이프/설탕조각/과즙방울/모찌파우더) 파티클 풀
    const crumbs: CrumbParticle[] = []
    const soundKind = getSpeciesSoundKind(activeSpecies, dessertBase)
    const crumbColor =
      soundKind === 'kataifi-crunch'
        ? '#9CCC65'
        : soundKind === 'wax-pop'
          ? '#BA68C8'
          : soundKind === 'sugar-crack'
            ? '#FF80AB'
            : soundKind === 'cookie-crisp'
              ? '#D99B52'
              : '#FFFDF9'

    const spawn3DCrumbBurst = () => {
      const geo = new THREE.SphereGeometry(0.065, 10, 10)
      const mat = new THREE.MeshPhysicalMaterial({
        color: crumbColor,
        roughness: 0.15,
        clearcoat: 0.9,
      })
      for (let i = 0; i < 12; i++) {
        const m = new THREE.Mesh(geo, mat)
        const ang = (i / 12) * Math.PI * 2 + Math.random() * 0.3
        const spd = 1.6 + Math.random() * 1.4
        m.position.set(Math.cos(ang) * 0.35, 0.15 + Math.random() * 0.3, Math.sin(ang) * 0.35 + 0.3)
        scene.add(m)
        crumbs.push({
          mesh: m,
          vel: new THREE.Vector3(Math.cos(ang) * spd, 1.8 + Math.random() * 1.6, Math.sin(ang) * spd),
          rotVel: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
          life: 0,
          maxLife: 0.55 + Math.random() * 0.25,
        })
      }
    }

    const profile = getPhysicsProfile(activeSpecies)
    let animId = 0
    let prevTime = performance.now()

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate)
      const dt = Math.min(0.033, (now - prevTime) / 1000)
      prevTime = now
      const t = now * 0.001
      const st = physRef.current

      if (st.spawnBurst) {
        st.spawnBurst = false
        spawn3DCrumbBurst()
      }

      // 1) 감쇠 조화 스프링 물리 (F = -k*x - c*v)
      const accel = -profile.stiffness * st.squash - profile.damping * st.squashVel
      st.squashVel += accel * dt
      st.squash += st.squashVel * dt

      // 2) 식감별 젤리/푸딩/바삭 워블 파동 감쇠
      st.wobblePhase += dt * profile.wobbleSpeed
      st.wobbleAmp = Math.max(0, st.wobbleAmp - dt * 0.42)

      // 3) 숨쉬기 아이들 탄성 + 터치 스쿼시&스트레치 합성 (부피 보존 법칙: Y가 줄면 X·Z가 팽창!)
      const idleBreath = Math.sin(t * 2.8) * 0.032
      const wobbleWave = Math.sin(st.wobblePhase) * st.wobbleAmp
      const sy = Math.max(0.58, Math.min(1.38, 1 - st.squash * 0.36 + idleBreath + wobbleWave * 0.45))
      const invSqrtY = 1 / Math.sqrt(sy)
      const sx = invSqrtY * (1 + wobbleWave * 0.25)
      const sz = invSqrtY * (1 - wobbleWave * 0.2)

      bodyGroup.scale.set(sx, sy, sz)
      // 바닥 접지면이 뜨지 않도록 Y 위치 보정
      bodyGroup.position.y = (sy - 1) * 0.65

      // 바삭 계열(두바이쿠키·탕후루·왁싱볼)은 터치 직후 고주파 크런치 떨림 추가
      const crispJitter = profile.kind === 'crispy' ? Math.sin(t * 55) * st.wobbleAmp * 0.18 : 0
      bodyGroup.rotation.z = Math.sin(st.wobblePhase * 0.8) * st.wobbleAmp * 0.35 + crispJitter

      // 왁싱볼/젤리 내부 과즙 코어 찰랑거림
      if (innerLiquid) {
        innerLiquid.rotation.z = -bodyGroup.rotation.z * 1.6 + Math.sin(t * 3.5) * 0.12
        innerLiquid.rotation.x = Math.cos(t * 2.9) * 0.1
      }

      // 4) 드래그 3D 회전 및 부드러운 원위치 복귀
      if (!st.isDragging) {
        st.targetRotY *= 0.92
        st.targetRotX *= 0.92
      }
      st.rotY += (st.targetRotY - st.rotY) * Math.min(1, dt * 12)
      st.rotX += (st.targetRotX - st.rotX) * Math.min(1, dt * 12)
      stageGroup.rotation.y = st.rotY + Math.sin(t * 0.9) * 0.08
      stageGroup.rotation.x = st.rotX

      // 5) 3D 파편 파티클 업데이트
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const c = crumbs[i]
        c.life += dt
        if (c.life >= c.maxLife) {
          scene.remove(c.mesh)
          crumbs.splice(i, 1)
          continue
        }
        c.vel.y -= 6.8 * dt
        c.mesh.position.addScaledVector(c.vel, dt)
        c.mesh.rotation.x += c.rotVel.x * dt
        c.mesh.rotation.y += c.rotVel.y * dt
        const s = 1 - c.life / c.maxLife
        c.mesh.scale.setScalar(Math.max(0.01, s))
      }

      renderer.render(scene, camera)
    }

    animId = requestAnimationFrame(animate)

    const ro = new ResizeObserver(() => {
      if (!el) return
      const nSide = fluid ? Math.min(el.clientWidth || 210, el.clientHeight || 210, 220) : Math.max(125, size || 200)
      camera.aspect = 1
      camera.updateProjectionMatrix()
      renderer.setSize(nSide, nSide)
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost)
      envTex.dispose()
      renderer.dispose()
      activeWebglContexts = Math.max(0, activeWebglContexts - 1)
    }
  }, [activeSpecies, dessertBase, paletteKey, look, onFallbackNeeded, size])

  if (webglFailed) return null

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        const profile = getPhysicsProfile(activeSpecies)
        const st = physRef.current
        st.isDragging = true
        st.lastX = e.clientX
        st.lastY = e.clientY
        // 터치하는 순간 꾹 눌리는 강한 말랑/크런치 임펄스 + 3D 파편 버스트!
        st.squashVel = profile.pokeImpulse
        st.wobbleAmp = profile.wobbleAmp
        st.spawnBurst = true
      }}
      onPointerMove={(e) => {
        const st = physRef.current
        if (!st.isDragging) return
        const dx = e.clientX - st.lastX
        const dy = e.clientY - st.lastY
        st.lastX = e.clientX
        st.lastY = e.clientY
        st.targetRotY = Math.max(-1.1, Math.min(1.1, st.targetRotY + dx * 0.012))
        st.targetRotX = Math.max(-0.45, Math.min(0.45, st.targetRotX + dy * 0.008))
      }}
      onPointerUp={() => {
        physRef.current.isDragging = false
      }}
      onPointerCancel={() => {
        physRef.current.isDragging = false
      }}
      style={{
        width: fluid ? '100%' : size,
        height: fluid ? '100%' : size,
        minHeight: fluid ? 150 : size,
        maxHeight: fluid ? 240 : size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
      }}
      title="손가락으로 꾹 누르거나 좌우로 돌려 3D 말랑·바삭 식감을 느껴보세요!"
    />
  )
}

