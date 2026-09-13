# BMC LIVE — Business Model Canvas Classroom Event Platform

BMC Live is a real-time, 16:9 projector-first interactive event platform for Business Model Canvas workshops, hackathons, and classroom competitions.

## 🚀 Key Features

- **16:9 Projector-First Stage Screen**: Designed specifically for classroom projectors (1920×1080) readable from the back of the classroom.
- **14 Live Event Scenes**: Seamless stage-by-stage layout transformation (Welcome QR, Live Participants, Team Shuffle, Captain Selection, Product Reveal, Timers, Pitching, Blind Scoring, Podium Reveal).
- **Public Mobile QR Join**: Dynamic SPA routing (`/join/:sessionCode`) supported on Vercel with zero 404s.
- **Live Floating Message Bubbles**: Real-time pre-grouping message animation using Framer Motion.
- **Blind Peer Scoring**: Captain-only 0–10 scoring with real-time response counters and locked statuses.
- **Demo Mode**: 30+ instant realistic engineering demo participants across 8 departments (AI, CSE, CY, ME, CE, ECE, EEE, IC).

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Lucide Icons, Canvas Confetti.
- **Realtime Sync**: Supabase Realtime & BroadcastChannel API.
- **Deployment**: Vercel SPA (`vercel.json` rewrites).

## 📦 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/Shreyas-k-p/BMC.git
cd BMC

# Install dependencies
npm install

# Run development server
npm run dev
```

### Production Build

```bash
npm run build
```

---

*Engineered for live classroom events, hackathons, and Business Model Canvas competitions.*
