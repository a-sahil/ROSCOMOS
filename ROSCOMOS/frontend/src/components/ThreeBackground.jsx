'use client'
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Torus, Points, PointMaterial } from '@react-three/drei'

function FloatingRings() {
  const rings = useMemo(
    () => [
      { pos: [-3, 1, -2], radius: 1.2, speed: 0.004, color: '#d4a32d', ax: [1, 0.5, 0] },
      { pos: [3, -1, -3], radius: 1.8, speed: 0.003, color: '#0f9b8e', ax: [0.3, 1, 0.2] },
      { pos: [0, 2, -4], radius: 2.4, speed: 0.002, color: '#d4a32d', ax: [0, 1, 0.5] },
      { pos: [-4, -2, -1], radius: 0.9, speed: 0.007, color: '#0f9b8e', ax: [0.8, 0.2, 1] },
      { pos: [4, 2, -2], radius: 1.5, speed: 0.005, color: '#d4a32d', ax: [0.5, 0.5, 1] },
    ],
    [],
  )
  const refs = useRef([])
  useFrame(() => {
    rings.forEach((r, i) => {
      const m = refs.current[i]
      if (!m) return
      m.rotation.x += r.speed * r.ax[0]
      m.rotation.y += r.speed * r.ax[1]
      m.rotation.z += r.speed * r.ax[2]
    })
  })
  return (
    <>
      {rings.map((r, i) => (
        <Torus key={i} ref={(el) => { if (el) refs.current[i] = el }} position={r.pos} args={[r.radius, 0.035, 16, 80]}>
          <meshStandardMaterial color={r.color} emissive={r.color} emissiveIntensity={0.6} transparent opacity={0.7} />
        </Torus>
      ))}
    </>
  )
}

function ParticleField() {
  const pos = useMemo(() => {
    const a = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i += 1) {
      a[i * 3] = (Math.random() - 0.5) * 20
      a[i * 3 + 1] = (Math.random() - 0.5) * 12
      a[i * 3 + 2] = (Math.random() - 0.5) * 8 - 5
    }
    return a
  }, [])
  const ref = useRef(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.02 })
  return (
    <Points ref={ref} positions={pos} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#d4a32d" size={0.04} sizeAttenuation depthWrite={false} opacity={0.6} />
    </Points>
  )
}

function CentralRing() {
  const ref = useRef(null)
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.001 })
  return (
    <Torus ref={ref} position={[0, 0, -6]} args={[3.5, 0.03, 16, 120]}>
      <meshStandardMaterial color="#d4a32d" emissive="#d4a32d" emissiveIntensity={0.4} transparent opacity={0.3} />
    </Torus>
  )
}

function CameraRig() {
  const { camera } = useThree()
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 0.6
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 0.3
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  useFrame(() => {
    camera.position.x += (mouse.current.x - camera.position.x) * 0.02
    camera.position.y += (mouse.current.y + 2 - camera.position.y) * 0.02
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function ThreeBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 2, 10], fov: 60 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[5, 5, 5]} color="#d4a32d" intensity={0.5} />
        <pointLight position={[-5, -5, 3]} color="#0f9b8e" intensity={0.3} />
        <FloatingRings />
        <ParticleField />
        <CentralRing />
        <CameraRig />
      </Canvas>
    </div>
  )
}
