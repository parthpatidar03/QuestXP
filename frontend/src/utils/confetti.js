import confetti from 'canvas-confetti';

export const shootConfetti = (origin) => {
  const count = 200;
  const defaults = {
    origin: origin || { x: 0.5, y: 0.5 },
    zIndex: 9999,
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
  fire(0.1, { spread: 120, startVelocity: 65, scalar: 1.5 });
};

export const shootLighterConfetti = () => {
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#a786ff', '#fd8bbc', '#eca184'],
    zIndex: 9999,
  });
};

export const shootFireworks = () => {
  const duration = 5 * 1000;
  const end = Date.now() + duration;

  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors,
      zIndex: 9999,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors,
      zIndex: 9999,
    });

    requestAnimationFrame(frame);
  };

  frame();
};
