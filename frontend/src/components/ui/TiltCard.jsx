import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * TiltCard Component
 * Provides a smooth 3D tilt effect following the mouse cursor.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to be tilted
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.intensity - Maximum rotation angle in degrees
 */
const TiltCard = ({ children, className = "", intensity = 15 }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Spring configuration for buttery smooth movement
    const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
    const mouseXSpring = useSpring(x, springConfig);
    const mouseYSpring = useSpring(y, springConfig);

    // Map mouse position (-0.5 to 0.5) to rotation degrees
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        const yPct = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            className={`relative transition-shadow duration-500 ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default TiltCard;
