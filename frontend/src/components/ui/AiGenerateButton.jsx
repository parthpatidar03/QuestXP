import React, { useEffect, useMemo, useState } from "react";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { tsParticles } from "@tsparticles/engine";
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
        x: 120,
        y: 45,
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
        x: 110,
        y: 45,
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
        x: 110,
        y: 45,
      },
    },
  ],
};

export default function AiGenerateButton({ isSubmitting = false }) {
  const [particleState, setParticlesReady] = useState();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    loadFull(tsParticles).then(() => {
      setParticlesReady("loaded");
    });
  }, []);

  const modifiedOptions = useMemo(() => {
    options.autoPlay = isHovering;
    return options;
  }, [isHovering]);

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
          className={`pointer-events-none absolute -bottom-4 -left-4 -right-4 -top-4 z-0 opacity-0 transition-opacity ${particleState === "ready" ? "group-hover/ai:opacity-100" : ""}`}
          particlesLoaded={async () => {
            setParticlesReady("ready");
          }}
          options={modifiedOptions}
        />
      )}
    </button>
  );
}
