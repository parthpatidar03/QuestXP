import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { Sparkle } from "lucide-react";

const options = {
  key: "star",
  name: "Star",
  particles: {
    number: {
      value: 20,
      density: {
        enable: false,
      },
    },
    color: {
      value: ["#7c3aed", "#bae6fd", "#a78bfa", "#93c5fd", "#0284c7", "#fafafa", "#38bdf8"],
    },
    shape: {
      type: "star",
      options: {
        star: {
          sides: 4,
        },
      },
    },
    opacity: {
      value: 0.8,
    },
    size: {
      value: { min: 1, max: 4 },
    },
    rotate: {
      value: {
        min: 0,
        max: 360,
      },
      enable: true,
      direction: "clockwise",
      animation: {
        enable: true,
        speed: 10,
        sync: false,
      },
    },
    links: {
      enable: false,
    },
    reduceDuplicates: true,
    move: {
      enable: true,
      center: {
        x: 50,
        y: 50,
      },
    },
  },
  interactivity: {
    events: {},
  },
  smooth: true,
  fpsLimit: 120,
  background: {
    color: "transparent",
    size: "cover",
  },
  fullScreen: {
    enable: false,
  },
  detectRetina: true,
  absorbers: [
    {
      enable: true,
      opacity: 0,
      size: {
        value: 1,
        density: 1,
        limit: {
          radius: 5,
          mass: 5,
        },
      },
      position: {
        x: 50,
        y: 50,
      },
    },
  ],
  emitters: [
    {
      autoPlay: true,
      fill: true,
      life: {
        wait: true,
      },
      rate: {
        quantity: 5,
        delay: 0.5,
      },
      position: {
        x: 50,
        y: 50,
      },
    },
  ],
};

export default function AiGenerateButton({ isSubmitting = false }) {
  const [particleState, setParticlesReady] = useState();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setParticlesReady("loaded");
    });
  }, []);

  const modifiedOptions = useMemo(() => {
    return { ...options, autoPlay: true };
  }, []);

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`group/ai relative my-2 w-full rounded-full bg-gradient-to-r from-blue-300/30 via-blue-500/30 to-purple-500/30 p-1 text-white transition-transform hover:scale-[1.02] active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 px-4 py-3 text-white">
        <Sparkle className="size-6 -translate-y-0.5 animate-sparkle fill-white" />
        <Sparkle
          style={{ animationDelay: "1s" }}
          className="absolute bottom-2.5 left-8 z-20 size-2 rotate-12 animate-sparkle fill-white"
        />
        <Sparkle
          style={{ animationDelay: "1.5s", animationDuration: "2.5s" }}
          className="absolute left-10 top-2.5 size-1 -rotate-12 animate-sparkle fill-white"
        />
        <Sparkle
          style={{ animationDelay: "0.5s", animationDuration: "2.5s" }}
          className="absolute left-6 top-3 size-1.5 animate-sparkle fill-white"
        />

        <span className="font-semibold text-base">{isSubmitting ? 'Creating course...' : 'Generate course'}</span>
      </div>
      {!!particleState && !isSubmitting && (
        <Particles
          id="course-particles"
          className={`pointer-events-none absolute -bottom-4 -left-4 -right-4 -top-4 z-0 transition-opacity duration-300 ${isHovering ? "opacity-100" : "opacity-0"}`}
          particlesLoaded={async () => {
            setParticlesReady("ready");
          }}
          options={modifiedOptions}
        />
      )}
    </button>
  );
}
