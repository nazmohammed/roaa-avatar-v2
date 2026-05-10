import { useCallback, useEffect, useRef, useState } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { getSpeechToken } from "./api";
import Avatar3D from "./components/Avatar3D";
import { SCENES, type Scene, type AgentItem, type TraineeItem, type HighlightGroup } from "./scenes";
import "./App.css";

const VOICE = "en-US-JennyNeural";

type SceneState =
  | "splash"
  | "ringing"
  | "roaa-speaking"
  | "revealing-items"
  | "closing-speech"
  | "waiting-for-presenter"
  | "ready-to-advance"
  | "finished"
  | "error";

export default function App() {
  const [sceneIndex, setSceneIndex] = useState(-1);
  const [state, setState] = useState<SceneState>("splash");
  const [revealedHighlights, setRevealedHighlights] = useState<number>(0);
  const [revealedItems, setRevealedItems] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [lowerThird, setLowerThird] = useState<{ name: string; title: string } | null>(null);

  const visemeRef = useRef<number>(0);
  const playGuardRef = useRef<number>(0);
  const highlightTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const scene: Scene | null =
    sceneIndex >= 0 && sceneIndex < SCENES.length ? SCENES[sceneIndex] : null;

  // TTS with viseme (captions removed — keywords shown instead)
  const speakSsml = useCallback(async (ssml: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const { token, region } = await getSpeechToken();
        const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
        speechConfig.speechSynthesisVoiceName = VOICE;
        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        synthesizer.visemeReceived = (_s, e) => { visemeRef.current = e.visemeId; };

        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            visemeRef.current = 0;
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) resolve();
            else reject(new Error(result.errorDetails || "TTS failed"));
            synthesizer.close();
          },
          (err) => {
            visemeRef.current = 0;
            reject(new Error(String(err)));
            synthesizer.close();
          },
        );
      } catch (err) { reject(err); }
    });
  }, []);

  // Helper: start timed highlight group reveals for a speech scene
  const startHighlightReveal = useCallback((highlights: HighlightGroup[], runId: number) => {
    highlightTimersRef.current.forEach(clearTimeout);
    highlightTimersRef.current = [];
    setRevealedHighlights(0);

    if (!highlights.length) return;

    // Spread groups across the speech — first group after 2s, then every 6s
    const firstDelay = 2000;
    const groupInterval = 6000;
    highlights.forEach((_, i) => {
      const timer = setTimeout(() => {
        if (playGuardRef.current !== runId) return;
        setRevealedHighlights(i + 1);
      }, firstDelay + i * groupInterval);
      highlightTimersRef.current.push(timer);
    });
  }, []);

  // Play a scene
  const playScene = useCallback(async (index: number) => {
    const runId = ++playGuardRef.current;
    const s = SCENES[index];
    if (!s) return;

    setRevealedItems(0);
    setRevealedHighlights(0);
    setErrorMsg("");
    setLowerThird(null);
    highlightTimersRef.current.forEach(clearTimeout);
    highlightTimersRef.current = [];

    try {
      if (s.kind === "speech") {
        setState("roaa-speaking");
        if (s.highlights?.length) startHighlightReveal(s.highlights, runId);
        await speakSsml(s.ssml);
        if (playGuardRef.current !== runId) return;
        // Show all remaining highlights when speech finishes
        if (s.highlights?.length) setRevealedHighlights(s.highlights.length);
        setState("ready-to-advance");

      } else if (s.kind === "live-speaker") {
        setState("waiting-for-presenter");
        setLowerThird({ name: s.speaker, title: "Riyadh Air Data Lead" });

      } else if (s.kind === "speech-with-items") {
        setState("roaa-speaking");
        await speakSsml(s.ssml);
        if (playGuardRef.current !== runId) return;
        // Caption stays visible during item reveal

        await new Promise((r) => setTimeout(r, 1500));
        if (playGuardRef.current !== runId) return;

        setState("revealing-items");
        for (let i = 0; i < s.items.length; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          if (playGuardRef.current !== runId) return;
          setRevealedItems(i + 1);
        }

        if (s.closingSsml && s.closingText) {
          await new Promise((r) => setTimeout(r, 2500));
          if (playGuardRef.current !== runId) return;
          setState("closing-speech");
          await speakSsml(s.closingSsml);
          if (playGuardRef.current !== runId) return;
          // Caption stays visible
        }
        setState("ready-to-advance");
      }
    } catch (err) {
      if (playGuardRef.current !== runId) return;
      setErrorMsg(`Speech failed: ${(err as Error).message}`);
      setState("error");
    }
  }, [speakSsml, startHighlightReveal]);

  // Play a phone ring tone using Web Audio API
  const playRingTone = useCallback(async (rings = 3) => {
    const audioCtx = new AudioContext();
    for (let i = 0; i < rings; i++) {
      // Two-tone ring (like a classic phone)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.value = 440;
      osc2.type = "sine";
      osc2.frequency.value = 480;
      gain.gain.value = 0.15;
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      osc1.start(now);
      osc2.start(now);
      // Ring for 0.8s, silence for 0.6s
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0, now + 0.8);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);

      await new Promise((r) => setTimeout(r, 1400));
    }
    audioCtx.close();
  }, []);

  const handleStart = useCallback(async () => {
    setState("ringing");
    await playRingTone(3);
    // After ringing, start scene 0 (ROAA answers the call)
    setSceneIndex(0);
    playScene(0);
  }, [playScene, playRingTone]);

  const handleNext = useCallback(() => {
    const next = sceneIndex + 1;
    if (next >= SCENES.length) { setState("finished"); setLowerThird(null); return; }
    setSceneIndex(next);
    playScene(next);
  }, [sceneIndex, playScene]);

  const handleRetry = useCallback(() => {
    playScene(sceneIndex);
  }, [sceneIndex, playScene]);

  // Keyboard: spacebar or right arrow to advance
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        if (state === "ready-to-advance" || state === "waiting-for-presenter") {
          handleNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, handleNext]);

  // Splash
  if (state === "splash") {
    return (
      <div className="v2-splash">
        <div className="v2-splash-content">
          <img src="/riyadh-air-logo.png" alt="Riyadh Air" className="v2-splash-logo" />
          <div className="v2-splash-title">ROAA</div>
          <div className="v2-splash-sub">Data & AI Hub — Town Hall</div>
          <button className="v2-splash-btn" onClick={handleStart}>▶ Start</button>
        </div>
      </div>
    );
  }

  // Ringing — phone call incoming before ROAA appears
  if (state === "ringing") {
    return (
      <div className="v2-stage v2-ringing-stage">
        <div className="v2-ringing-overlay">
          <div className="v2-ring-icon">📞</div>
          <div className="v2-ring-label">Incoming call from the future…</div>
        </div>
      </div>
    );
  }

  const isSpeaking = state === "roaa-speaking" || state === "closing-speech";
  const showAdvanceHint = state === "ready-to-advance" || state === "waiting-for-presenter";

  const highlights: HighlightGroup[] = scene?.kind === "speech" && scene.highlights ? scene.highlights : [];

  return (
    <div className="v2-stage">
      {/* Full-screen avatar */}
      <Avatar3D visemeRef={visemeRef} isSpeaking={isSpeaking} fullscreen />

      {/* Keyword highlight groups — fly in from the right during speech */}
      {revealedHighlights > 0 && highlights.length > 0 && (
        <div className="v2-highlights-overlay">
          {highlights.slice(0, revealedHighlights).map((group, gi) => (
            <div key={gi} className="v2-highlight-group" style={{ animationDelay: `${gi * 0.1}s` }}>
              {group.header && <div className="v2-highlight-header">{group.header}</div>}
              {group.items.map((text, ii) => (
                <div key={ii} className="v2-highlight-card" style={{ animationDelay: `${gi * 0.1 + ii * 0.12}s` }}>
                  <span className="v2-highlight-text">{text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Lower third for presenters */}
      {lowerThird && (
        <div className="v2-lower-third">
          <div className="v2-lt-name">{lowerThird.name}</div>
          <div className="v2-lt-title">{lowerThird.title}</div>
        </div>
      )}

      {/* Overlay cards for agents/trainees */}
      {scene?.kind === "speech-with-items" && revealedItems > 0 && (
        <div className={`v2-cards-overlay ${scene.itemType}`}>
          {scene.items.slice(0, revealedItems).map((item, i) => (
            <div key={i} className={`v2-card ${scene.itemType}`} style={{ animationDelay: `${i * 0.15}s` }}>
              {"purpose" in item ? (
                <>
                  <div className="v2-card-name">{(item as AgentItem).name}</div>
                  <div className="v2-card-desc">{(item as AgentItem).purpose}</div>
                </>
              ) : (
                <div className="v2-card-name">{(item as TraineeItem).name}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Subtle advance hint — bottom right corner */}
      {showAdvanceHint && (
        <div className="v2-advance-hint" onClick={handleNext}>
          Press Space or click to continue ▶
        </div>
      )}

      {/* Error overlay */}
      {state === "error" && (
        <div className="v2-error-overlay">
          <div>⚠️ {errorMsg}</div>
          <button onClick={handleRetry}>Retry</button>
          <button onClick={handleNext}>Skip</button>
        </div>
      )}

      {/* Finished */}
      {state === "finished" && (
        <div className="v2-finished-overlay">
          <img src="/riyadh-air-logo.png" alt="Riyadh Air" style={{ height: 80, opacity: 0.9 }} />
          <div className="v2-finished-tagline">Together, we are building what's next.</div>
        </div>
      )}
    </div>
  );
}
