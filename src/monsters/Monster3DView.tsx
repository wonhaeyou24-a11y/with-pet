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
export function createPatisserieEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
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
export function build3DDessertBase(baseId: DessertBaseId): THREE.Group {
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
export function build3DCharacterMesh(
  species: string,
  look: MonsterLook & { mallang?: MallangCustom },
): { root: THREE.Group; bodyGroup: THREE.Group; innerLiquid?: THREE.Object3D; effectGroup?: THREE.Group } {
  const root = new THREE.Group()
  const bodyGroup = new THREE.Group()
  root.add(bodyGroup)

  const palIdx = look.mallang?.skinPalette ?? look.palette ?? 0
  const basePal = CHAMELEON_PALETTES[palIdx % CHAMELEON_PALETTES.length]
  let innerLiquid: THREE.Object3D | undefined

  // 종족 및 외형 성향에 따른 디저트 눈동자 색상 매핑
  const getEyeColor = (sp: string): string => {
    if (sp === 'dubai-cookie') return '#1A2312' // 쌉싸름한 피스타치오 다크
    if (sp === 'tanghulu' || sp === 'wax-ball') return '#181026' // 영롱한 유리알 딥블루
    if (sp === 'pudding') return '#2D1606' // 달콤한 카라멜 앰버
    if (sp === 'choco' || sp === 'smore' || sp === 'heugyeom') return '#1A0C08' // 진한 다크 카카오
    return '#24141A' // 포근한 로즈 초콜릿 (기본)
  }

  // 공통 3D 초롱초롱 눈 + 하이라이트 + 볼터치 + 입 부착 헬퍼 (8대 개성 눈매 시스템: mochi, heart, winking, smile, sleepy, sharp, star, round)
  const addCute3DFace = (zOffset: number, yOffset: number, cheekColor = '#FF8A9E') => {
    const faceGroup = new THREE.Group()
    faceGroup.position.set(0, yOffset, zOffset)

    // 종족 기본 성향 및 커스텀에 따른 풍부한 눈매 표정 매핑
    const expr = look.expression || (species === 'mochi' ? 'mochi-sparkle' : look.evoBranch === 'crispy-crunch' || look.evoBranch === 'royal-chef' ? 'sharp' : look.evoBranch === 'sweet-melty' ? 'sleepy' : 'round')
    const isRainbowStar = look.evoBranch === 'gourmet-rainbow' || expr === 'star'
    const eyeColor = getEyeColor(species)

    const eyeMat = new THREE.MeshPhysicalMaterial({ color: eyeColor, roughness: 0.08, clearcoat: 1.0 })
    const glintMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
    const heartMat = new THREE.MeshPhysicalMaterial({ color: '#FF4081', emissive: '#F50057', emissiveIntensity: 0.6 })
    const cheekMat = new THREE.MeshPhysicalMaterial({
      color: cheekColor,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85,
    })

    ;[-0.34, 0.34].forEach((xSide) => {
      const eyeGroup = new THREE.Group()
      eyeGroup.position.set(xSide, 0.06, 0)

      if (expr === 'mochi-sparkle' || (species === 'mochi' && expr === 'round')) {
        // 🍡 1. 모찌 전용 땡글 젤리눈: 투명한 앙금이 비치는 그라데이션 + 3단 입체 크리스탈 하이라이트
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.125, 24, 22), eyeMat)
        eye.scale.set(1.05, 1.15, 0.65)
        eyeGroup.add(eye)

        // 메인 상단 왕별빛 하이라이트
        const glint1 = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 12), glintMat)
        glint1.position.set(xSide * -0.035, 0.075, 0.075)
        eyeGroup.add(glint1)

        // 하단 달콤한 시럽 반사광 글린트
        const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), glintMat)
        glint2.position.set(xSide * 0.038, -0.02, 0.075)
        eyeGroup.add(glint2)

        const glint3 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), glintMat)
        glint3.position.set(xSide * -0.01, -0.045, 0.07)
        eyeGroup.add(glint3)
      } else if (expr === 'heart') {
        // 💖 2. 하트눈: 사랑에 푹 빠진 디저트 하트 보석 눈매
        const heartL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 12), heartMat)
        heartL.position.set(-0.035, 0.02, 0.05)
        eyeGroup.add(heartL)
        const heartR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 12), heartMat)
        heartR.position.set(0.035, 0.02, 0.05)
        eyeGroup.add(heartR)
        const heartTip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.12, 12), heartMat)
        heartTip.rotation.z = Math.PI
        heartTip.position.set(0, -0.045, 0.05)
        eyeGroup.add(heartTip)
      } else if (expr === 'winking' && xSide > 0) {
        // 😉 3. 윙크: 한쪽 눈은 감은 초승달 + 별빛 찡긋
        const wEye = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.024, 12, 24, Math.PI), eyeMat)
        wEye.rotation.z = Math.PI
        wEye.position.set(0, 0, 0.06)
        eyeGroup.add(wEye)
        // 윙크 별빛
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.038, 0), glintMat)
        star.position.set(0.08, 0.06, 0.08)
        eyeGroup.add(star)
      } else if (expr === 'sleepy') {
        // 😴 4. 슬리피 (포근한 반달 아치형 눈: 느긋하고 달콤하게 감긴 눈)
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 16), eyeMat)
        eye.scale.set(1.25, 0.45, 0.6)
        eye.rotation.z = -xSide * 0.12
        eyeGroup.add(eye)

        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), glintMat)
        glint.position.set(xSide * 0.04, -0.015, 0.055)
        eyeGroup.add(glint)
      } else if (expr === 'sharp') {
        // 😼 5. 샤프 (도도하고 카리스마 있는 캣아이: 위로 날렵한 눈매)
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 18), eyeMat)
        eye.scale.set(0.88, 1.25, 0.6)
        eye.rotation.z = (xSide > 0 ? 1 : -1) * 0.38
        eyeGroup.add(eye)

        const glint1 = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), glintMat)
        glint1.scale.set(0.7, 1.3, 0.8)
        glint1.position.set(xSide * -0.02, 0.08, 0.065)
        eyeGroup.add(glint1)
      } else if (isRainbowStar) {
        // ⭐ 6. 스타 레인보우 (십자 별빛 반짝이 눈)
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 22, 20), eyeMat)
        eye.scale.set(1.05, 1.15, 0.65)
        eyeGroup.add(eye)

        const starV = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.065, 0.02), glintMat)
        starV.position.set(xSide * -0.02, 0.05, 0.07)
        eyeGroup.add(starV)
        const starH = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.02, 0.02), glintMat)
        starH.position.set(xSide * -0.02, 0.05, 0.07)
        eyeGroup.add(starH)
      } else {
        // 🥺 7. 라운드 (기본 순수한 왕방울 눈: 듀얼 원형 하이라이트)
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 18), eyeMat)
        eye.scale.set(1, 1.08, 0.65)
        eyeGroup.add(eye)

        const glint1 = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), glintMat)
        glint1.position.set(xSide * -0.032, 0.07, 0.068)
        eyeGroup.add(glint1)

        const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), glintMat)
        glint2.position.set(xSide * 0.035, -0.015, 0.068)
        eyeGroup.add(glint2)
      }

      faceGroup.add(eyeGroup)

      // 말랑 볼터치 (찹쌀떡처럼 통통한 솜사탕 핑크)
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
  } else if (species === 'mochi') {
    // 🍡 8. [시그니처] 쫀득 찹쌀떡 모찌 3D:
    // 바닥에 쫀득하게 착 가라앉으며 퍼진 물방울 찹쌀떡 실루엣 + 뽀얀 전분가루 파우더 질감 + 속 앙금 코어 + 도드라진 쫀득 볼살
    const vividMochiColor = new THREE.Color(basePal.fur).lerp(new THREE.Color('#FF8DA8'), palIdx === 0 ? 0.35 : 0.15)
    const mochiMat = new THREE.MeshPhysicalMaterial({
      color: vividMochiColor,
      roughness: 0.28, // 뽀송뽀송한 전분 찹쌀가루 질감
      transmission: 0.28,
      thickness: 1.15,
      ior: 1.38,
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
      sheen: 1.0, // 표면에 묻어나는 하얀 찹쌀 파우더 광택
      sheenRoughness: 0.3,
      sheenColor: new THREE.Color('#FFFFFF'),
    })

    // 바닥에 넓고 쫀득하게 가라앉은 찹쌀떡 메인 반죽
    const mochiBody = new THREE.Mesh(new THREE.SphereGeometry(0.96, 44, 40), mochiMat)
    mochiBody.scale.set(1.18, 0.82, 1.14)
    mochiBody.position.y = -0.06
    bodyGroup.add(mochiBody)

    // 찹쌀떡 안쪽에 비치는 달콤한 팥/딸기 앙금 코어
    const beanFilling = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 24, 20),
      new THREE.MeshPhysicalMaterial({
        color: palIdx === 0 ? '#C2185B' : '#4E342E',
        roughness: 0.35,
        clearcoat: 0.3,
      }),
    )
    beanFilling.scale.set(1.05, 0.72, 0.95)
    beanFilling.position.set(0, -0.15, 0.05)
    bodyGroup.add(beanFilling)
    innerLiquid = beanFilling

    // 쫀득하게 양옆으로 도드라져 흘러내리는 찹쌀떡 볼살 몰드
    ;[-0.62, 0.62].forEach((xSide) => {
      const cheekJowl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 20), mochiMat)
      cheekJowl.scale.set(1.1, 0.85, 0.95)
      cheekJowl.position.set(xSide, -0.12, 0.45)
      bodyGroup.add(cheekJowl)

      // 앙증맞은 말랑 귀 & 찹쌀떡 손
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 16), mochiMat)
      ear.scale.set(1.1, 0.9, 0.85)
      ear.position.set(xSide * 0.92, 0.68, 0)
      bodyGroup.add(ear)

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 16), mochiMat)
      hand.scale.set(1.0, 0.8, 1.15)
      hand.position.set(xSide * 1.35, -0.16, 0.62)
      bodyGroup.add(hand)
    })

    // 포근한 우유빛 배 패치
    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(0.64, 32, 28),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF9', roughness: 0.35, clearcoat: 0.4 }),
    )
    belly.scale.set(1.08, 0.74, 0.42)
    belly.position.set(0, -0.22, 0.82)
    bodyGroup.add(belly)

    // 머리 위 똬리 생크림 쿠션 + 반짝이는 3D 생딸기 토핑
    const creamDollop = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.08, 14, 24),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF9', roughness: 0.25, clearcoat: 0.6 }),
    )
    creamDollop.rotation.x = Math.PI / 2
    creamDollop.position.set(0, 0.72, 0.05)
    bodyGroup.add(creamDollop)

    const topBerry = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.38, 20),
      new THREE.MeshPhysicalMaterial({ color: '#FF2E55', roughness: 0.12, clearcoat: 1.0 }),
    )
    topBerry.position.set(0, 0.92, 0.05)
    bodyGroup.add(topBerry)

    addCute3DFace(0.96, 0.08, '#FF8A9E')
  } else if (species === 'mongsil') {
    // ☁️ 9. 폭신폭신 구름 솜사탕 양 몽실 3D: 4중 솜사탕 털뭉치 구름 실루엣 + 마카롱 뿔
    const cottonMat = new THREE.MeshPhysicalMaterial({
      color: basePal.fur,
      roughness: 0.65,
      sheen: 1.0,
      sheenColor: new THREE.Color('#FFFFFF'),
      clearcoat: 0.15,
    })
    const mainBody = new THREE.Mesh(new THREE.SphereGeometry(0.92, 36, 32), cottonMat)
    bodyGroup.add(mainBody)

    // 4중 구름 솜사탕 털뭉치 메쉬들
    ;[
      [-0.45, 0.35, -0.2, 0.48],
      [0.45, 0.35, -0.2, 0.48],
      [0, 0.65, -0.25, 0.44],
      [-0.55, -0.15, 0.15, 0.42],
      [0.55, -0.15, 0.15, 0.42],
      [0, -0.35, -0.35, 0.46],
    ].forEach(([cx, cy, cz, cr]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(cr, 20, 18), cottonMat)
      puff.position.set(cx, cy, cz)
      bodyGroup.add(puff)
    })

    // 돌돌 말린 핑크빛 마카롱 양 뿔
    const hornMat = new THREE.MeshPhysicalMaterial({ color: '#F48FB1', roughness: 0.25, clearcoat: 0.8 })
    ;[-0.58, 0.58].forEach((xSide) => {
      const horn = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.065, 12, 24, Math.PI * 1.5), hornMat)
      horn.position.set(xSide, 0.72, 0)
      horn.rotation.y = xSide > 0 ? 0.3 : -0.3
      horn.rotation.z = xSide > 0 ? -0.2 : 0.2
      bodyGroup.add(horn)
    })

    addCute3DFace(0.88, 0.12, '#FF80AB')
  } else if (species === 'kongkong') {
    // 🌰 10. 도토리 쿠키 다람쥐 콩콩 3D: 커다란 도토리 깍지 모자 + 빵빵한 볼주머니 + 비스킷 꼬리
    const cookieMat = new THREE.MeshPhysicalMaterial({ color: '#8D6E63', roughness: 0.45, clearcoat: 0.2 })
    const mainBody = new THREE.Mesh(new THREE.SphereGeometry(0.9, 36, 32), cookieMat)
    bodyGroup.add(mainBody)

    // 커다란 3D 도토리 깍지 모자
    const acornCapMat = new THREE.MeshPhysicalMaterial({ color: '#4E342E', roughness: 0.65 })
    const acornCap = new THREE.Mesh(new THREE.SphereGeometry(0.85, 32, 20), acornCapMat)
    acornCap.scale.set(1.08, 0.48, 1.08)
    acornCap.position.set(0, 0.68, 0)
    bodyGroup.add(acornCap)

    const capStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.28, 12), acornCapMat)
    capStem.position.set(0, 1.02, 0)
    bodyGroup.add(capStem)

    // 빵빵한 도토리 볼주머니
    const cheekMat = new THREE.MeshPhysicalMaterial({ color: '#D7CCC8', roughness: 0.35 })
    ;[-0.52, 0.52].forEach((xSide) => {
      const pouch = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 18), cheekMat)
      pouch.position.set(xSide, -0.08, 0.52)
      bodyGroup.add(pouch)
    })

    // 등에 솟아오른 바삭한 비스킷 꼬리
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 20), cookieMat)
    tail.rotation.x = -Math.PI / 3.2
    tail.position.set(0, 0.2, -0.75)
    bodyGroup.add(tail)

    addCute3DFace(0.9, 0.1, '#FFAB91')
  } else if (species === 'byeolbineul') {
    // ✨ 11. 은하수 별사탕 아기 드래곤 별비늘 3D: 이마의 별자리 뿔 + 요정 날개 + 별사탕 꼬리
    const dragonMat = new THREE.MeshPhysicalMaterial({
      color: basePal.fur,
      transmission: 0.35,
      thickness: 1.0,
      roughness: 0.12,
      clearcoat: 1.0,
      sheen: 0.8,
      sheenColor: new THREE.Color('#80DEEA'),
    })
    const mainBody = new THREE.Mesh(new THREE.SphereGeometry(0.92, 40, 36), dragonMat)
    bodyGroup.add(mainBody)

    // 이마의 황금빛 크리스탈 별자리 뿔
    const hornMat = new THREE.MeshPhysicalMaterial({
      color: '#FFE082',
      emissive: '#FFB300',
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.1,
    })
    ;[-0.32, 0.32].forEach((xSide) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 12), hornMat)
      horn.position.set(xSide, 0.82, 0.25)
      horn.rotation.z = xSide > 0 ? -0.25 : 0.25
      horn.rotation.x = -0.15
      bodyGroup.add(horn)
    })

    // 등 뒤에 달린 반투명 요정 크리스탈 날개
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: '#E0F7FA',
      transmission: 0.8,
      roughness: 0.05,
      clearcoat: 1.0,
    })
    ;[-0.65, 0.65].forEach((xSide) => {
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 14), wingMat)
      wing.scale.set(0.3, 1.2, 0.7)
      wing.position.set(xSide, 0.25, -0.65)
      wing.rotation.y = xSide > 0 ? 0.35 : -0.35
      bodyGroup.add(wing)
    })

    // 꼬리 끝에 달린 반짝이는 별사탕 구슬
    const starBead = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), hornMat)
    starBead.position.set(0, -0.25, -0.95)
    bodyGroup.add(starBead)

    addCute3DFace(0.92, 0.12, '#80DEEA')
  } else if (species === 'heugyeom') {
    // 🔥 12. 다크초코 플람베 사자 흑염 3D: 8갈래 초콜릿 불꽃 갈기 + 붉은 용암 뿔
    const lionMat = new THREE.MeshPhysicalMaterial({ color: '#212121', roughness: 0.35, clearcoat: 0.5 })
    const mainBody = new THREE.Mesh(new THREE.SphereGeometry(0.92, 40, 36), lionMat)
    bodyGroup.add(mainBody)

    // 얼굴을 둘러싼 8갈래 다크초코 플람베 불꽃 갈기
    const maneMat = new THREE.MeshPhysicalMaterial({
      color: '#D84315',
      emissive: '#FF3D00',
      emissiveIntensity: 0.65,
      roughness: 0.2,
      clearcoat: 0.8,
    })
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 12), maneMat)
      flame.position.set(Math.cos(ang) * 0.95, Math.sin(ang) * 0.95, -0.15)
      flame.rotation.z = ang - Math.PI / 2
      bodyGroup.add(flame)
    }

    addCute3DFace(0.94, 0.1, '#FF3D00')
  } else {
    // 🦎 13. 말랑 카멜레온 & 클래식 체형 3D
    const vividMochiColor = new THREE.Color(basePal.fur).lerp(new THREE.Color('#FF8DA8'), palIdx === 0 ? 0.35 : 0.15)
    const mochiMat = new THREE.MeshPhysicalMaterial({
      color: vividMochiColor,
      roughness: 0.16,
      transmission: 0.25,
      thickness: 1.1,
      ior: 1.38,
      clearcoat: 0.9,
    })
    const mochiBody = new THREE.Mesh(new THREE.SphereGeometry(0.95, 44, 40), mochiMat)
    mochiBody.scale.set(1.06, 0.96, 1.02)
    mochiBody.position.y = 0.02
    bodyGroup.add(mochiBody)

    // 카멜레온 돌돌 말린 꼬리
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.12, 16, 32, Math.PI * 1.65), mochiMat)
    tail.position.set(0.82, -0.25, -0.35)
    bodyGroup.add(tail)

    addCute3DFace(0.92, 0.15, '#FF8A9E')
  }

  const effectGroup = add3DDecorations(bodyGroup, root, look)
  add3DEvolutionVisuals(bodyGroup, root, look)
  return { root, bodyGroup, innerLiquid, effectGroup: effectGroup || undefined }
}

// M4: 디저트 몬스터 3단계 진화 외형 & 4대 분기별 3D 비주얼 생성
function add3DEvolutionVisuals(
  bodyGroup: THREE.Group,
  rootGroup: THREE.Group,
  look: MonsterLook & { mallang?: MallangCustom },
) {
  const stage = look.evoStage ?? 1
  const branch = look.evoBranch || 'sweet-melty'
  if (stage < 2) return

  // 진화 단계별 3D 체형 스케일업
  const scaleMult = stage === 3 ? 1.28 : 1.14
  bodyGroup.scale.multiplyScalar(scaleMult)

  // 진화 분기별 고유 테마 색상
  const branchColor =
    branch === 'sweet-melty'
      ? '#FF4081'
      : branch === 'crispy-crunch'
        ? '#FF9800'
        : branch === 'royal-chef'
          ? '#7C4DFF'
          : '#00B0FF'

  // 1. 발밑 진화 마법진 / 아우라 링 (Stage 2 & 3 공통)
  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 1.48, 36),
    new THREE.MeshBasicMaterial({
      color: branchColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: stage === 3 ? 0.85 : 0.55,
    }),
  )
  auraRing.rotation.x = -Math.PI / 2
  auraRing.position.y = -0.85
  rootGroup.add(auraRing)

  // 2. 2단계 파티세리 외형
  if (stage === 2) {
    if (branch === 'crispy-crunch') {
      // 황금 카다이프 링 머리 장식
      const crunchTorus = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.12, 16, 32),
        new THREE.MeshStandardMaterial({ color: '#FFA726', roughness: 0.85, metalness: 0.2 }),
      )
      crunchTorus.rotation.x = Math.PI / 2
      crunchTorus.position.y = 1.08
      bodyGroup.add(crunchTorus)
    } else if (branch === 'royal-chef') {
      // 미니 파티세리 셰프 햇
      const chefHat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.28, 0.42, 20),
        new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', roughness: 0.3, clearcoat: 0.4 }),
      )
      chefHat.position.y = 1.15
      bodyGroup.add(chefHat)
    } else {
      // 달콤/레인보우: 핑크 글레이즈 리본
      const ribbon = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.08, 12, 24),
        new THREE.MeshPhysicalMaterial({ color: branchColor, roughness: 0.15, clearcoat: 1.0 }),
      )
      ribbon.rotation.x = Math.PI / 2.3
      ribbon.position.y = 1.1
      bodyGroup.add(ribbon)
    }
  }

  // 3. 3단계 로얄 마스터 외형 (웅장한 3D 황금 크라운 + 5대 보석 첨탑 + 공전 궤도)
  if (stage === 3) {
    const crownGroup = new THREE.Group()
    crownGroup.position.set(0, 1.25, 0)

    // 왕관 밑단 골드 링
    const crownBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.48, 0.16, 24),
      new THREE.MeshPhysicalMaterial({ color: '#FFD700', metalness: 0.85, roughness: 0.15, clearcoat: 1.0 }),
    )
    crownGroup.add(crownBase)

    // 왕관 5개 뾰족 첨탑 & 보석
    for (let i = 0; i < 5; i++) {
      const angle = (i * (Math.PI * 2)) / 5
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.35, 12),
        new THREE.MeshPhysicalMaterial({ color: '#FFD700', metalness: 0.9, roughness: 0.1 }),
      )
      spike.position.set(Math.cos(angle) * 0.46, 0.22, Math.sin(angle) * 0.46)
      crownGroup.add(spike)

      // 첨탑 꼭대기 루비/사파이어 보석
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.08, 0),
        new THREE.MeshPhysicalMaterial({
          color: i % 2 === 0 ? branchColor : '#FF1744',
          metalness: 0.3,
          roughness: 0.05,
          transmission: 0.8,
        }),
      )
      gem.position.set(Math.cos(angle) * 0.46, 0.42, Math.sin(angle) * 0.46)
      crownGroup.add(gem)
    }
    bodyGroup.add(crownGroup)

    // 회전하는 3D 오로라 궤도 링
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.05, 16, 48),
      new THREE.MeshBasicMaterial({ color: branchColor, transparent: true, opacity: 0.7 }),
    )
    halo.rotation.x = Math.PI / 2.6
    halo.position.y = 0.5
    bodyGroup.add(halo)
  }
}

// 7칸 꾸미기 장신구 & 만능 날개 3D 메쉬 생성 및 부착
function add3DDecorations(
  bodyGroup: THREE.Group,
  rootGroup: THREE.Group,
  look: MonsterLook & { mallang?: MallangCustom },
) {
  // 말랑 커스텀의 장신구를 최우선으로 적용 (장착 해제 null 반영)
  const deco = look.mallang?.decorations ?? look.decorations
  const wingKind = look.mallang?.wingKind

  // 1. 머리 장식 (head) - 1.4~1.6배 크고 돋보이도록 스케일업
  if (deco?.head === 'wizard-hat') {
    const hatGroup = new THREE.Group()
    hatGroup.position.set(0, 0.98, 0)
    // 챙 (스케일업 1.15)
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 0.08, 24),
      new THREE.MeshPhysicalMaterial({ color: '#4A148C', roughness: 0.35, clearcoat: 0.6 }),
    )
    hatGroup.add(brim)
    // 고깔
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.72, 1.45, 24),
      new THREE.MeshPhysicalMaterial({ color: '#6A1B9A', roughness: 0.3, clearcoat: 0.7 }),
    )
    cone.position.y = 0.72
    cone.rotation.z = -0.09
    hatGroup.add(cone)
    // 꼭대기 황금별 (빛나는 대형 별)
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshPhysicalMaterial({ color: '#FFD700', metalness: 0.9, roughness: 0.15, emissive: '#FFC107', emissiveIntensity: 0.35 }),
    )
    star.position.set(-0.12, 1.46, 0)
    hatGroup.add(star)
    bodyGroup.add(hatGroup)
  } else if (deco?.head === 'star-crown') {
    const crownGroup = new THREE.Group()
    crownGroup.position.set(0, 1.05, 0)
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.52, 0.44, 5, 1, true),
      new THREE.MeshPhysicalMaterial({ color: '#FFC107', metalness: 0.92, roughness: 0.15, clearcoat: 1.0 }),
    )
    crownGroup.add(crown)
    // 보석 알갱이 장식 5개
    for (let ci = 0; ci < 5; ci++) {
      const ang = (ci / 5) * Math.PI * 2
      const gem = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshPhysicalMaterial({ color: ci % 2 === 0 ? '#E91E63' : '#00E5FF', emissive: '#FF4081', emissiveIntensity: 0.2 }),
      )
      gem.position.set(Math.sin(ang) * 0.62, 0.22, Math.cos(ang) * 0.62)
      crownGroup.add(gem)
    }
    bodyGroup.add(crownGroup)
  } else if (deco?.head === 'cream-cherry') {
    const cherryGroup = new THREE.Group()
    cherryGroup.position.set(0, 0.98, 0)
    const cream = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.16, 16, 28),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF9', roughness: 0.25, clearcoat: 0.9 }),
    )
    cream.rotation.x = Math.PI / 2
    cherryGroup.add(cream)
    const cherry = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 22, 20),
      new THREE.MeshPhysicalMaterial({ color: '#D50000', roughness: 0.1, clearcoat: 1.0 }),
    )
    cherry.position.y = 0.32
    cherryGroup.add(cherry)
    // 체리 꼭지
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8),
      new THREE.MeshPhysicalMaterial({ color: '#2E7D32', roughness: 0.4 }),
    )
    stem.position.set(0.08, 0.55, 0)
    stem.rotation.z = -0.3
    cherryGroup.add(stem)
    bodyGroup.add(cherryGroup)
  } else if (deco?.head === 'birthday-candle') {
    const candleGroup = new THREE.Group()
    candleGroup.position.set(0, 0.96, 0)
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.75, 16),
      new THREE.MeshPhysicalMaterial({ color: '#FF4081', roughness: 0.3 }),
    )
    candle.position.y = 0.38
    candleGroup.add(candle)
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 12),
      new THREE.MeshBasicMaterial({ color: '#FFEB3B' }),
    )
    flame.scale.set(0.9, 1.6, 0.9)
    flame.position.y = 0.85
    candleGroup.add(flame)
    bodyGroup.add(candleGroup)
  } else if (deco?.head === 'berry-beret') {
    const beret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 0.62, 0.32, 24),
      new THREE.MeshPhysicalMaterial({ color: '#C2185B', roughness: 0.4, clearcoat: 0.3 }),
    )
    beret.position.set(0.1, 1.02, 0)
    beret.rotation.z = -0.18
    bodyGroup.add(beret)
  }

  // 2. 얼굴 장식 (face) - 1.5배 큼직하게
  if (deco?.face === 'alchemy-glasses') {
    const glassesGroup = new THREE.Group()
    glassesGroup.position.set(0, 0.2, 0.98)
    const glassFrameMat = new THREE.MeshPhysicalMaterial({ color: '#FFD700', metalness: 0.95, roughness: 0.15, clearcoat: 1.0 })
    const lensMat = new THREE.MeshPhysicalMaterial({ color: '#80DEEA', transmission: 0.65, opacity: 0.85, transparent: true, roughness: 0.05 })
    ;[-0.42, 0.42].forEach((gx) => {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 14, 28), glassFrameMat)
      rim.position.x = gx
      glassesGroup.add(rim)
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), lensMat)
      lens.position.x = gx
      glassesGroup.add(lens)
    })
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.32, 8), glassFrameMat)
    bridge.rotation.z = Math.PI / 2
    bridge.position.y = 0.02
    glassesGroup.add(bridge)
    bodyGroup.add(glassesGroup)
  } else if (deco?.face === 'sleep-mask') {
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.36, 0.12),
      new THREE.MeshPhysicalMaterial({ color: '#81D4FA', roughness: 0.35, clearcoat: 0.5 }),
    )
    mask.position.set(0, 0.35, 0.96)
    bodyGroup.add(mask)
  } else if (deco?.face === 'star-patch') {
    // 🌟 유성 별빛 스티커 3D: 양 볼에 입체적인 골드 스타 패치 & 반짝임 큐브
    const patchGroup = new THREE.Group()
    const starMat = new THREE.MeshPhysicalMaterial({
      color: '#FFE082',
      emissive: '#FFB300',
      emissiveIntensity: 0.85,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
    })
    ;[-0.48, 0.48].forEach((xSide) => {
      // 볼 중앙의 메인 스타
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), starMat)
      star.position.set(xSide, 0.04, 0.92)
      star.rotation.z = xSide > 0 ? 0.25 : -0.25
      patchGroup.add(star)

      // 양옆 보조 반짝임 별
      const subStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), starMat)
      subStar.position.set(xSide * 1.28, 0.14, 0.86)
      patchGroup.add(subStar)
    })

    // 펫 주변으로 사르르 반짝이며 공전하는 4개의 3D 유성 별빛 파티클
    const patchOrbitStars = new THREE.Group()
    patchOrbitStars.name = 'patchOrbitStars'
    for (let si = 0; si < 4; si++) {
      const ang = (si / 4) * Math.PI * 2
      const fStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), starMat)
      fStar.position.set(Math.cos(ang) * 1.35, 0.05 + (si % 2) * 0.22, Math.sin(ang) * 1.35)
      patchOrbitStars.add(fStar)
    }
    patchGroup.add(patchOrbitStars)

    bodyGroup.add(patchGroup)
  }

  // 3. 목 장식 (neck) - 풍성한 볼륨감
  if (deco?.neck === 'rune-scarf') {
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.22, 16, 32),
      new THREE.MeshPhysicalMaterial({ color: '#C2185B', roughness: 0.4 }),
    )
    scarf.rotation.x = Math.PI / 2
    scarf.position.set(0, -0.32, 0.05)
    bodyGroup.add(scarf)
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.85, 0.12),
      new THREE.MeshPhysicalMaterial({ color: '#AD1457', roughness: 0.4 }),
    )
    tail.position.set(0.42, -0.68, 0.82)
    tail.rotation.z = -0.22
    bodyGroup.add(tail)
  } else if (deco?.neck === 'bell-ribbon' || deco?.neck === 'pretzel-ribbon') {
    const ribbon = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.16, 16, 32),
      new THREE.MeshPhysicalMaterial({ color: '#E53935', roughness: 0.25, clearcoat: 0.8 }),
    )
    ribbon.rotation.x = Math.PI / 2
    ribbon.position.set(0, -0.32, 0.05)
    bodyGroup.add(ribbon)
    // 큼직한 황금 방울
    const bell = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 18, 16),
      new THREE.MeshPhysicalMaterial({ color: '#FFD700', metalness: 0.95, roughness: 0.1, clearcoat: 1.0 }),
    )
    bell.position.set(0, -0.42, 0.92)
    bodyGroup.add(bell)
  }

  // 4. 등 장식 & 만능 날개 (back / wingKind) - 대형 날개 연출
  const activeWing = deco?.back === 'meteor-wings' ? 'angel' : deco?.back === 'syrup-glider-blades' ? 'syrup-glider' : wingKind
  if (activeWing && activeWing !== 'none') {
    const isSyrupGlider = activeWing === 'syrup-glider'
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: isSyrupGlider ? '#FFA000' : activeWing.includes('devil') ? '#311B92' : activeWing.includes('crystal') ? '#00E5FF' : '#FFF9C4',
      roughness: 0.1,
      transmission: 0.65,
      thickness: 1.2,
      clearcoat: 1.0,
      emissive: isSyrupGlider ? '#FF8F00' : activeWing.includes('crystal') ? '#00B0FF' : '#FFF59D',
      emissiveIntensity: 0.35,
    })
    ;[-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.3, isSyrupGlider ? 0.45 : 0.75, 0.08), wingMat)
      wing.position.set(side * 1.25, 0.35, -0.55)
      wing.rotation.y = side * 0.4
      wing.rotation.z = side * 0.28
      bodyGroup.add(wing)
    })
  } else if (deco?.back === 'explorer-pack') {
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.95, 0.48),
      new THREE.MeshPhysicalMaterial({ color: '#795548', roughness: 0.5, clearcoat: 0.3 }),
    )
    pack.position.set(0, 0.08, -1.05)
    bodyGroup.add(pack)
  }

  // 5. 손 장식 (hand) - 큼직한 무기/지팡이/마도서/방패
  if (deco?.hand === 'golden-recipe-grimoire') {
    // 📖 황금 레시피 마도서 3D
    const bookGroup = new THREE.Group()
    bookGroup.position.set(1.1, -0.05, 0.7)
    bookGroup.rotation.y = -0.35
    // 표지
    const cover = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.95, 0.16),
      new THREE.MeshPhysicalMaterial({ color: '#FFB300', metalness: 0.85, roughness: 0.2, clearcoat: 0.9 }),
    )
    bookGroup.add(cover)
    // 책 속지
    const pages = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.88, 0.13),
      new THREE.MeshPhysicalMaterial({ color: '#FFFDF0', roughness: 0.7 }),
    )
    pages.position.set(0.04, 0, 0)
    bookGroup.add(pages)
    // 표지 황금 룬 보석
    const rune = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshPhysicalMaterial({ color: '#E91E63', emissive: '#FF4081', emissiveIntensity: 0.6 }),
    )
    rune.position.set(0, 0, 0.1)
    bookGroup.add(rune)
    bodyGroup.add(bookGroup)
  } else if (deco?.hand === 'crystal-sugar-shield') {
    // 🛡️ 슈가 크리스탈 방패 3D
    const shieldGroup = new THREE.Group()
    shieldGroup.position.set(1.15, -0.05, 0.75)
    shieldGroup.rotation.y = -0.2
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: '#80DEEA',
      roughness: 0.05,
      transmission: 0.75,
      thickness: 1.0,
      clearcoat: 1.0,
      emissive: '#00E5FF',
      emissiveIntensity: 0.3,
    })
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.5, 0.1, 6), shieldMat)
    shield.rotation.x = Math.PI / 2
    shieldGroup.add(shield)
    // 방패 중앙 엠블럼
    const emblem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshPhysicalMaterial({ color: '#FFD700', metalness: 0.95, roughness: 0.1 }),
    )
    emblem.position.set(0, 0, 0.08)
    shieldGroup.add(emblem)
    bodyGroup.add(shieldGroup)
  } else if (deco?.hand === 'lantern-staff' || deco?.hand === 'star-wand' || deco?.hand === 'lollipop-wand') {
    const handGroup = new THREE.Group()
    handGroup.position.set(1.15, -0.05, 0.75)
    // 지팡이 자루
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.65, 12),
      new THREE.MeshPhysicalMaterial({ color: '#5D4037', roughness: 0.35 }),
    )
    shaft.position.y = 0.25
    handGroup.add(shaft)
    // 꼭대기 헤드 (등불/별/대형 롤리팝 사탕)
    if (deco.hand === 'lantern-staff') {
      const lantern = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshPhysicalMaterial({ color: '#FFD54F', roughness: 0.1, clearcoat: 1.0, emissive: '#FF8F00', emissiveIntensity: 0.6 }),
      )
      lantern.position.y = 1.05
      handGroup.add(lantern)
    } else if (deco.hand === 'lollipop-wand') {
      const pop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.12, 24),
        new THREE.MeshPhysicalMaterial({ color: '#FF4081', roughness: 0.2, clearcoat: 1.0 }),
      )
      pop.rotation.x = Math.PI / 2
      pop.position.y = 1.02
      handGroup.add(pop)
    } else {
      const starHead = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshPhysicalMaterial({ color: '#FFEB3B', metalness: 0.9, roughness: 0.15, emissive: '#FFC107', emissiveIntensity: 0.5 }),
      )
      starHead.position.y = 1.02
      handGroup.add(starHead)
    }
    bodyGroup.add(handGroup)
  }

  // 6. 이펙트 장식 (effect) - 펫을 가리지 않고 뒤에서 위로 뿜어지는 포스 아우라 & 머리 위 끊임없이 도는 천사 고리 & 반짝이는 별빛 공전
  let effectGroup: THREE.Group | null = null

  if (deco?.effect === 'constellation-aura' || deco?.effect === 'aura-galaxy-orbit') {
    const isGalaxy = deco?.effect === 'aura-galaxy-orbit'
    effectGroup = new THREE.Group()

    // ✨ 1) [펫 머리 위 천사의 엔젤링 고리 (Angel Halo)]
    // 펫 몸통통을 가리지 않고 머리 위 정수리에 비스듬히 떠서 끊임없이 360도 회전!
    const haloMat = new THREE.MeshPhysicalMaterial({
      color: isGalaxy ? '#E1BEE7' : '#FFF59D',
      emissive: isGalaxy ? '#BA68C8' : '#FFD700',
      emissiveIntensity: 0.95,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.95,
    })
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.042, 16, 48), haloMat)
    halo.name = 'angelHalo'
    halo.position.set(0, 1.34, 0.05)
    halo.rotation.x = Math.PI / 4.2
    effectGroup.add(halo)

    // 🌟 2) [위로 뿜어져 올라오는 포스 형태의 밝은 빛 (Ascending Radiant Force Aura)]
    // 펫의 몸통통을 가리지 않도록 펫 뒤편(-0.45)에 배치되어 바닥에서부터 하늘로 솟구치는 환한 에너지 빔!
    const forceGroup = new THREE.Group()
    forceGroup.name = 'forceAura'
    forceGroup.position.set(0, 0.2, -0.42)

    const beamColor = isGalaxy ? '#BA68C8' : '#FFCA28'
    const forceBeamMat = new THREE.MeshBasicMaterial({
      color: beamColor,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // 위로 넓어지는 원뿔형 솟구치는 빛기둥 (1차 코어 빔)
    const beam1 = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 0.45, 2.4, 32, 1, true), forceBeamMat)
    beam1.position.y = 0.35
    forceGroup.add(beam1)

    // 반대 결로 교차하는 서브 포스 빔 (2차 외곽 광배)
    const subBeamMat = new THREE.MeshBasicMaterial({
      color: isGalaxy ? '#4DD0E1' : '#FF80AB',
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const beam2 = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 0.65, 2.6, 24, 1, true), subBeamMat)
    beam2.position.y = 0.45
    forceGroup.add(beam2)

    // 바닥에서부터 솟구치는 원형 방사 에너지 링
    const basePulseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 1.45, 32),
      new THREE.MeshBasicMaterial({
        color: beamColor,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    )
    basePulseRing.rotation.x = -Math.PI / 2
    basePulseRing.position.y = -0.75
    forceGroup.add(basePulseRing)

    effectGroup.add(forceGroup)

    // 🪐 3) [펫 주변을 반짝이며 공전하는 별빛 입자들 (Twinkling Stardust Orbit)]
    const orbitStarsGroup = new THREE.Group()
    orbitStarsGroup.name = 'orbitStars'
    const starMat = new THREE.MeshPhysicalMaterial({
      color: isGalaxy ? '#E0F7FA' : '#FFF9C4',
      emissive: isGalaxy ? '#00E5FF' : '#FFD700',
      emissiveIntensity: 0.95,
      metalness: 0.9,
      roughness: 0.1,
    })

    const starCount = isGalaxy ? 7 : 6
    for (let i = 0; i < starCount; i++) {
      const ang = (i / starCount) * Math.PI * 2
      const rad = 1.65 + (i % 3) * 0.22
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(i % 2 === 0 ? 0.13 : 0.08, 0), starMat)
      star.position.set(Math.cos(ang) * rad, -0.3 + (i % 4) * 0.28, Math.sin(ang) * rad)
      orbitStarsGroup.add(star)
    }
    effectGroup.add(orbitStarsGroup)

    rootGroup.add(effectGroup)
  } else if (deco?.effect === 'blossom-breeze') {
    effectGroup = new THREE.Group()
    effectGroup.position.y = 0.2
    const petalMat = new THREE.MeshPhysicalMaterial({
      color: '#F8BBD0',
      emissive: '#EC4899',
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      roughness: 0.3,
    })
    for (let pi = 0; pi < 7; pi++) {
      const ang = (pi / 7) * Math.PI * 2
      const rad = 1.35 + (pi % 3) * 0.25
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), petalMat)
      petal.scale.set(1.4, 0.28, 0.8)
      petal.position.set(Math.cos(ang) * rad, -0.4 + (pi % 4) * 0.35, Math.sin(ang) * rad)
      petal.rotation.set(0.3 * pi, 0.5 * pi, 0.2 * pi)
      effectGroup.add(petal)
    }
    rootGroup.add(effectGroup)
  } else if (deco?.effect === 'footprint-honey-dew') {
    effectGroup = new THREE.Group()
    const honeyMat = new THREE.MeshPhysicalMaterial({
      color: '#FFB300',
      emissive: '#FFA000',
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      clearcoat: 1.0,
    })
    for (let hi = 0; hi < 6; hi++) {
      const ang = (hi / 6) * Math.PI * 2
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), honeyMat)
      drop.scale.set(0.8, 1.3, 0.8)
      drop.position.set(Math.cos(ang) * 1.3, -0.65, Math.sin(ang) * 1.3)
      effectGroup.add(drop)
    }
    rootGroup.add(effectGroup)
  }

  return effectGroup
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

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30)
    camera.position.set(0, 0.22, 5.25)
    camera.lookAt(0, -0.28, 0)

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

    // 3D 플레이팅 받침대 + 3D 디저트 캐릭터 조립 (위쪽 짤림 방지: 살짝 아래로 내려 넉넉한 헤드룸 확보)
    const stageGroup = new THREE.Group()
    stageGroup.position.y = -0.16
    scene.add(stageGroup)

    const baseGroup = build3DDessertBase(dessertBase)
    stageGroup.add(baseGroup)

    const { root: charRoot, bodyGroup, innerLiquid, effectGroup } = build3DCharacterMesh(activeSpecies, look)
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

      // 4) 360도 자유 드래그 3D 회전 (수평 회전 각도 보존 & 수직 미세 댐핑)
      if (!st.isDragging) {
        st.targetRotX *= 0.92
      }
      st.rotY += (st.targetRotY - st.rotY) * Math.min(1, dt * 12)
      st.rotX += (st.targetRotX - st.rotX) * Math.min(1, dt * 12)
      stageGroup.rotation.y = st.rotY + Math.sin(t * 0.9) * 0.05
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

      // 6) 3D 신비로운 아우라: 끊임없이 360도 회전하는 천사 엔젤링 고리 & 위로 뿜어지는 포스 빛기둥 & 공전 별빛
      if (effectGroup) {
        const angelHalo = effectGroup.getObjectByName('angelHalo')
        if (angelHalo) {
          // 천사의 고리는 머리 위에서 끊임없이 360도 연속 회전
          angelHalo.rotation.y += dt * 2.4
          angelHalo.rotation.z += dt * 1.8
          angelHalo.position.y = 1.34 + Math.sin(t * 3.2) * 0.04
        }

        const forceAura = effectGroup.getObjectByName('forceAura')
        if (forceAura) {
          // 펫 뒤편 바닥에서부터 위로 뿜어져 올라오는 포스 펄스
          const pulseY = 1.0 + Math.sin(t * 4.2) * 0.12
          const pulseXZ = 1.0 + Math.sin(t * 2.8) * 0.06
          forceAura.scale.set(pulseXZ, pulseY, pulseXZ)
          forceAura.rotation.y += dt * 0.4
        }

        const orbitStars = effectGroup.getObjectByName('orbitStars')
        if (orbitStars) {
          // 펫 주변을 반짝이며 공전하는 별빛 입자들
          orbitStars.rotation.y += dt * 1.25
          orbitStars.rotation.x = Math.sin(t * 1.5) * 0.1
        }

        // 전체 이펙트 그룹의 은은한 부유 애니메이션
        effectGroup.position.y = Math.sin(t * 2.4) * 0.03
      }

      // 유성 별빛 스티커 파티클 실시간 공전 & 반짝임
      const patchOrbit = bodyGroup.getObjectByName('patchOrbitStars')
      if (patchOrbit) {
        patchOrbit.rotation.y += dt * 1.8
        patchOrbit.position.y = Math.sin(t * 3.5) * 0.04
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
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // ignore
        }
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
        // 360도 무한 자유 회전 (좌우 제한 없이 부드럽게 360° 확인 가능)
        st.targetRotY += dx * 0.016
        st.targetRotX = Math.max(-0.6, Math.min(0.6, st.targetRotX + dy * 0.008))
      }}
      onPointerUp={(e) => {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          // ignore
        }
        physRef.current.isDragging = false
      }}
      onPointerCancel={(e) => {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {
          // ignore
        }
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

