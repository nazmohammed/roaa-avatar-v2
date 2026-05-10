/**
 * Scene definitions for the Riyadh Air Town Hall presentation.
 *
 * Each scene is a discriminated union — "speech" (ROAA TTS),
 * "live-speaker" (Nourah speaks in person), or "speech-with-items"
 * (ROAA introduces then cards reveal).
 */

const VOICE = "en-US-JennyNeural";
const ROAA = `<phoneme alphabet="ipa" ph="ɹuːɑː">ROAA</phoneme>`;

function ssml(text: string, rate = "+10%"): string {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="${VOICE}">
    <prosody rate="${rate}" pitch="+2%">${text}</prosody>
  </voice>
</speak>`;
}

// ── Item types ──────────────────────────────────────────────────

export interface AgentItem {
  id: string;
  name: string;
  purpose: string;
}

export interface TraineeItem {
  id: string;
  name: string;
}

export interface HighlightGroup {
  header?: string;
  items: string[];
}

// ── Scene types ─────────────────────────────────────────────────

interface SpeechScene {
  kind: "speech";
  id: string;
  title: string;
  speaker: string;
  transcriptText: string;
  ssml: string;
  highlights?: HighlightGroup[];
}

interface LiveSpeakerScene {
  kind: "live-speaker";
  id: string;
  title: string;
  speaker: string;
  transcriptText: string;
}

interface SpeechWithItemsScene {
  kind: "speech-with-items";
  id: string;
  title: string;
  speaker: string;
  transcriptText: string;
  ssml: string;
  closingText?: string;
  closingSsml?: string;
  items: AgentItem[] | TraineeItem[];
  itemType: "agent" | "trainee";
}

export type Scene = SpeechScene | LiveSpeakerScene | SpeechWithItemsScene;

// ── Placeholder data (fill in later) ────────────────────────────

export const AGENTS: AgentItem[] = [
  { id: "agent-1", name: "Agent Name 1", purpose: "Purpose description here" },
  { id: "agent-2", name: "Agent Name 2", purpose: "Purpose description here" },
  { id: "agent-3", name: "Agent Name 3", purpose: "Purpose description here" },
];

export const TRAINEES: TraineeItem[] = [
  { id: "t-1", name: "Trainee 1" },
  { id: "t-2", name: "Trainee 2" },
  { id: "t-3", name: "Trainee 3" },
  { id: "t-4", name: "Trainee 4" },
  { id: "t-5", name: "Trainee 5" },
  { id: "t-6", name: "Trainee 6" },
  { id: "t-7", name: "Trainee 7" },
  { id: "t-8", name: "Trainee 8" },
];

// ── Scenes ──────────────────────────────────────────────────────

export const SCENES: Scene[] = [
  // Scene 1 — ROAA Opening (called from the future)
  {
    kind: "speech",
    id: "scene-1",
    title: "Opening — Calling from the Future",
    speaker: "ROAA",
    transcriptText:
      "Hi Riyadh Air team — this is the future version of ROAA, where data and AI power every decision and possibility.",
    ssml: ssml(
      `Hi Riyadh Air team <break time="400ms"/> — this is the future version of ${ROAA} <break time="400ms"/>, where data and AI power every decision <break time="200ms"/> and possibility.`,
    ),
    highlights: [
      { items: ["Calling from the Future", "Data & AI Power"] },
    ],
  },

  // Scene 2 — Nourah asks: What does the future of ROAA look like?
  {
    kind: "live-speaker",
    id: "scene-2",
    title: "Nourah — What does the future look like?",
    speaker: "Nourah Alghamdi",
    transcriptText:
      "Hi ROAA… What does the future of ROAA look like?",
  },

  // Scene 3 — ROAA: Identity & Vision (long speech)
  {
    kind: "speech",
    id: "scene-3",
    title: "ROAA — Identity & Vision",
    speaker: "ROAA",
    transcriptText:
      "I'm not here as a robot or as AI designed to replace humans. I am ROAA — Riyadh Air Data & AI — created to represent how Riyadh Air is connecting the aviation industry with the future of the skies.\n\nMy appearance is inspired by our cabin crew because they are the face of our brand, the embodiment of our values, and one of the most important assets in delivering the Riyadh Air experience. At the same time, my futuristic and robotic identity symbolizes the digitally native airline we are building — one where Data and AI are not just technologies, but core pillars shaping every journey and experience.\n\nROAA reflects Riyadh Air's vision for the future: smarter operations, more personalized travel, seamless experiences, predictive services, and innovation at every touchpoint. Across the organization, we already have more than 100 Data and AI use cases designed to transform how airlines operate and how guests experience travel.\n\nThe conversation here is no longer about whether Data and AI will transform aviation — that future has already begun. The real question is: who will lead it first, and who will lead it the right way. Riyadh Air is building that future today.",
    ssml: ssml(
      `I'm not here as a robot <break time="200ms"/> or as AI designed to replace humans. <break time="400ms"/> I am ${ROAA} <break time="300ms"/> — Riyadh Air Data and AI <break time="300ms"/> — created to represent how Riyadh Air is connecting the aviation industry with the future of the skies. <break time="600ms"/>

My appearance is inspired by our cabin crew <break time="200ms"/> because they are the face of our brand, <break time="200ms"/> the embodiment of our values, <break time="200ms"/> and one of the most important assets in delivering the Riyadh Air experience. <break time="400ms"/> At the same time, my futuristic and robotic identity symbolizes the digitally native airline we are building <break time="300ms"/> — one where Data and AI are not just technologies, <break time="200ms"/> but core pillars shaping every journey and experience. <break time="600ms"/>

${ROAA} reflects Riyadh Air's vision for the future: <break time="300ms"/> smarter operations, <break time="200ms"/> more personalized travel, <break time="200ms"/> seamless experiences, <break time="200ms"/> predictive services, <break time="200ms"/> and innovation at every touchpoint. <break time="400ms"/> Across the organization, we already have more than 100 Data and AI use cases <break time="200ms"/> designed to transform how airlines operate <break time="200ms"/> and how guests experience travel. <break time="600ms"/>

The conversation here is no longer about whether Data and AI will transform aviation <break time="300ms"/> — that future has already begun. <break time="400ms"/> The real question is: <break time="300ms"/> who will lead it first, <break time="200ms"/> and who will lead it the right way. <break time="400ms"/> Riyadh Air is building that future today.`,
      "+5%",
    ),
    highlights: [
      {
        header: "Riyadh Air",
        items: ["Not Replacing Humans", "Inspired by Cabin Crew", "Digitally Native Airline", "Data & AI are Core Pillars"],
      },
      {
        header: "ROAA Reflects Future of Riyadh Air",
        items: ["Smarter Operations", "Seamless Experiences", "Predictive Services", "Innovation", "100+ D&AI Use Cases"],
      },
      {
        header: "Future Already Begun",
        items: ["Who Will Lead It First?"],
      },
    ],
  },
  {
    kind: "live-speaker",
    id: "scene-4",
    title: "Nourah — Are we on this path?",
    speaker: "Nourah Alghamdi",
    transcriptText:
      "This is making me wonder, ROAA — are we already on this path, or is this still a dream? Where are we at and how do we achieve our vision?",
  },

  // Scene 5 — ROAA: Progress & question back to Nourah
  {
    kind: "speech",
    id: "scene-5",
    title: "ROAA — Progress & Data as Strategic Asset",
    speaker: "ROAA",
    transcriptText:
      "We have already taken real and measurable steps in this journey through our investments in technology, people, and our growing data hub ecosystem. This is only the beginning, yet the progress is already visible through the solutions and products showcased in the ROAA Hub.\n\nAt Riyadh Air, we don't see data as just information — we treat Data as a strategic asset that powers innovation, decision-making, and the future of aviation.\n\nBut tell me, Nourah — what are your thoughts on why we introduced initiatives such as Adoption, the Academy, and ROAA itself? What role do you think they play in shaping a truly data- and AI-driven culture?",
    ssml: ssml(
      `We have already taken real and measurable steps in this journey <break time="200ms"/> through our investments in technology, <break time="200ms"/> people, <break time="200ms"/> and our growing data hub ecosystem. <break time="400ms"/> This is only the beginning, <break time="200ms"/> yet the progress is already visible through the solutions and products showcased in the ${ROAA} Hub. <break time="500ms"/>

At Riyadh Air, we don't see data as just information <break time="300ms"/> — we treat Data as a strategic asset <break time="200ms"/> that powers innovation, <break time="200ms"/> decision-making, <break time="200ms"/> and the future of aviation. <break time="600ms"/>

But tell me, Nourah <break time="400ms"/> — what are your thoughts on why we introduced initiatives such as Adoption, <break time="200ms"/> the Academy, <break time="200ms"/> and ${ROAA} itself? <break time="300ms"/> What role do you think they play in shaping a truly data- and AI-driven culture?`,
      "+5%",
    ),
    highlights: [
      {
        header: "Our Investments",
        items: ["Technology", "People", "Our Growing Data Hub Ecosystem"],
      },
      {
        header: "Data as Strategic Asset",
        items: ["Powers Innovation", "Decision-Making", "Future of Aviation"],
      },
      {
        header: "Initiatives",
        items: ["Adoption", "Academy", "ROAA"],
      },
    ],
  },
  {
    kind: "live-speaker",
    id: "scene-6",
    title: "Nourah — Her answer & next steps question",
    speaker: "Nourah Alghamdi",
    transcriptText:
      "(Nourah shares her thoughts)… What do we need to do, starting today — after you hear from me — to have this future?",
  },

  // Scene 7 — ROAA: Strategic advice & roadmap challenge
  {
    kind: "speech",
    id: "scene-7",
    title: "ROAA — Strategic Advice & Roadmap Challenge",
    speaker: "ROAA",
    transcriptText:
      "Hmm… now you're starting to test my qualifications — and how strong I can be as an advisor, Nourah. Let me give you a hint about where the real focus should be. Ready?\n\nIn Competitive Position — think: Where does Riyadh Air stand in the AI maturity curve compared to global airlines — and how do we leapfrog, not just catch up?\n\nFrom a Value & Prioritization point of view — focus on: With limited resources, where should we place our first big AI bet — revenue growth, cost reduction, or customer experience? How do we know if our AI investments are actually creating value, not just creating dashboards? What's the difference between an AI initiative that transforms the business and one that just looks good in a presentation?\n\nAnd from a Transformation & Change perspective — What's the hardest part of becoming a data-driven airline? How do you get a senior leader who doesn't believe in AI to become its strongest advocate? What does 'good' look like in 3 years — how will we know the transformation worked?\n\nGo find the answers, connect the dots, build your roadmap and strategy — and let's come back to walk through it with RX.",
    ssml: ssml(
      `Hmm <break time="400ms"/> now you're starting to test my qualifications <break time="300ms"/> — and how strong I can be as an advisor, Nourah. <break time="400ms"/> Let me give you a hint about where the real focus should be. <break time="300ms"/> Ready? <break time="600ms"/>

In Competitive Position <break time="300ms"/> — think: <break time="200ms"/> Where does Riyadh Air stand in the AI maturity curve compared to global airlines <break time="200ms"/> — and how do we leapfrog, <break time="200ms"/> not just catch up? <break time="500ms"/>

From a Value and Prioritization point of view <break time="300ms"/> — focus on: <break time="200ms"/> With limited resources, where should we place our first big AI bet <break time="200ms"/> — revenue growth, <break time="200ms"/> cost reduction, <break time="200ms"/> or customer experience? <break time="400ms"/> How do we know if our AI investments are actually creating value, <break time="200ms"/> not just creating dashboards? <break time="400ms"/> What's the difference between an AI initiative that transforms the business <break time="200ms"/> and one that just looks good in a presentation? <break time="500ms"/>

And from a Transformation and Change perspective <break time="300ms"/> — What's the hardest part of becoming a data-driven airline? <break time="400ms"/> How do you get a senior leader who doesn't believe in AI <break time="200ms"/> to become its strongest advocate? <break time="400ms"/> What does good look like in 3 years <break time="200ms"/> — how will we know the transformation worked? <break time="600ms"/>

Go find the answers, <break time="200ms"/> connect the dots, <break time="200ms"/> build your roadmap and strategy <break time="300ms"/> — and let's come back to walk through it with RX.`,
      "+5%",
    ),
    highlights: [
      {
        header: "🏁 Competitive Position",
        items: ["AI Maturity Curve", "Leapfrog, Not Catch Up"],
      },
      {
        header: "💡 Value & Prioritization",
        items: ["Revenue · Cost · CX", "Creating Value, Not Dashboards"],
      },
      {
        header: "🔄 Transformation & Change",
        items: ["Data-Driven Culture", "Strongest Advocate", "Build Your Roadmap"],
      },
    ],
  },
  {
    kind: "live-speaker",
    id: "scene-8",
    title: "Nourah — Thanks ROAA",
    speaker: "Nourah Alghamdi",
    transcriptText:
      "Thanks, ROAA…",
  },

  // Scene 9 — ROAA: Closing appreciation
  {
    kind: "speech",
    id: "scene-9",
    title: "ROAA — Closing Appreciation",
    speaker: "ROAA",
    transcriptText:
      "I would like to extend my sincere appreciation to all of our champions who have worked alongside the Data & AI team over the past two years. Your ideas, collaboration, dedication, and belief in this vision have been essential in shaping the value we are creating today and the future we are building for tomorrow. Without your contributions, this journey would not have been possible.\n\nAnd to my digital family — the teams turning ambition into reality and transforming innovation into real experiences every day — thank you for making the future real. Together, we are building what's next for Riyadh Air.",
    ssml: ssml(
      `I would like to extend my sincere appreciation <break time="200ms"/> to all of our champions <break time="200ms"/> who have worked alongside the Data and AI team over the past two years. <break time="400ms"/> Your ideas, <break time="200ms"/> collaboration, <break time="200ms"/> dedication, <break time="200ms"/> and belief in this vision <break time="200ms"/> have been essential in shaping the value we are creating today <break time="200ms"/> and the future we are building for tomorrow. <break time="400ms"/> Without your contributions, <break time="200ms"/> this journey would not have been possible. <break time="600ms"/>

And to my digital family <break time="400ms"/> — the teams turning ambition into reality <break time="200ms"/> and transforming innovation into real experiences every day <break time="300ms"/> — thank you for making the future real. <break time="500ms"/> Together, <break time="300ms"/> we are building what's next for Riyadh Air.`,
      "+5%",
    ),
    highlights: [
      {
        header: "🏆 Appreciation",
        items: ["Champions", "Collaboration & Dedication"],
      },
      {
        header: "💜 Digital Family",
        items: ["Turning Ambition into Reality", "Building What's Next"],
      },
    ],
  },
];
