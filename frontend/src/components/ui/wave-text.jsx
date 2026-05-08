"use client";

import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

function WaveText({
    text = "Hover me",
    className = "",
}) {
    return (
        <motion.div
            className={cn(
                "inline-flex flex-wrap justify-center items-center gap-x-0 cursor-pointer transition-all",
                className
            )}
            whileHover="hover"
            initial="initial"
        >
            {text.split("").map((char, index) => (
                <motion.span
                    key={index}
                    className="inline-block whitespace-pre"
                    variants={{
                        initial: { y: 0 },
                        hover: {
                            y: -10,
                            transition: {
                                type: "spring",
                                stiffness: 400,
                                damping: 10,
                                delay: index * 0.02,
                            },
                        },
                    }}
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </motion.div>
    );
}

export { WaveText };
