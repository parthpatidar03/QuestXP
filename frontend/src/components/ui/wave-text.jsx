"use client";

import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

function WaveText({
    text = "Hover me",
    className = "",
}) {
    return (
        <motion.span
            className={cn(
                "inline-block cursor-pointer text-3xl transition-all",
                className
            )}
            whileHover="hover"
            animate="animate"
            initial="initial"
        >
            {text.split("").map((char, index) => (
                <motion.span
                    key={index}
                    className="inline-block"
                    variants={{
                        initial: {
                            y: 0,
                            scale: 1,
                        },
                        animate: {
                            y: [0, -5, 0],
                            transition: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: index * 0.1,
                            }
                        },
                        hover: {
                            y: -8,
                            scale: 1.2,
                            transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 15,
                            },
                        },
                    }}
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </motion.span>
    );
}

export { WaveText };
