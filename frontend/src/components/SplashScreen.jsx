import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ConnectSphereIntro from "../pages/IntroPreview"

const SPLASH_KEY = "cs_splash_shown"

const SplashScreen = ({ children }) => {
    const [showSplash] = useState(() => {
        try {
            return !sessionStorage.getItem(SPLASH_KEY)
        } catch {
            return true
        }
    })
    const [fadeOut, setFadeOut] = useState(false)
    const [removed, setRemoved] = useState(false)

    // After animation plays (~3s), show "enter" hint
    const [ready, setReady] = useState(false)
    useEffect(() => {
        if (!showSplash) return
        const t = setTimeout(() => setReady(true), 3200)
        return () => clearTimeout(t)
    }, [showSplash])

    const dismiss = useCallback(() => {
        if (fadeOut) return
        setFadeOut(true)
        try { sessionStorage.setItem(SPLASH_KEY, "1") } catch {}
        setTimeout(() => setRemoved(true), 700)
    }, [fadeOut])

    // Auto-dismiss after 6s
    useEffect(() => {
        if (!showSplash || removed) return
        const t = setTimeout(dismiss, 6000)
        return () => clearTimeout(t)
    }, [showSplash, removed, dismiss])

    // Skip on any key press
    useEffect(() => {
        if (!showSplash) return
        const onKey = (e) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") dismiss() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [showSplash, dismiss])

    if (removed || !showSplash) return <>{children}</>

    return (
        <>
            <AnimatePresence>
                {!removed && (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: fadeOut ? 0 : 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        onClick={dismiss}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 99999,
                            cursor: ready ? "pointer" : "default",
                        }}
                    >
                        <ConnectSphereIntro
                            primaryColor="#6366F1"
                            secondaryColor="#06B6D4"
                            accentColor="#A78BFA"
                            backgroundColor="#FFFAF0"
                            theme="auto"
                            brandName="ConnectSphere"
                            tagline="Where Ideas Come Together"
                            loopOrbit={true}
                            showPaperTexture={true}
                            dockOnComplete={false}
                            replay={false}
                            animationSpeed={1}
                        />

                        {/* Enter hint */}
                        <AnimatePresence>
                            {ready && !fadeOut && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    style={{
                                        position: "absolute",
                                        bottom: "8%",
                                        left: 0,
                                        right: 0,
                                        display: "flex",
                                        justifyContent: "center",
                                        pointerEvents: "none",
                                    }}
                                >
                                    <motion.div
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        style={{
                                            padding: "10px 28px",
                                            borderRadius: 999,
                                            background: "rgba(99, 102, 241, 0.12)",
                                            backdropFilter: "blur(12px)",
                                            border: "1px solid rgba(99, 102, 241, 0.25)",
                                            color: "#6366F1",
                                            fontFamily: "'Patrick Hand', cursive, sans-serif",
                                            fontSize: 15,
                                            fontWeight: 600,
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Click anywhere or press Enter
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Render children underneath (hidden until splash dismissed) */}
            <div style={{ visibility: fadeOut ? "visible" : "hidden" }}>
                {children}
            </div>
        </>
    )
}

export default SplashScreen
