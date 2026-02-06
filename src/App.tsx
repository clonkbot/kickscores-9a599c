import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Float, Stars, Text, Html } from '@react-three/drei'
import { Suspense, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

// Match data types
interface Match {
  id: number
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: 'live' | 'finished' | 'upcoming'
  minute?: number
  league: string
  time?: string
}

// Sample match data
const matchesData: Match[] = [
  { id: 1, homeTeam: 'Manchester City', awayTeam: 'Arsenal', homeScore: 2, awayScore: 1, status: 'live', minute: 67, league: 'Premier League' },
  { id: 2, homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: 3, awayScore: 3, status: 'live', minute: 89, league: 'La Liga' },
  { id: 3, homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', homeScore: 4, awayScore: 0, status: 'finished', league: 'Bundesliga' },
  { id: 4, homeTeam: 'PSG', awayTeam: 'Lyon', homeScore: 1, awayScore: 2, status: 'finished', league: 'Ligue 1' },
  { id: 5, homeTeam: 'Juventus', awayTeam: 'AC Milan', homeScore: 0, awayScore: 0, status: 'upcoming', time: '20:45', league: 'Serie A' },
  { id: 6, homeTeam: 'Liverpool', awayTeam: 'Chelsea', homeScore: 0, awayScore: 0, status: 'upcoming', time: '18:30', league: 'Premier League' },
  { id: 7, homeTeam: 'Atletico Madrid', awayTeam: 'Sevilla', homeScore: 2, awayScore: 1, status: 'live', minute: 34, league: 'La Liga' },
  { id: 8, homeTeam: 'Inter Milan', awayTeam: 'Napoli', homeScore: 1, awayScore: 1, status: 'finished', league: 'Serie A' },
]

// 3D Stadium Field Component
function StadiumField() {
  const fieldRef = useRef<THREE.Mesh>(null!)

  return (
    <group position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Main field */}
      <mesh ref={fieldRef} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#1a472a" roughness={0.8} />
      </mesh>

      {/* Field lines */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
      </mesh>

      {/* Center line */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.08, 14]} />
        <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
      </mesh>

      {/* Outer boundary */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[9.9, 10, 4]} />
        <meshBasicMaterial color="#ffffff" opacity={0.4} transparent />
      </mesh>
    </group>
  )
}

// Animated stadium lights
function StadiumLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null!)

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  return (
    <group position={position}>
      <pointLight ref={lightRef} color="#00ff88" intensity={2} distance={15} />
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
    </group>
  )
}

// Floating match card in 3D space
function MatchCard3D({ match, position, onClick }: { match: Match; position: [number, number, number]; onClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1
    }
  })

  const statusColor = match.status === 'live' ? '#00ff88' : match.status === 'finished' ? '#666' : '#00d4ff'

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group
        ref={groupRef}
        position={position}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh scale={hovered ? 1.1 : 1}>
          <boxGeometry args={[3, 1.5, 0.1]} />
          <meshStandardMaterial
            color={hovered ? '#1a1a2e' : '#0f0f1a'}
            metalness={0.3}
            roughness={0.7}
            emissive={statusColor}
            emissiveIntensity={hovered ? 0.1 : 0.02}
          />
        </mesh>

        {/* Status indicator */}
        <mesh position={[-1.2, 0.5, 0.06]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>

        <Html center position={[0, 0, 0.1]} style={{ pointerEvents: 'none' }}>
          <div className="w-48 text-center select-none">
            <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">{match.league}</div>
            <div className="flex items-center justify-between text-white text-sm font-bold">
              <span className="truncate w-16 text-right">{match.homeTeam.split(' ').pop()}</span>
              <span className="mx-2 text-lg font-black text-green-400">
                {match.status === 'upcoming' ? match.time : `${match.homeScore} - ${match.awayScore}`}
              </span>
              <span className="truncate w-16 text-left">{match.awayTeam.split(' ').pop()}</span>
            </div>
            {match.status === 'live' && (
              <div className="text-[10px] text-green-400 mt-1 animate-pulse">{match.minute}'</div>
            )}
          </div>
        </Html>
      </group>
    </Float>
  )
}

// Floating football
function FloatingBall() {
  const ballRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (ballRef.current) {
      ballRef.current.rotation.x += 0.01
      ballRef.current.rotation.y += 0.02
      ballRef.current.position.y = 2 + Math.sin(state.clock.elapsedTime) * 0.5
    }
  })

  return (
    <mesh ref={ballRef} position={[0, 2, 0]} castShadow>
      <icosahedronGeometry args={[0.4, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  )
}

// 3D Scene
function Scene({ onSelectMatch }: { onSelectMatch: (match: Match) => void }) {
  const positions: [number, number, number][] = [
    [-5, 3, -3],
    [-2, 4, -4],
    [1, 3.5, -3.5],
    [4, 4, -4],
    [-4, 1, -2],
    [-1, 0.5, -1.5],
    [2, 1, -2],
    [5, 0.5, -1.5],
  ]

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} castShadow />

      {/* Stadium lights */}
      <StadiumLight position={[-8, 6, -5]} />
      <StadiumLight position={[8, 6, -5]} />
      <StadiumLight position={[-8, 6, 5]} />
      <StadiumLight position={[8, 6, 5]} />

      <StadiumField />
      <FloatingBall />

      {/* Stars background */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      {/* Match cards floating in space */}
      {matchesData.map((match, index) => (
        <MatchCard3D
          key={match.id}
          match={match}
          position={positions[index]}
          onClick={() => onSelectMatch(match)}
        />
      ))}

      {/* 3D Title */}
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
        <Text
          position={[0, 6, -5]}
          fontSize={1.2}
          color="#00ff88"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXoo9Wlhyw.woff"
        >
          LIVE SCORES
        </Text>
      </Float>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={0.3}
      />
      <Environment preset="night" />
    </>
  )
}

// Main App Component
export default function App() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'finished' | 'upcoming'>('all')

  const filteredMatches = matchesData.filter(m =>
    activeFilter === 'all' ? true : m.status === activeFilter
  )

  return (
    <div className="w-screen h-screen bg-[#0a0a0f] overflow-hidden relative">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 5, 12], fov: 60 }}
        shadows
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <Scene onSelectMatch={setSelectedMatch} />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <header className="pointer-events-auto p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center">
              <svg className="w-6 h-6 md:w-7 md:h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <polygon points="12,7 9,12 12,17 15,12" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                KICK<span className="text-green-400">SCORES</span>
              </h1>
              <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">Live Football Results</p>
            </div>
          </div>
        </header>

        {/* Filter tabs */}
        <div className="pointer-events-auto absolute top-20 md:top-24 left-4 md:left-6 flex gap-2">
          {(['all', 'live', 'finished', 'upcoming'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded transition-all duration-300 ${
                activeFilter === filter
                  ? 'bg-green-400 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {filter}
              {filter === 'live' && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Side panel with match list */}
        <div className="pointer-events-auto absolute right-0 top-0 h-full w-72 md:w-80 bg-gradient-to-l from-black/90 to-transparent p-4 md:p-6 overflow-y-auto">
          <h2 className="text-lg md:text-xl font-black text-white mb-4 md:mb-6 tracking-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            TODAY'S <span className="text-cyan-400">MATCHES</span>
          </h2>

          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`p-3 md:p-4 rounded-lg cursor-pointer transition-all duration-300 border-l-4 ${
                  match.status === 'live'
                    ? 'bg-green-400/10 border-green-400 hover:bg-green-400/20'
                    : match.status === 'finished'
                    ? 'bg-gray-800/50 border-gray-600 hover:bg-gray-800/70'
                    : 'bg-cyan-400/10 border-cyan-400 hover:bg-cyan-400/20'
                } ${selectedMatch?.id === match.id ? 'ring-2 ring-white/30' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">{match.league}</span>
                  {match.status === 'live' && (
                    <span className="text-[10px] md:text-xs text-green-400 font-bold animate-pulse">{match.minute}'</span>
                  )}
                  {match.status === 'upcoming' && (
                    <span className="text-[10px] md:text-xs text-cyan-400 font-bold">{match.time}</span>
                  )}
                  {match.status === 'finished' && (
                    <span className="text-[10px] md:text-xs text-gray-500 font-bold">FT</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-white font-medium truncate pr-2">{match.homeTeam}</span>
                    <span className={`text-sm md:text-base font-black ${match.homeScore > match.awayScore ? 'text-green-400' : 'text-white'}`}>
                      {match.status === 'upcoming' ? '-' : match.homeScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-white font-medium truncate pr-2">{match.awayTeam}</span>
                    <span className={`text-sm md:text-base font-black ${match.awayScore > match.homeScore ? 'text-green-400' : 'text-white'}`}>
                      {match.status === 'upcoming' ? '-' : match.awayScore}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live indicator */}
        <div className="pointer-events-none absolute bottom-20 md:bottom-16 left-4 md:left-6 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-black/70 rounded-full border border-green-400/30">
            <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs md:text-sm text-green-400 font-bold uppercase tracking-wider">
              {matchesData.filter(m => m.status === 'live').length} Live Matches
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="pointer-events-none absolute bottom-20 md:bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest">
            Drag to orbit • Scroll to zoom • Click cards for details
          </p>
        </div>
      </div>

      {/* Selected match modal */}
      {selectedMatch && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] p-6 md:p-8 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${
                selectedMatch.status === 'live'
                  ? 'bg-green-400/20 text-green-400'
                  : selectedMatch.status === 'finished'
                  ? 'bg-gray-600/20 text-gray-400'
                  : 'bg-cyan-400/20 text-cyan-400'
              }`}>
                {selectedMatch.status === 'live' ? `Live • ${selectedMatch.minute}'` : selectedMatch.status === 'finished' ? 'Full Time' : selectedMatch.time}
              </span>

              <p className="text-xs text-cyan-400 uppercase tracking-widest mb-4">{selectedMatch.league}</p>

              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1 text-right">
                  <p className="text-lg md:text-xl text-white font-bold">{selectedMatch.homeTeam}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {selectedMatch.status === 'upcoming' ? 'VS' : `${selectedMatch.homeScore} - ${selectedMatch.awayScore}`}
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-lg md:text-xl text-white font-bold">{selectedMatch.awayTeam}</p>
                </div>
              </div>

              {selectedMatch.status === 'live' && (
                <div className="bg-green-400/10 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-sm font-bold">Match in Progress</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedMatch(null)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-10">
        <p className="text-[10px] md:text-xs text-gray-600">
          Requested by <span className="text-gray-500">@Grokmato</span> · Built by <span className="text-gray-500">@clonkbot</span>
        </p>
      </footer>
    </div>
  )
}
