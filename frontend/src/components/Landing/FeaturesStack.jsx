import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Trophy, PenTool, Users } from 'lucide-react';

const features = [
    {
        title: "AI Adaptive Roadmaps",
        desc: "Missed a day? Hit +. QuestXP instantly recalculates your entire study path in real-time to keep you on track.",
        icon: <Sparkles className="w-12 h-12 text-white" />,
        from: '#FF6156', to: '#C82A20'
    },
    {
        title: "Focus Guardian",
        desc: "Specialized player with zero ads, shorts, or recommendations. Keeps you in the deep flow state.",
        icon: <ShieldCheck className="w-12 h-12 text-white" />,
        from: '#4A3D3D', to: '#221B1B'
    },
    {
        title: "Gamified Mastery",
        desc: "Earn XP, maintain streaks, and climb the Global Hall of Fame as you conquer your playlists.",
        icon: <Trophy className="w-12 h-12 text-white" />,
        from: '#F0A63C', to: '#D08A26'
    },
    {
        title: "Smart Timestamp Notes",
        desc: "Take context-aware notes linked directly to video timestamps. Never lose track of key concepts again.",
        icon: <PenTool className="w-12 h-12 text-white" />,
        from: '#5E9ED6', to: '#3D6D96'
    },
    {
        title: "Community Friend Zones",
        desc: "Learn together in private zones, share roadmaps, and compete on exclusive leaderboards with your peers.",
        icon: <Users className="w-12 h-12 text-white" />,
        from: '#FF8A80', to: '#D93A2C'
    }
];



const cardVariants = {
    offscreen: { y: 20, opacity: 0 },
    onscreen: {
        y: 0,
        opacity: 1,
        transition: { type: "tween", ease: "easeOut", duration: 0.4 }
    }
};

export default function FeaturesStack() {
    return (
        <div className="w-full max-w-5xl mx-auto py-10 px-4 sm:px-6">
            {features.map((feature, i) => {
                const background = `linear-gradient(150deg, ${feature.from}, ${feature.to})`;
                return (
                    <motion.div
                        key={i}
                        className="relative flex justify-center items-center py-6 -mb-6"
                        initial="offscreen"
                        whileInView="onscreen"
                        viewport={{ once: true, margin: "-50px" }}
                    >
                        <motion.div 
                            variants={cardVariants} 
                            className="relative z-10 w-full md:w-[800px] h-auto min-h-[200px] flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 rounded-clay-lg clay hover:border-border-shadow transition-all duration-300 p-8 sm:p-12"
                        >
                            <div className="shrink-0 rounded-clay-lg flex items-center justify-center p-6" style={{ background }}>
                                {feature.icon}
                            </div>
                            
                            <div className="flex flex-col text-center md:text-left mt-2 md:mt-0">
                                <h3 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3 font-display">{feature.title}</h3>
                                <p className="text-base sm:text-lg text-text-secondary leading-relaxed">{feature.desc}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                );
            })}
        </div>
    );
}
