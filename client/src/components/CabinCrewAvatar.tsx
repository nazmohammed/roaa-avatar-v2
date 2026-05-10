/**
 * CabinCrewAvatar — SVG cabin crew avatar with Azure Speech viseme lip-sync.
 *
 * Maps Azure TTS visemeId (0-21) to distinct SVG mouth path shapes.
 * Smoothly interpolates between mouth positions for natural lip-sync.
 */

import { useEffect, useRef, useState } from "react";

// ── Viseme mouth shapes ─────────────────────────────────────────
// Each viseme maps to a mouth path (d attribute) and optional jaw drop

interface MouthShape {
  upper: string;   // upper lip path
  lower: string;   // lower lip / jaw path
  opening: number; // 0 = closed, 1 = wide open
}

const VISEME_MOUTHS: Record<number, MouthShape> = {
  // 0: Silence — relaxed closed mouth
  0:  { upper: "M88 120 Q100 121 112 120", lower: "M88 120 Q100 122 112 120", opening: 0 },
  // 1: p, b, m — lips pressed together
  1:  { upper: "M86 120 Q100 119 114 120", lower: "M86 120 Q100 120 114 120", opening: 0 },
  // 2: f, v — lower lip tucked under upper teeth
  2:  { upper: "M88 119 Q100 118 112 119", lower: "M89 121 Q100 124 111 121", opening: 0.2 },
  // 3: θ, ð (th) — tongue between teeth, slight opening
  3:  { upper: "M88 119 Q100 118 112 119", lower: "M89 122 Q100 125 111 122", opening: 0.25 },
  // 4: t, d, n — tongue behind teeth, small opening
  4:  { upper: "M89 119 Q100 118 111 119", lower: "M90 122 Q100 125 110 122", opening: 0.3 },
  // 5: k, g — back of mouth, medium opening
  5:  { upper: "M89 119 Q100 117 111 119", lower: "M90 123 Q100 127 110 123", opening: 0.45 },
  // 6: tʃ, dʒ, ʃ (ch, sh) — rounded, pushed forward
  6:  { upper: "M90 119 Q100 117 110 119", lower: "M91 122 Q100 126 109 122", opening: 0.35 },
  // 7: s, z — narrow slit
  7:  { upper: "M90 120 Q100 119 110 120", lower: "M91 121 Q100 123 109 121", opening: 0.15 },
  // 8: n, l — tongue up, medium
  8:  { upper: "M89 119 Q100 118 111 119", lower: "M90 122 Q100 126 110 122", opening: 0.35 },
  // 9: r — slightly rounded
  9:  { upper: "M90 119 Q100 117 110 119", lower: "M91 122 Q100 125 109 122", opening: 0.3 },
  // 10: æ (cat) — wide open
  10: { upper: "M87 119 Q100 116 113 119", lower: "M88 124 Q100 130 112 124", opening: 0.7 },
  // 11: ɛ (bed) — medium wide
  11: { upper: "M88 119 Q100 117 112 119", lower: "M89 123 Q100 128 111 123", opening: 0.55 },
  // 12: ɪ (bit) — wide, slightly closed
  12: { upper: "M87 119 Q100 118 113 119", lower: "M88 122 Q100 125 112 122", opening: 0.35 },
  // 13: ɔ (bought) — rounded open
  13: { upper: "M91 119 Q100 116 109 119", lower: "M92 123 Q100 129 108 123", opening: 0.6 },
  // 14: ʊ (book) — small rounded
  14: { upper: "M92 119 Q100 117 108 119", lower: "M93 122 Q100 126 107 122", opening: 0.35 },
  // 15: ɑ (father) — wide open round
  15: { upper: "M88 119 Q100 115 112 119", lower: "M89 125 Q100 132 111 125", opening: 0.8 },
  // 16: aʊ (how) — transition, open round
  16: { upper: "M90 119 Q100 115 110 119", lower: "M91 124 Q100 130 109 124", opening: 0.65 },
  // 17: ɔɪ (boy) — rounded medium
  17: { upper: "M91 119 Q100 116 109 119", lower: "M92 123 Q100 128 108 123", opening: 0.5 },
  // 18: eɪ (say) — wide medium
  18: { upper: "M87 119 Q100 118 113 119", lower: "M88 122 Q100 126 112 122", opening: 0.4 },
  // 19: oʊ (go) — rounded small
  19: { upper: "M92 119 Q100 117 108 119", lower: "M93 122 Q100 127 107 122", opening: 0.45 },
  // 20: ər (bird) — neutral medium
  20: { upper: "M89 119 Q100 118 111 119", lower: "M90 122 Q100 126 110 122", opening: 0.35 },
  // 21: aɪ (my) — wide open to narrow
  21: { upper: "M87 119 Q100 116 113 119", lower: "M88 124 Q100 130 112 124", opening: 0.65 },
};

interface CabinCrewAvatarProps {
  visemeRef: React.MutableRefObject<number>;
  isSpeaking: boolean;
  size?: number;
}

export default function CabinCrewAvatar({ visemeRef, isSpeaking, size = 320 }: CabinCrewAvatarProps) {
  const [mouthUpper, setMouthUpper] = useState(VISEME_MOUTHS[0].upper);
  const [mouthLower, setMouthLower] = useState(VISEME_MOUTHS[0].lower);
  const [eyeBlinkL, setEyeBlinkL] = useState(1);
  const [eyeBlinkR, setEyeBlinkR] = useState(1);
  const [breatheY, setBreatheY] = useState(0);
  const animRef = useRef<number>(0);
  const blinkTimer = useRef(0);
  const breatheT = useRef(0);

  useEffect(() => {
    let prevUpper = VISEME_MOUTHS[0].upper;
    let prevLower = VISEME_MOUTHS[0].lower;

    const animate = () => {
      // ── Lip-sync ──
      const vid = visemeRef.current;
      const target = VISEME_MOUTHS[vid] || VISEME_MOUTHS[0];

      // For SVG we swap paths instantly (they animate via CSS transition)
      if (target.upper !== prevUpper || target.lower !== prevLower) {
        setMouthUpper(target.upper);
        setMouthLower(target.lower);
        prevUpper = target.upper;
        prevLower = target.lower;
      }

      // If not speaking, decay to closed mouth
      if (!isSpeaking && vid === 0) {
        setMouthUpper(VISEME_MOUTHS[0].upper);
        setMouthLower(VISEME_MOUTHS[0].lower);
      }

      // ── Eye blink ──
      blinkTimer.current += 16; // ~60fps
      if (blinkTimer.current > 3000 + Math.random() * 2000) {
        // Blink
        setEyeBlinkL(0.1);
        setEyeBlinkR(0.1);
        setTimeout(() => { setEyeBlinkL(1); setEyeBlinkR(1); }, 150);
        blinkTimer.current = 0;
      }

      // ── Breathing ──
      breatheT.current += 0.02;
      setBreatheY(Math.sin(breatheT.current) * 0.8);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [visemeRef, isSpeaking]);

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="av-glow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="av-uniform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#3b0d7a" />
        </linearGradient>
        <linearGradient id="av-scarf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d4a843" />
          <stop offset="100%" stopColor="#b8922e" />
        </linearGradient>
        <linearGradient id="av-skin" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#f0c8a0" />
          <stop offset="100%" stopColor="#e0b088" />
        </linearGradient>
        <linearGradient id="av-hair" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#2d1a0e" />
          <stop offset="100%" stopColor="#1a0f08" />
        </linearGradient>
        <linearGradient id="av-hat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="av-lip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c07070" />
          <stop offset="100%" stopColor="#a05555" />
        </linearGradient>
      </defs>

      <g transform={`translate(0, ${breatheY})`}>
        {/* Background glow */}
        <ellipse cx="100" cy="105" rx="95" ry="105" fill="url(#av-glow)" />

        {/* ── Body / Uniform ── */}
        <path d="M45 175 Q45 150 65 140 L100 133 L135 140 Q155 150 155 175 L155 220 L45 220 Z" fill="url(#av-uniform)" />
        {/* Lapel lines */}
        <path d="M82 140 L100 158 L90 175" fill="none" stroke="#d4a843" strokeWidth="1.2" opacity="0.6" />
        <path d="M118 140 L100 158 L110 175" fill="none" stroke="#d4a843" strokeWidth="1.2" opacity="0.6" />
        {/* Wing pin */}
        <path d="M88 152 L100 148 L112 152 L100 150 Z" fill="#d4a843" />
        <circle cx="100" cy="150" r="2.5" fill="#f5d77a" />
        {/* Epaulettes */}
        <rect x="62" y="140" width="12" height="3" rx="1.5" fill="#d4a843" opacity="0.7" transform="rotate(-15, 68, 141.5)" />
        <rect x="126" y="140" width="12" height="3" rx="1.5" fill="#d4a843" opacity="0.7" transform="rotate(15, 132, 141.5)" />

        {/* ── Neck ── */}
        <rect x="90" y="123" width="20" height="20" rx="5" fill="url(#av-skin)" />

        {/* ── Scarf ── */}
        <path d="M82 137 Q92 130 100 137 Q108 130 118 137 L115 146 Q108 139 100 146 Q92 139 85 146 Z" fill="url(#av-scarf)" />
        <path d="M97 146 L100 165 L103 146" fill="#b8922e" opacity="0.5" />

        {/* ── Face ── */}
        <ellipse cx="100" cy="103" rx="31" ry="35" fill="url(#av-skin)" />

        {/* ── Hair ── */}
        <path d="M67 94 Q67 58 100 54 Q133 58 133 94 L133 100 Q129 78 100 73 Q71 78 67 100 Z" fill="url(#av-hair)" />
        <path d="M69 94 Q69 100 71 110 L73 104 Q71 94 73 86 Z" fill="url(#av-hair)" />
        <path d="M131 94 Q131 100 129 110 L127 104 Q129 94 127 86 Z" fill="url(#av-hair)" />

        {/* ── Eyes ── */}
        <g>
          {/* Left eye */}
          <ellipse cx="87" cy="100" rx="5" ry={5 * eyeBlinkL} fill="white" />
          <ellipse cx="87" cy="100" rx="3.5" ry={3.5 * eyeBlinkL} fill="#3d2414" />
          <circle cx="88.5" cy={100 - 1 * eyeBlinkL} r="1.3" fill="white" opacity="0.8" />
          {/* Eyelashes */}
          <path d={`M81 ${100 - 4 * eyeBlinkL} Q87 ${100 - 6 * eyeBlinkL} 93 ${100 - 4 * eyeBlinkL}`}
            fill="none" stroke="#1a0f08" strokeWidth="1.2" strokeLinecap="round" />
          {/* Right eye */}
          <ellipse cx="113" cy="100" rx="5" ry={5 * eyeBlinkR} fill="white" />
          <ellipse cx="113" cy="100" rx="3.5" ry={3.5 * eyeBlinkR} fill="#3d2414" />
          <circle cx="114.5" cy={100 - 1 * eyeBlinkR} r="1.3" fill="white" opacity="0.8" />
          <path d={`M107 ${100 - 4 * eyeBlinkR} Q113 ${100 - 6 * eyeBlinkR} 119 ${100 - 4 * eyeBlinkR}`}
            fill="none" stroke="#1a0f08" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Eyebrows */}
        <path d="M80 92 Q87 88 94 91" fill="none" stroke="#2d1a0e" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M106 91 Q113 88 120 92" fill="none" stroke="#2d1a0e" strokeWidth="1.8" strokeLinecap="round" />

        {/* ── Nose ── */}
        <path d="M100 104 Q98 110 96 113 Q100 115 104 113 Q102 110 100 104" fill="none" stroke="#d4a07a" strokeWidth="0.9" />
        <circle cx="96" cy="113" r="1" fill="#d4a07a" opacity="0.4" />
        <circle cx="104" cy="113" r="1" fill="#d4a07a" opacity="0.4" />

        {/* ── Mouth (viseme-driven) ── */}
        <path d={mouthUpper} fill="none" stroke="url(#av-lip)" strokeWidth="2" strokeLinecap="round" />
        <path d={mouthLower} fill="none" stroke="url(#av-lip)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Mouth interior (fill between upper and lower lips) */}
        <path d={`${mouthUpper} L112 120 ${mouthLower.replace("M", "L")} L88 120 Z`}
          fill="#5a2020" opacity={isSpeaking ? 0.6 : 0.1} />
        {/* Teeth hint (visible when mouth is open) */}
        {isSpeaking && (
          <path d={`M92 120 Q100 119 108 120`} fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        )}

        {/* ── Hat / Pillbox ── */}
        <path d="M67 82 Q67 64 100 60 Q133 64 133 82 L131 87 Q131 72 100 67 Q69 72 69 87 Z" fill="url(#av-hat)" />
        <path d="M65 85 Q65 80 100 76 Q135 80 135 85 Q135 89 100 85 Q65 89 65 85 Z" fill="#5b21b6" />
        {/* Gold hat band */}
        <rect x="76" y="75" width="48" height="3.5" rx="1.75" fill="#d4a843" opacity="0.9" />
        {/* Wings emblem */}
        <path d="M89 70 L100 66 L111 70 L100 68 Z" fill="#d4a843" />
        <circle cx="100" cy="68" r="1.5" fill="#f5d77a" />

        {/* ── Ears (behind hair) ── */}
        <ellipse cx="68" cy="103" rx="4" ry="6" fill="url(#av-skin)" opacity="0.6" />
        <ellipse cx="132" cy="103" rx="4" ry="6" fill="url(#av-skin)" opacity="0.6" />
      </g>
    </svg>
  );
}
