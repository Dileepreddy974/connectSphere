import { useEffect, useId, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

const ConnectSphereIntro = ({
    primaryColor = "#6366F1",
    secondaryColor = "#06B6D4",
    accentColor = "#A78BFA",
    backgroundColor = "#FFFAF0",
    theme = "auto",
    brandName = "ConnectSphere",
    tagline = "Where Ideas Come Together",
    loopOrbit = true,
    showPaperTexture = true,
    dockOnComplete = false,
    replay = false,
    animationSpeed = 1,
}) => {
    const reducedMotion = useReducedMotion()
    const shouldAnimate = !reducedMotion

    const rootRef = useRef(null)
    const textureId = useId().replace(/:/g, "")

    const [resolvedTheme, setResolvedTheme] = useState("light")
    const [sequenceComplete, setSequenceComplete] = useState(!shouldAnimate)

    useEffect(() => {
        if (theme === "light" || theme === "dark") {
            setResolvedTheme(theme)
            return
        }
        if (typeof window !== "undefined" && window.matchMedia) {
            const media = window.matchMedia("(prefers-color-scheme: dark)")
            const apply = () => setResolvedTheme(media.matches ? "dark" : "light")
            apply()
            media.addEventListener("change", apply)
            return () => media.removeEventListener("change", apply)
        }
    }, [theme])

    const effectiveSpeed = useMemo(() => Math.min(2, Math.max(0.5, animationSpeed || 1)), [animationSpeed])
    const totalDuration = useMemo(() => 3 / effectiveSpeed, [effectiveSpeed])

    useEffect(() => {
        if (!shouldAnimate) { setSequenceComplete(true); return }
        setSequenceComplete(false)
        const timer = window.setTimeout(() => setSequenceComplete(true), totalDuration * 1000)
        return () => window.clearTimeout(timer)
    }, [shouldAnimate, totalDuration, replay])

    const palette = useMemo(() => {
        const dark = resolvedTheme === "dark"
        return {
            paper: dark ? "#0E1016" : backgroundColor,
            textPrimary: dark ? "#F7FAFF" : "#0A0A0A",
            textSecondary: dark ? "#C6CDDB" : "#4B5563",
            linePrimary: dark ? "#D8E2FF" : primaryColor,
            lineSecondary: dark ? "#9EEBFF" : secondaryColor,
            lineAccent: dark ? "#D8C9FF" : accentColor,
            texture: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.018)",
            textureOpacity: dark ? 0.12 : 0.16,
        }
    }, [resolvedTheme, backgroundColor, primaryColor, secondaryColor, accentColor])

    const nodes = useMemo(() => [
        { angle: -62, radius: 80, size: 8, speed: 22, phase: 0.1, wobble: 2.3 },
        { angle: -20, radius: 95, size: 7, speed: 28, phase: 1.2, wobble: 2.8 },
        { angle: 30, radius: 84, size: 9, speed: 24, phase: 2.1, wobble: 3.2 },
        { angle: 78, radius: 88, size: 8, speed: 30, phase: 0.7, wobble: 2.5 },
        { angle: 142, radius: 92, size: 7, speed: 26, phase: 1.8, wobble: 3.1 },
        { angle: 195, radius: 86, size: 8, speed: 32, phase: 2.8, wobble: 2.4 },
    ], [])

    const nodePoints = useMemo(() => nodes.map((node) => {
        const rad = (node.angle * Math.PI) / 180
        return { x: 150 + Math.cos(rad) * node.radius, y: 130 + Math.sin(rad) * node.radius, ...node }
    }), [nodes])

    const connectorPairs = useMemo(() => [[0, 2], [2, 4], [1, 3], [3, 5]], [])

    const introDelay = shouldAnimate ? 0 : -999
    const contentScale = useMemo(() => (dockOnComplete && sequenceComplete ? 0.68 : 1), [dockOnComplete, sequenceComplete])
    const contentY = useMemo(() => (dockOnComplete && sequenceComplete ? -70 : 0), [dockOnComplete, sequenceComplete])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative", width: "100%", height: "100vh", overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: palette.paper, borderRadius: 16,
            }}
        >
            {showPaperTexture && (
                <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: palette.textureOpacity }} viewBox="0 0 100 100" preserveAspectRatio="none">
                    <filter id={`noise-${textureId}`}>
                        <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" stitchTiles="stitch" result="noise" />
                        <feColorMatrix in="noise" type="matrix" values="0.18 0 0 0 0.41 0 0.18 0 0 0.41 0 0 0.18 0 0.41 0 0 0 0.28 0" />
                    </filter>
                    <rect width="100" height="100" filter={`url(#noise-${textureId})`} opacity="1" fill={palette.texture} />
                </svg>
            )}

            <motion.div
                key={`dock-${replay}-${effectiveSpeed}-${theme}`}
                animate={{ scale: contentScale, y: contentY }}
                transition={{ type: "spring", stiffness: 160, damping: 24, mass: 0.75 }}
                style={{ position: "relative", width: "min(92%, 860px)", height: "min(82%, 520px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, transformOrigin: "center center" }}
            >
                <div style={{ position: "relative", width: "min(100%, 540px)", aspectRatio: "16 / 10", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div aria-hidden="true" style={{ position: "absolute", width: "52%", height: "52%", borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${secondaryColor}55 0%, ${primaryColor}35 45%, ${accentColor}35 70%, transparent 100%)`, filter: "blur(22px)", transform: "translateZ(0)", zIndex: 0 }} />

                    <motion.svg key={`svg-${replay}-${effectiveSpeed}`} viewBox="0 0 300 220" width="100%" height="100%" style={{ position: "relative", zIndex: 1, overflow: "visible" }}>
                        {[0, 1, 2].map((ring) => (
                            <motion.path key={`ring-${ring}`}
                                d="M150 130 C180 95, 234 110, 246 152 C256 186, 212 212, 170 206 C132 201, 92 178, 84 144 C78 118, 108 100, 138 103"
                                fill="none" stroke={palette.lineSecondary} strokeWidth={1.7 + ring * 0.1} strokeLinecap="round" strokeLinejoin="round"
                                initial={shouldAnimate ? { opacity: 0, scale: 0.55, pathLength: 0 } : { opacity: 0.55 - ring * 0.12, scale: 1.35 + ring * 0.14, pathLength: 1 }}
                                animate={shouldAnimate ? { opacity: 0.55 - ring * 0.12, scale: 1 + ring * 0.14, pathLength: 1 } : { opacity: 0.55 - ring * 0.12, scale: 1.35 + ring * 0.14, pathLength: 1 }}
                                transition={{ duration: (1.6 + ring * 0.25) / effectiveSpeed, delay: introDelay + (0.1 + ring * 0.18) / effectiveSpeed, ease: [0.22, 1, 0.36, 1] }}
                                style={{ transformOrigin: "150px 130px" }}
                            />
                        ))}

                        {connectorPairs.map(([a, b], i) => {
                            const pa = nodePoints[a], pb = nodePoints[b]
                            const midX = (pa.x + pb.x) / 2 + (i * 7 - 14), midY = (pa.y + pb.y) / 2 + (i * 5 - 10)
                            return (
                                <motion.path key={`conn-${i}`} d={`M${pa.x} ${pa.y} Q${midX} ${midY} ${pb.x} ${pb.y}`}
                                    fill="none" stroke={palette.lineAccent} strokeWidth={1.2} strokeLinecap="round" strokeDasharray="4 6"
                                    initial={shouldAnimate ? { opacity: 0, pathLength: 0 } : { opacity: 0.5, pathLength: 1 }}
                                    animate={{ opacity: 0.5, pathLength: 1 }}
                                    transition={{ duration: 1.1 / effectiveSpeed, delay: introDelay + (0.8 + i * 0.15) / effectiveSpeed, ease: [0.22, 1, 0.36, 1] }}
                                />
                            )
                        })}

                        <motion.circle cx="150" cy="130" r="28" fill="none" stroke={palette.linePrimary} strokeWidth={2.4} strokeLinecap="round"
                            initial={shouldAnimate ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2 / effectiveSpeed, delay: introDelay + 0.15 / effectiveSpeed, ease: [0.22, 1, 0.36, 1] }}
                            style={{ transformOrigin: "150px 130px" }}
                        />
                        <motion.circle cx="150" cy="130" r="22" fill={`${primaryColor}18`}
                            initial={shouldAnimate ? { opacity: 0, scale: 0.3 } : { opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.9 / effectiveSpeed, delay: introDelay + 0.45 / effectiveSpeed, ease: [0.22, 1, 0.36, 1] }}
                            style={{ transformOrigin: "150px 130px" }}
                        />

                        <motion.text x="150" y="137" textAnchor="middle" dominantBaseline="middle" fill={palette.linePrimary} fontSize="22" fontWeight="800" fontFamily="'Patrick Hand', cursive, sans-serif"
                            initial={shouldAnimate ? { opacity: 0, scale: 0.4 } : { opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 14, delay: introDelay + 0.6 / effectiveSpeed }}
                            style={{ transformOrigin: "150px 133px" }}
                        >C</motion.text>

                        {nodePoints.map((node, i) => (
                            <motion.g key={`node-${i}`}>
                                <motion.circle cx={node.x} cy={node.y} r={node.size}
                                    fill={i % 3 === 0 ? palette.linePrimary : i % 3 === 1 ? palette.lineSecondary : palette.lineAccent}
                                    initial={shouldAnimate ? { opacity: 0, scale: 0 } : { opacity: 0.9, scale: 1 }}
                                    animate={{ opacity: 0.9, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 16, delay: introDelay + (0.5 + i * 0.12) / effectiveSpeed }}
                                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                                />
                                <motion.circle cx={node.x} cy={node.y} r={node.size + 4} fill="none"
                                    stroke={i % 3 === 0 ? palette.linePrimary : i % 3 === 1 ? palette.lineSecondary : palette.lineAccent}
                                    strokeWidth={0.8} strokeLinecap="round" strokeDasharray="2 4"
                                    initial={shouldAnimate ? { opacity: 0, scale: 0 } : { opacity: 0.35, scale: 1 }}
                                    animate={loopOrbit && shouldAnimate ? { opacity: [0.35, 0.15, 0.35], scale: [1, 1.15, 1], rotate: [0, 360] } : { opacity: 0.35, scale: 1 }}
                                    transition={loopOrbit && shouldAnimate ? { duration: node.speed / effectiveSpeed, delay: introDelay + (1.2 + i * 0.1) / effectiveSpeed, repeat: Infinity, ease: "linear" } : { duration: 0.6 / effectiveSpeed, delay: introDelay + (0.6 + i * 0.12) / effectiveSpeed }}
                                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                                />
                            </motion.g>
                        ))}

                        {[
                            { d: "M60 60 C65 50, 75 48, 82 55", delay: 1.4 },
                            { d: "M228 55 C234 48, 242 50, 245 60", delay: 1.5 },
                            { d: "M55 185 C60 192, 70 195, 78 190", delay: 1.6 },
                            { d: "M230 190 C236 196, 244 192, 248 185", delay: 1.7 },
                        ].map((sq, i) => (
                            <motion.path key={`sq-${i}`} d={sq.d} fill="none" stroke={palette.lineAccent} strokeWidth={1.5} strokeLinecap="round"
                                initial={shouldAnimate ? { opacity: 0, pathLength: 0 } : { opacity: 0.4, pathLength: 1 }}
                                animate={{ opacity: 0.4, pathLength: 1 }}
                                transition={{ duration: 0.7 / effectiveSpeed, delay: introDelay + sq.delay / effectiveSpeed, ease: [0.22, 1, 0.36, 1] }}
                            />
                        ))}

                        {[
                            { x: 48, y: 42, r: 2.5, delay: 1.8 }, { x: 260, y: 38, r: 2, delay: 1.9 },
                            { x: 42, y: 198, r: 2, delay: 2.0 }, { x: 265, y: 200, r: 2.5, delay: 2.1 },
                            { x: 150, y: 25, r: 3, delay: 2.2 },
                        ].map((sp, i) => (
                            <motion.circle key={`sp-${i}`} cx={sp.x} cy={sp.y} r={sp.r} fill={palette.lineAccent}
                                initial={shouldAnimate ? { opacity: 0, scale: 0 } : { opacity: 0.6, scale: 1 }}
                                animate={loopOrbit && shouldAnimate ? { opacity: [0.6, 0.2, 0.6], scale: [1, 1.4, 1] } : { opacity: 0.6, scale: 1 }}
                                transition={loopOrbit && shouldAnimate ? { duration: 2 + i * 0.4, delay: introDelay + sp.delay / effectiveSpeed, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 300, damping: 18, delay: introDelay + sp.delay / effectiveSpeed }}
                                style={{ transformOrigin: `${sp.x}px ${sp.y}px` }}
                            />
                        ))}
                    </motion.svg>
                </div>

                <motion.h1 key={`brand-${replay}-${effectiveSpeed}`}
                    style={{ margin: 0, fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, fontFamily: "'Patrick Hand', cursive, sans-serif", color: palette.textPrimary, letterSpacing: "-0.02em", textAlign: "center", lineHeight: 1.1 }}
                    initial={shouldAnimate ? { opacity: 0, y: 24, scale: 0.92 } : { opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18, delay: introDelay + 1.0 / effectiveSpeed }}
                >{brandName}</motion.h1>

                {tagline && (
                    <motion.p key={`tag-${replay}-${effectiveSpeed}`}
                        style={{ margin: 0, fontSize: "clamp(13px, 2vw, 18px)", fontWeight: 500, fontFamily: "'Patrick Hand', cursive, sans-serif", color: palette.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", lineHeight: 1.4 }}
                        initial={shouldAnimate ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 160, damping: 20, delay: introDelay + 1.35 / effectiveSpeed }}
                    >{tagline}</motion.p>
                )}

                <motion.svg key={`ul-${replay}-${effectiveSpeed}`} viewBox="0 0 200 10" width="min(60%, 280px)" height="10" style={{ overflow: "visible", marginTop: -4 }}>
                    <motion.path d="M5 5 C30 2, 60 8, 100 5 C140 2, 170 8, 195 5" fill="none" stroke={palette.lineAccent} strokeWidth={2.2} strokeLinecap="round"
                        initial={shouldAnimate ? { opacity: 0, pathLength: 0 } : { opacity: 0.7, pathLength: 1 }}
                        animate={{ opacity: 0.7, pathLength: 1 }}
                        transition={{ duration: 0.8 / effectiveSpeed, delay: introDelay + 1.6 / effectiveSpeed, ease: [0.22, 1, 0.36, 1] }}
                    />
                </motion.svg>
            </motion.div>
        </div>
    )
}

export default ConnectSphereIntro
