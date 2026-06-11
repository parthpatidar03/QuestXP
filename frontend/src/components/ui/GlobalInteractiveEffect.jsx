import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';

const GlobalInteractiveEffect = () => {
    // Use motion values to bypass React re-renders on high-frequency mouse movements
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);
    const [ripples, setRipples] = useState([]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        const handleClick = (e) => {
            const id = Date.now();
            setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== id));
            }, 1000);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
        };
    }, [mouseX, mouseY]);

    // Construct the background gradient dynamically without triggering re-renders
    const background = useMotionTemplate`radial-gradient(600px at ${mouseX}px ${mouseY}px, rgba(34, 197, 94, 0.2), transparent 80%)`;

    return (
        <>
            {/* Click Ripples */}
            <AnimatePresence>
                {ripples.map(ripple => (
                    <motion.div
                        key={ripple.id}
                        initial={{ opacity: 0.6, scale: 0 }}
                        animate={{ opacity: 0, scale: 4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="pointer-events-none fixed z-[9999] w-8 h-8 rounded-full border border-primary/50 bg-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                        style={{ 
                            left: ripple.x - 16, 
                            top: ripple.y - 16,
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Mouse Glow Effect */}
            <motion.div 
                className="pointer-events-none fixed inset-0 z-[9998] opacity-[0.15] transition-opacity duration-300 hidden sm:block"
                style={{
                    background
                }}
            />
        </>
    );
};

export default GlobalInteractiveEffect;
