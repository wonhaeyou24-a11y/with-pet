// 🐉 Stitch MCP 디자인 반영: 마그마 초코 퐁듀 슈가 드래곤 (Magma Choco Fondue Sugar Dragon)
// - [거대 보스 전용 3D WebGL 렌더러]
// - [화산 다크초콜릿 크러스트 바디 + 끓어오르는 마그마 퐁듀 시럽]
// - [슈가 크리스탈 드래곤 뿔 & 등 가시]
// - [실시간 날개짓 애니메이션을 갖춘 설탕 글레이즈 날개]
// - [피격 흔들림 & 용암 초코 파편 튀김 물리 반응]

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { Pose } from '../ui/BattleFighter'

interface Props {
  size?: number
  pose?: Pose | 'idle' | 'attack' | 'hit' | 'down'
  hitKey?: number
  flash?: boolean
}

export default function WorldBoss3DView({
  size = 180,
  pose = 'idle',
  hitKey = 0,
  flash = false,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const leftWingRef = useRef<THREE.Group | null>(null)
  const rightWingRef = useRef<THREE.Group | null>(null)
  const headGroupRef = useRef<THREE.Group | null>(null)
  const lavaCoreRef = useRef<THREE.Mesh | null>(null)
  const bossGroupRef = useRef<THREE.Group | null>(null)
  const hitImpulseRef = useRef<number>(0)

  // 피격 시 물리 충격 반응
  useEffect(() => {
    if (hitKey > 0) {
      hitImpulseRef.current = 1.0
    }
  }, [hitKey])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // 1. Three.js Scene, Camera, Renderer 초기화
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(0, 0.4, 4.4)
    camera.lookAt(0, 0.1, 0)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(size, size)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.3
      container.appendChild(renderer.domElement)
    } catch {
      // WebGL 미지원 시 무중단 폴백
      return
    }

    // 2. 조명 시스템: 마그마 화염광 + 스튜디오 키라이트
    const ambientLight = new THREE.AmbientLight(0xffecd1, 0.75)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffb74d, 1.4)
    keyLight.position.set(2, 4, 3)
    scene.add(keyLight)

    const magmaUpLight = new THREE.PointLight(0xff3d00, 2.8, 8)
    magmaUpLight.position.set(0, -1.2, 1)
    scene.add(magmaUpLight)

    const rimLight = new THREE.PointLight(0xff80ab, 1.8, 6)
    rimLight.position.set(-2, 2, -2)
    scene.add(rimLight)

    // 3. 보스 메인 그룹
    const bossGroup = new THREE.Group()
    bossGroupRef.current = bossGroup
    scene.add(bossGroup)

    // 재질(Materials)
    // 🍫 다크초콜릿 화산 암석 몸체 (거친 초콜릿 질감 & 은은한 광택)
    const chocoCrustMat = new THREE.MeshStandardMaterial({
      color: 0x2b150c,
      roughness: 0.68,
      metalness: 0.18,
    })

    // 🔥 끓어오르는 마그마 퐁듀 시럽 재질 (발광 & 고광택)
    const magmaFondueMat = new THREE.MeshStandardMaterial({
      color: 0xff3d00,
      emissive: 0xd50000,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.4,
    })
    lavaCoreRef.current = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), magmaFondueMat)

    // ✨ 설탕 크리스탈 뿔 & 등 가시 재질 (투명도 & 글레이즈드 굴절)
    const sugarCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xffd54f,
      emissive: 0xff6f00,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      transmission: 0.7,
      thickness: 0.8,
      ior: 1.52,
    })

    // 🪽 설탕 글레이즈 드래곤 날개 재질
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xff8a80,
      emissive: 0xc2185b,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      transmission: 0.55,
      thickness: 0.5,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    })

    // 3-1. 하체 & 화산 퐁듀 분화구 몸통 (Torso)
    const bodyGroup = new THREE.Group()
    const mainTorso = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 24, 20),
      chocoCrustMat
    )
    mainTorso.scale.set(1.15, 0.95, 1.0)
    mainTorso.position.set(0, -0.15, 0)
    bodyGroup.add(mainTorso)

    // 가슴 중앙에 흐르는 마그마 퐁듀 코어
    const chestLava = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 18, 18),
      magmaFondueMat
    )
    chestLava.position.set(0, -0.05, 0.52)
    chestLava.scale.set(0.9, 1.2, 0.5)
    bodyGroup.add(chestLava)

    // 배 부분 3줄의 용암 리지 (Lava Stripes)
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.55 - i * 0.08, 0.045, 8, 24, Math.PI * 0.7),
        magmaFondueMat
      )
      stripe.position.set(0, -0.32 + i * 0.15, 0.48 - i * 0.05)
      stripe.rotation.x = Math.PI * 0.55
      stripe.rotation.z = Math.PI * 0.15
      bodyGroup.add(stripe)
    }

    // 등 뒤 슈가 크리스탈 가시 4개
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.09 + i * 0.02, 0.35 + i * 0.06, 6),
        sugarCrystalMat
      )
      spike.position.set(0, 0.35 - i * 0.22, -0.65 + i * 0.1)
      spike.rotation.x = -Math.PI * 0.45 - i * 0.1
      bodyGroup.add(spike)
    }

    // 굵고 묵직한 드래곤 발 (Left & Right)
    const legGeo = new THREE.CylinderGeometry(0.18, 0.26, 0.42, 12)
    const leftLeg = new THREE.Mesh(legGeo, chocoCrustMat)
    leftLeg.position.set(-0.62, -0.72, 0.2)
    leftLeg.rotation.z = 0.25
    bodyGroup.add(leftLeg)

    const rightLeg = new THREE.Mesh(legGeo, chocoCrustMat)
    rightLeg.position.set(0.62, -0.72, 0.2)
    rightLeg.rotation.z = -0.25
    bodyGroup.add(rightLeg)

    // 날카로운 골든 슈가 발톱 6개
    for (let s = -1; s <= 1; s += 2) {
      for (let c = 0; c < 3; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.14, 5), sugarCrystalMat)
        claw.position.set(s * 0.62 + (c - 1) * 0.09, -0.92, 0.38)
        claw.rotation.x = Math.PI * 0.45
        bodyGroup.add(claw)
      }
    }

    bossGroup.add(bodyGroup)

    // 3-2. 머리 그룹 (Head Group & Horns & Eyes)
    const headGroup = new THREE.Group()
    headGroupRef.current = headGroup
    headGroup.position.set(0, 0.65, 0.25)

    // 드래곤 두상 (박력 있는 쐐기형 머리)
    const headBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.48, 0.68),
      chocoCrustMat
    )
    headBase.position.set(0, 0, 0.1)
    headGroup.add(headBase)

    // 턱 & 주둥이 (Snout)
    const snout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.28, 0.45, 8),
      chocoCrustMat
    )
    snout.rotation.x = Math.PI * 0.5
    snout.position.set(0, -0.06, 0.48)
    headGroup.add(snout)

    // 콧등 위 마그마 퐁듀 분화구
    const snoutLava = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      magmaFondueMat
    )
    snoutLava.position.set(0, 0.06, 0.56)
    headGroup.add(snoutLava)

    // 거대 슈가 크리스탈 드래곤 뿔 (좌우 한 쌍)
    const leftHorn = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.65, 7),
      sugarCrystalMat
    )
    leftHorn.position.set(-0.35, 0.4, -0.08)
    leftHorn.rotation.z = 0.55
    leftHorn.rotation.x = -0.35
    headGroup.add(leftHorn)

    const rightHorn = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.65, 7),
      sugarCrystalMat
    )
    rightHorn.position.set(0.35, 0.4, -0.08)
    rightHorn.rotation.z = -0.55
    rightHorn.rotation.x = -0.35
    headGroup.add(rightHorn)

    // 이글거리는 앰버 골드 눈동자 (좌우)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd600 })
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), eyeMat)
    leftEye.position.set(-0.28, 0.08, 0.32)
    leftEye.scale.set(0.7, 1.2, 0.8)
    headGroup.add(leftEye)

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), eyeMat)
    rightEye.position.set(0.28, 0.08, 0.32)
    rightEye.scale.set(0.7, 1.2, 0.8)
    headGroup.add(rightEye)

    bossGroup.add(headGroup)

    // 3-3. 🪽 설탕 글레이즈 날개 (Left & Right Wing Groups)
    // 날개는 어깨 피벗 축을 기준으로 회전하여 웅장하게 펄럭임
    const leftWingGroup = new THREE.Group()
    leftWingRef.current = leftWingGroup
    leftWingGroup.position.set(-0.55, 0.35, -0.15)

    // 날개 뼈대 (다크 초코)
    const wingBone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, 1.1, 8),
      chocoCrustMat
    )
    wingBone.position.set(-0.45, 0.28, 0)
    wingBone.rotation.z = 1.0
    leftWingGroup.add(wingBone)

    // 날개막 (설탕 글레이즈 판상)
    const wingMembraneShape = new THREE.Shape()
    wingMembraneShape.moveTo(0, 0)
    wingMembraneShape.lineTo(-0.85, 0.65)
    wingMembraneShape.quadraticCurveTo(-0.95, 0.25, -0.75, -0.2)
    wingMembraneShape.quadraticCurveTo(-0.45, -0.15, 0, 0)
    const wingGeo = new THREE.ShapeGeometry(wingMembraneShape)
    const leftWingMesh = new THREE.Mesh(wingGeo, wingMat)
    leftWingMesh.scale.set(1.2, 1.2, 1.2)
    leftWingGroup.add(leftWingMesh)
    bossGroup.add(leftWingGroup)

    // 오른쪽 날개 (대칭 복제)
    const rightWingGroup = new THREE.Group()
    rightWingRef.current = rightWingGroup
    rightWingGroup.position.set(0.55, 0.35, -0.15)

    const rightWingBone = wingBone.clone()
    rightWingBone.position.set(0.45, 0.28, 0)
    rightWingBone.rotation.z = -1.0
    rightWingGroup.add(rightWingBone)

    const rightWingMesh = leftWingMesh.clone()
    rightWingMesh.scale.set(-1.2, 1.2, 1.2)
    rightWingGroup.add(rightWingMesh)
    bossGroup.add(rightWingGroup)

    // 3-4. 바닥 끓어오르는 퐁듀 웅덩이 (Fondue Pool)
    const poolGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.12, 28)
    const pool = new THREE.Mesh(poolGeo, magmaFondueMat)
    pool.position.set(0, -0.98, 0.1)
    bossGroup.add(pool)

    // 4. 애니메이션 루프 (Wing Flap, Head Roar, Hit Shake, Floating)
    let clock = new THREE.Clock()
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // 날개짓 애니메이션 (Sinusoidal Flapping)
      const flapAngle = Math.sin(t * 3.5) * 0.32
      if (leftWingRef.current) {
        leftWingRef.current.rotation.y = 0.35 + flapAngle
        leftWingRef.current.rotation.z = 0.15 + flapAngle * 0.4
      }
      if (rightWingRef.current) {
        rightWingRef.current.rotation.y = -0.35 - flapAngle
        rightWingRef.current.rotation.z = -0.15 - flapAngle * 0.4
      }

      // 머리 호흡 & 포효 흔들림
      if (headGroupRef.current) {
        headGroupRef.current.rotation.x = Math.sin(t * 2.0) * 0.08
        headGroupRef.current.position.y = 0.65 + Math.sin(t * 2.0) * 0.02
      }

      // 몸통 공중 부유 호흡
      if (bossGroupRef.current) {
        const floatY = Math.sin(t * 1.8) * 0.04
        bossGroupRef.current.position.y = floatY

        // 피격 시 진동 감쇠
        if (hitImpulseRef.current > 0.01) {
          const shakeX = (Math.random() - 0.5) * hitImpulseRef.current * 0.35
          const shakeY = (Math.random() - 0.5) * hitImpulseRef.current * 0.25
          bossGroupRef.current.position.x = shakeX
          bossGroupRef.current.position.y = floatY + shakeY
          hitImpulseRef.current *= 0.88
        } else {
          bossGroupRef.current.position.x = 0
        }
      }

      // 퐁듀 발광 펄스
      if (lavaCoreRef.current) {
        magmaFondueMat.emissiveIntensity = 0.7 + Math.sin(t * 4.5) * 0.3
      }

      renderer.render(scene, camera)
    }

    animate()

    // 5. 클린업
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (renderer) {
        try {
          renderer.dispose()
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement)
          }
        } catch {}
      }
    }
  }, [size])

  return (
    <div
      ref={mountRef}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: flash
          ? 'brightness(2.2) drop-shadow(0 0 25px #FF1744)'
          : pose === 'hit'
            ? 'drop-shadow(0 0 20px rgba(255, 61, 0, 0.8))'
            : 'drop-shadow(0 14px 30px rgba(233, 30, 99, 0.45))',
        transition: 'filter 0.2s ease',
      }}
    />
  )
}
