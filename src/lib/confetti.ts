import confetti from 'canvas-confetti';

export function fireWinnerConfetti() {
  const duration = 4 * 1000;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#facc15', '#38bdf8', '#34d399', '#f43f5e', '#c084fc']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#facc15', '#38bdf8', '#34d399', '#f43f5e', '#c084fc']
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export function fireMiniBurst() {
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#38bdf8', '#facc15', '#34d399']
  });
}
