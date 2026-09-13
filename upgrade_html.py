# -*- coding: utf-8 -*-
import re

def upgrade():
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix line 2100 CSS error: color: #a855f7); -> color: #a855f7;
    content = content.replace('color: #a855f7);', 'color: #a855f7;')
    
    # 2. Fix lines 246 and 477 background-clip warnings
    # Replace -webkit-background-clip: text; with both properties
    content = re.sub(
        r'(-webkit-background-clip:\s*text;)(?!\s*background-clip:\s*text;)',
        r'-webkit-background-clip: text;\n      background-clip: text;',
        content
    )

    # 3. Add top-class Theme System CSS variables & Keyframe Animations
    new_styles = """
    /* ========================================================= */
    /* TOP-CLASS THEMES                                          */
    /* ========================================================= */
    :root, [data-theme="cyber-navy"] {
      --bg-dark: #070b14;
      --bg-card: rgba(16, 24, 43, 0.82);
      --bg-card-hover: rgba(25, 36, 62, 0.95);
      --border-color: rgba(56, 189, 248, 0.16);
      --border-glow: rgba(56, 189, 248, 0.35);
      --primary: #38bdf8;
      --primary-dark: #0284c7;
      --accent-cyan: #06b6d4;
      --accent-indigo: #6366f1;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --accent-purple: #a855f7;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --ambient-1: rgba(56, 189, 248, 0.12);
      --ambient-2: rgba(99, 102, 241, 0.08);
      --card-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
    }

    [data-theme="ultraviolet"] {
      --bg-dark: #0d061a;
      --bg-card: rgba(28, 16, 50, 0.85);
      --bg-card-hover: rgba(42, 24, 76, 0.95);
      --border-color: rgba(192, 132, 252, 0.22);
      --border-glow: rgba(217, 70, 239, 0.45);
      --primary: #c084fc;
      --primary-dark: #9333ea;
      --accent-cyan: #38bdf8;
      --accent-indigo: #a855f7;
      --accent-emerald: #34d399;
      --accent-amber: #fbbf24;
      --accent-rose: #f43f5e;
      --accent-purple: #e879f9;
      --text-main: #faf5ff;
      --text-muted: #d8b4fe;
      --text-dim: #9333ea;
      --ambient-1: rgba(192, 132, 252, 0.16);
      --ambient-2: rgba(244, 63, 94, 0.1);
      --card-shadow: 0 12px 40px rgba(13, 6, 26, 0.7);
    }

    [data-theme="emerald-matrix"] {
      --bg-dark: #040d0a;
      --bg-card: rgba(9, 30, 22, 0.85);
      --bg-card-hover: rgba(15, 46, 34, 0.95);
      --border-color: rgba(52, 211, 153, 0.22);
      --border-glow: rgba(16, 185, 129, 0.45);
      --primary: #34d399;
      --primary-dark: #059669;
      --accent-cyan: #2dd4bf;
      --accent-indigo: #0ea5e9;
      --accent-emerald: #10b981;
      --accent-amber: #fbbf24;
      --accent-rose: #fb7185;
      --accent-purple: #a7f3d0;
      --text-main: #f0fdf4;
      --text-muted: #a7f3d0;
      --text-dim: #059669;
      --ambient-1: rgba(52, 211, 153, 0.14);
      --ambient-2: rgba(45, 212, 191, 0.08);
      --card-shadow: 0 12px 40px rgba(2, 20, 14, 0.7);
    }

    [data-theme="sunset-gold"] {
      --bg-dark: #120c08;
      --bg-card: rgba(36, 24, 18, 0.85);
      --bg-card-hover: rgba(54, 36, 26, 0.95);
      --border-color: rgba(251, 191, 36, 0.22);
      --border-glow: rgba(245, 158, 11, 0.45);
      --primary: #fbbf24;
      --primary-dark: #d97706;
      --accent-cyan: #38bdf8;
      --accent-indigo: #fb923c;
      --accent-emerald: #34d399;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --accent-purple: #fcd34d;
      --text-main: #fffbeb;
      --text-muted: #fed7aa;
      --text-dim: #b45309;
      --ambient-1: rgba(251, 191, 36, 0.14);
      --ambient-2: rgba(244, 63, 94, 0.09);
      --card-shadow: 0 12px 40px rgba(18, 12, 8, 0.7);
    }

    /* Interactive Particle Canvas */
    #star-canvas {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      opacity: 0.85;
    }

    /* Top bar theme selector buttons */
    .theme-group {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 2px 4px;
      gap: 2px;
    }

    .theme-dot-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
    }

    .theme-dot-btn:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.08);
    }

    .theme-dot-btn.active {
      color: #020617;
      background: var(--primary);
      box-shadow: 0 0 10px var(--border-glow);
    }

    /* ========================================================= */
    /* ATTRACTIVE CINEMATIC ANIMATIONS EVERY TIME SLIDE CHANGES  */
    /* ========================================================= */

    @keyframes slideInUp {
      0% {
        opacity: 0;
        transform: translateY(28px) scale(0.97);
        filter: blur(4px);
      }
      70% {
        transform: translateY(-2px) scale(1.004);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
    }

    @keyframes slideInSide {
      0% {
        opacity: 0;
        transform: translateX(30px);
      }
      100% {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes glowSweep {
      0% {
        box-shadow: 0 0 0 rgba(56, 189, 248, 0);
      }
      50% {
        box-shadow: 0 0 25px var(--border-glow);
      }
      100% {
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      }
    }

    @keyframes laserPulse {
      0%, 100% {
        transform: translateY(0);
        color: var(--primary);
        filter: drop-shadow(0 0 2px var(--primary));
      }
      50% {
        transform: translateY(5px);
        color: #fff;
        filter: drop-shadow(0 0 10px var(--primary));
      }
    }

    @keyframes badgePop {
      0% {
        transform: scale(0.85);
        opacity: 0;
      }
      60% {
        transform: scale(1.08);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Staggered entry rules on active slide */
    .slide.active .slide-header {
      animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;
    }

    .slide.active .slide-tag {
      animation: badgePop 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
    }

    .slide.active .block-hero-card {
      animation: slideInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both, glowSweep 1.2s ease-out 0.2s both;
    }

    .slide.active .card:nth-child(1) {
      animation: slideInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
    }
    .slide.active .card:nth-child(2) {
      animation: slideInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both;
    }
    .slide.active .card:nth-child(3) {
      animation: slideInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.30s both;
    }

    .slide.active .step-card:nth-child(1) { animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both; }
    .slide.active .step-card:nth-child(3) { animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both; }
    .slide.active .step-card:nth-child(5) { animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.32s both; }

    .slide.active .compare-card.eng { animation: slideInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both; }
    .slide.active .compare-card.biz { animation: slideInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both; }

    .slide.active .example-step {
      animation: slideInSide 0.45s ease-out both;
    }
    .slide.active .example-step:nth-child(1) { animation-delay: 0.25s; }
    .slide.active .example-step:nth-child(3) { animation-delay: 0.35s; }
    .slide.active .example-step:nth-child(5) { animation-delay: 0.45s; }

    /* Canvas 9-box stagger entrance */
    .slide.active .bmc-box:nth-child(1) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both; }
    .slide.active .bmc-box:nth-child(2) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.14s both; }
    .slide.active .bmc-box:nth-child(3) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.20s both; }
    .slide.active .bmc-box:nth-child(4) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.26s both; }
    .slide.active .bmc-box:nth-child(5) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.32s both; }
    .slide.active .bmc-box:nth-child(6) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.38s both; }
    .slide.active .bmc-box:nth-child(7) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.44s both; }
    .slide.active .bmc-box:nth-child(8) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.50s both; }
    .slide.active .bmc-box:nth-child(9) { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.56s both; }

    .slide.active .game-card {
      animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
    }

    .slide.active .punchline-bar {
      animation: slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
    }

    .flow-arrow {
      animation: laserPulse 1.8s ease-in-out infinite;
    }

    /* Interactive 3D hover & ripple */
    .card, .bmc-box, .step-card {
      box-shadow: var(--card-shadow);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease;
    }

    .card:hover, .bmc-box:hover, .step-card:hover {
      transform: translateY(-4px) scale(1.012);
      border-color: var(--primary);
      box-shadow: 0 16px 45px rgba(0, 0, 0, 0.55), 0 0 20px var(--border-glow);
    }
    """

    # Inject new styles right before </style>
    content = content.replace('</style>', new_styles + '\n  </style>')

    # 4. Inject Background Canvas after <body>
    canvas_html = '<canvas id="star-canvas"></canvas>'
    content = content.replace('<div class="ambient-glow"></div>', canvas_html + '\n  <div class="ambient-glow"></div>')

    # 5. Inject Top Bar Theme switcher & Sound toggle
    top_bar_addons = """
      <div class="theme-group">
        <button class="theme-dot-btn active" data-theme-val="cyber-navy" title="Deep Cyber Navy">🌌 Navy</button>
        <button class="theme-dot-btn" data-theme-val="ultraviolet" title="Ultraviolet Synth">🔮 Violet</button>
        <button class="theme-dot-btn" data-theme-val="emerald-matrix" title="Emerald Matrix">🟢 Matrix</button>
        <button class="theme-dot-btn" data-theme-val="sunset-gold" title="Sunset Gold">⚡ Gold</button>
      </div>
      <button class="btn-icon" id="btn-sound" title="Sound Effects">
        <span id="sound-icon">🔊</span>
      </button>
    """
    content = content.replace(
        '<div class="controls-group">',
        '<div class="controls-group">\n' + top_bar_addons
    )

    # 6. Add Particle Animation, Web Audio Synthesizer, and Confetti Engine to JavaScript
    new_js = """
    // ==========================================
    // WEB AUDIO SOUND SYNTHESIZER (Zero external files)
    // ==========================================
    let audioCtx = null;
    let soundEnabled = true;

    function initAudio() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function playSound(type) {
      if (!soundEnabled) return;
      try {
        initAudio();
        if (!audioCtx) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'slide') {
          // Soft futuristic slide whoosh
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'click') {
          // Crisp clean glass tap
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(650, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else if (type === 'alert') {
          // Dual-tone timer alarm
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(1174, now + 0.15);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === 'reveal') {
          // Success harmonic chime
          [440, 554, 659, 880].forEach((freq, i) => {
            const chordOsc = audioCtx.createOscillator();
            const chordGain = audioCtx.createGain();
            chordOsc.connect(chordGain);
            chordGain.connect(audioCtx.destination);
            chordOsc.type = 'sine';
            chordOsc.frequency.setValueAtTime(freq, now + i * 0.05);
            chordGain.gain.setValueAtTime(0.05, now + i * 0.05);
            chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            chordOsc.start(now + i * 0.05);
            chordOsc.stop(now + 0.4);
          });
        }
      } catch (e) {
        // Audio policy ignore
      }
    }

    const btnSound = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
        btnSound.classList.toggle('active', soundEnabled);
        if (soundEnabled) playSound('click');
      });
    }

    // ==========================================
    // THEME SWITCHER
    // ==========================================
    const themeButtons = document.querySelectorAll('.theme-dot-btn');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme-val');
        document.documentElement.setAttribute('data-theme', theme);
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playSound('click');
      });
    });

    // ==========================================
    // INTERACTIVE PARTICLE CONSTELLATION CANVAS
    // ==========================================
    const canvas = document.getElementById('star-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let mouse = { x: null, y: null };

    function resizeCanvas() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.radius = Math.random() * 1.8 + 0.8;
        this.alpha = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse gentle repulsion
        if (mouse.x !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            this.x += dx * 0.02;
            this.y += dy * 0.02;
          }
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < 48; i++) {
      particles.push(new Particle());
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animateParticles);
    }
    animateParticles();
    """

    # Update updateSlide function to play sound and trigger animations
    content = content.replace(
        "activeSlide.classList.add('active');",
        "activeSlide.classList.add('active');\n      playSound('slide');"
    )

    content = content.replace(
        "// Initialize\n    updateSlide(1);",
        new_js + "\n    // Initialize\n    updateSlide(1);"
    )

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("index.html successfully upgraded!")

if __name__ == '__main__':
    upgrade()
