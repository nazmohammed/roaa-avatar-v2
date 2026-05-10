import { useEffect, useRef, useState, type MutableRefObject } from "react";

interface Props {
  visemeRef: MutableRefObject<number>;
  isSpeaking: boolean;
  size?: number;
}

/* ── Mouth shape paths for each Azure viseme ID (0-21) ─────────────
   These are positioned relative to a 200×100 SVG viewBox that sits
   over the mouth region of the portrait photo. */
const MOUTH_SHAPES: Record<number, { upper: string; lower: string; openness: number }> = {
  0:  { upper: "M60,50 Q100,48 140,50", lower: "M60,50 Q100,52 140,50", openness: 0 },      // sil - closed
  1:  { upper: "M55,48 Q100,42 145,48", lower: "M55,52 Q100,65 145,52", openness: 0.4 },     // æ
  2:  { upper: "M50,46 Q100,38 150,46", lower: "M50,54 Q100,72 150,54", openness: 0.7 },     // ɑ (wide open)
  3:  { upper: "M65,47 Q100,42 135,47", lower: "M65,53 Q100,65 135,53", openness: 0.5 },     // ɔ
  4:  { upper: "M60,48 Q100,44 140,48", lower: "M60,52 Q100,60 140,52", openness: 0.3 },     // ɛ
  5:  { upper: "M60,48 Q100,45 140,48", lower: "M60,52 Q100,58 140,52", openness: 0.25 },    // ɝ
  6:  { upper: "M65,48 Q100,44 135,48", lower: "M65,52 Q100,60 135,52", openness: 0.3 },     // ɪ
  7:  { upper: "M70,48 Q100,44 130,48", lower: "M70,52 Q100,62 130,52", openness: 0.35 },    // u
  8:  { upper: "M68,47 Q100,43 132,47", lower: "M68,53 Q100,63 132,53", openness: 0.4 },     // ʊ
  9:  { upper: "M70,48 Q100,45 130,48", lower: "M70,52 Q100,58 130,52", openness: 0.25 },    // ʌ
  10: { upper: "M65,48 Q100,45 135,48", lower: "M65,52 Q100,57 135,52", openness: 0.2 },     // aʊ
  11: { upper: "M68,48 Q100,46 132,48", lower: "M68,52 Q100,56 132,52", openness: 0.2 },     // aɪ
  12: { upper: "M60,50 Q100,48 140,50", lower: "M60,50 Q100,52 140,50", openness: 0 },       // h
  13: { upper: "M65,48 Q100,45 135,48", lower: "M65,52 Q100,58 135,52", openness: 0.25 },    // ɹ
  14: { upper: "M60,48 Q100,46 140,48", lower: "M60,52 Q100,56 140,52", openness: 0.15 },    // n
  15: { upper: "M58,48 Q100,46 142,48", lower: "M58,52 Q100,55 142,52", openness: 0.12 },    // s
  16: { upper: "M62,48 Q100,45 138,48", lower: "M62,52 Q100,57 138,52", openness: 0.2 },     // ʃ
  17: { upper: "M55,48 Q100,46 145,48", lower: "M55,52 Q100,56 145,52", openness: 0.15 },    // θ
  18: { upper: "M58,49 Q100,47 142,49", lower: "M58,51 Q100,54 142,51", openness: 0.1 },     // f
  19: { upper: "M60,48 Q100,45 140,48", lower: "M60,52 Q100,58 140,52", openness: 0.25 },    // d
  20: { upper: "M65,48 Q100,44 135,48", lower: "M65,52 Q100,60 135,52", openness: 0.3 },     // k
  21: { upper: "M65,50 Q100,49 135,50", lower: "M65,50 Q100,51 135,50", openness: 0 },       // p (closed)
};

export default function PhotoAvatar({ visemeRef, isSpeaking, size = 400 }: Props) {
  const [viseme, setViseme] = useState(0);
  const [blinkState, setBlinkState] = useState(false);
  const frameRef = useRef(0);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Animation loop — read visemeRef and update state at ~30fps
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const v = visemeRef.current;
      setViseme((prev) => (prev !== v ? v : prev));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(frameRef.current); };
  }, [visemeRef]);

  // Eye blink animation
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 4000;
      blinkTimerRef.current = setTimeout(() => {
        setBlinkState(true);
        setTimeout(() => setBlinkState(false), 150);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimerRef.current);
  }, []);

  const mouth = MOUTH_SHAPES[viseme] ?? MOUTH_SHAPES[0];
  const w = size;
  const h = size * 1.25;

  return (
    <div
      className="photo-avatar"
      style={{
        width: w,
        height: h,
        position: "relative",
        overflow: "hidden",
        borderRadius: 20,
      }}
    >
      {/* Portrait photo */}
      <img
        src="/avatar-portrait.jpg"
        alt="ROAA Avatar"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          display: "block",
          animation: "breathe 4s ease-in-out infinite",
        }}
        draggable={false}
      />

      {/* Subtle glow when speaking */}
      {isSpeaking && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            boxShadow: "inset 0 0 60px rgba(138, 99, 210, 0.15)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Eye blink overlay */}
      <svg
        viewBox="0 0 400 500"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: blinkState ? 1 : 0,
          transition: "opacity 0.05s",
        }}
      >
        {/* Skin-colored rectangles over eye area to simulate blink */}
        <ellipse cx="155" cy="205" rx="28" ry="10" fill="#d4a984" opacity="0.85" />
        <ellipse cx="245" cy="205" rx="28" ry="10" fill="#d4a984" opacity="0.85" />
      </svg>

      {/* Mouth overlay — positioned over the lower face */}
      <svg
        viewBox="0 0 200 100"
        style={{
          position: "absolute",
          bottom: "18%",
          left: "25%",
          width: "50%",
          height: "16%",
          pointerEvents: "none",
        }}
      >
        {/* Lip shapes */}
        <defs>
          <filter id="mouth-blur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Upper lip */}
        <path
          d={mouth.upper}
          fill="none"
          stroke="#c27070"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#mouth-blur)"
          style={{ transition: "d 0.08s ease" }}
        />

        {/* Mouth opening (dark interior) */}
        {mouth.openness > 0.05 && (
          <path
            d={`${mouth.upper} L140,${50 + mouth.openness * 22} Q100,${50 + mouth.openness * 30} 60,${50 + mouth.openness * 22} Z`}
            fill="rgba(40, 15, 15, 0.7)"
            filter="url(#mouth-blur)"
            style={{ transition: "d 0.08s ease, opacity 0.08s" }}
          />
        )}

        {/* Lower lip */}
        <path
          d={mouth.lower}
          fill="none"
          stroke="#c27070"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#mouth-blur)"
          style={{ transition: "d 0.08s ease" }}
        />
      </svg>

      {/* Gradient overlays for polish */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          background: "linear-gradient(transparent, rgba(26, 16, 48, 0.6))",
          pointerEvents: "none",
          borderRadius: "0 0 20px 20px",
        }}
      />
    </div>
  );
}
