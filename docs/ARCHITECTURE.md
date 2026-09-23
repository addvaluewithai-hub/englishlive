# EnglishLive — Final Architecture

Status: **authoritative build contract**  
Date: 2026-09-23

This document is the source of truth for the first production architecture of EnglishLive. When an implementation choice conflicts with this document, either change the implementation or update this document deliberately through review. Do not silently inherit behavior from reference repositories.

---

## 1. Product definition

EnglishLive is a **conversation-first English speaking product** for adults who already know some English but cannot use it comfortably in live conversation.

Initial curriculum target: **CEFR B1 → B2 conversation**.

The default product feeling is:

> I am talking to a person who knows me and is good at helping me speak better English.

It must **not** feel like:

> I opened a lesson and an animated teacher is reading exercises to me.

The character is the visual hero. The curriculum is mostly hidden. The application quietly chooses what to practice, collects evidence, gives timely support, and remembers the learner across sessions.

### Non-goals for the first release

- English from zero / alphabet-level A1 onboarding.
- A migration of the old `english-course` lessons.
- A clone of the Learn classroom UI.
- A scripted dialogue tree.
- A grammar-first syllabus.
- A pronunciation score that pretends transcription is exact.
- A large gamification, streak or social system before the core conversation is excellent.

---

## 2. Reference repositories and authority

EnglishLive is a new product. It owns its contracts and state.

### `pixilive`

Use it as the upstream/reference for character technology.

Important repository reality as of this document:

- `feat/character-engine` currently contains a newer **SVG character-engine** experiment.
- The Rive implementation that matches the six-character direction is on `feat/rive-native-character`, currently at commit `82267529104e01c8a8d80fa8cb67abc707f75d80`.
- That Rive branch contains:
  - Benny — Rive
  - Dino — Rive
  - Kiro — Rive
  - Ember/Foxy — HTML/SVG bridge
  - Milo — legacy Pixi fallback
  - Nova — legacy Pixi fallback

Therefore the first EnglishLive implementation is **Rive-first, renderer-abstracted**, not Pixi-first.

Do not make EnglishLive depend at runtime on a mutable PixiLive feature branch. Extract/copy the required stable character contracts and assets into EnglishLive at a pinned source revision, keeping provenance in code comments/docs. Later, if PixiLive publishes a stable package, EnglishLive may consume a versioned package after compatibility tests.

### `learn`

Use as reference for proven patterns only:

- Gemini Live lifecycle and interruption handling.
- Ephemeral-token architecture.
- Application-owned lesson/session state.
- Tool-call output gating around state transitions.
- Presentation/board contracts.
- Session resumption patterns.

Do not copy Learn's platform shell or classroom UX.

### `english-course`

Use only as curriculum research/reference:

- CEFR capability boundaries.
- Level exit profiles.
- Capability progression.
- Useful lexical/grammar/pronunciation inventories.

Do not migrate old lessons as the EnglishLive delivery model. EnglishLive authors new conversation missions.

---

## 3. Locked architectural decisions

1. **React + TypeScript + Vite** is the shared application stack.
2. **Rive is the default renderer for all new characters.** Legacy renderers may exist behind the same interface during transition.
3. **Capacitor** packages the web application for iOS and Android.
4. **Gemini Live** is the first live conversation provider, behind a provider-neutral transport interface.
5. **Cloudflare Workers/Pages** host the API and web build initially. The mobile app calls the same HTTPS API.
6. The application owns curriculum state. **The model never owns progression.**
7. The application owns memory. **Model context is not product memory.**
8. The character owns personality/performance style. **The character does not own curriculum.**
9. The Stage Director owns visual layout. **The model can request intent, never manipulate UI directly.**
10. Conversation missions are evidence/capability contracts, **not scripts**.
11. Raw automatic transcription is treated as uncertain evidence, not literal ground truth.
12. No Gemini API key or long-lived provider secret is shipped in web/mobile clients.

---

## 4. System overview

```text
┌──────────────────────────────── ENGLISHLIVE CLIENT ────────────────────────────────┐
│                                                                                   │
│  Product UI                                                                       │
│  Onboarding · Home · Character Select · Live Session · Review · Progress          │
│             │                                                                     │
│             ▼                                                                     │
│  ┌──────────────────────┐        ┌─────────────────────────────────────────────┐   │
│  │     StageDirector    │◀──────▶│              CharacterHost                  │   │
│  │ hero/board/roleplay  │        │ renderer abstraction                        │   │
│  └──────────┬───────────┘        │ Rive primary · HTML/Pixi legacy adapters    │   │
│             │                    └──────────────────┬──────────────────────────┘   │
│             ▼                                       │                              │
│  ┌──────────────────────┐                           │ performance / visemes         │
│  │   SupportBoard       │                           │                              │
│  └──────────────────────┘                           │                              │
│                                                     ▼                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                     ConversationSessionController                           │   │
│  │                                                                             │   │
│  │  TutorRuntime  ◀──── evidence ──── LiveTransport ─── audio ─── Mic/Playback │   │
│  │      │                                  │                                   │   │
│  │      │                                  └──── transcript/performance ──────┐│   │
│  │      ▼                                                                      ││   │
│  │  Mission State · Tools · Prompt Assembly · Local Session State              ││   │
│  └───────────────┬─────────────────────────────────────────────────────────────┘│   │
│                  │                                                              │   │
└──────────────────┼──────────────────────────────────────────────────────────────┼───┘
                   │ HTTPS                                                        │
                   ▼                                                              │
┌────────────────────────────── ENGLISHLIVE API ──────────────────────────────────┐│
│ Auth/session · ephemeral Live token · progress · memory · mission catalog       ││
│ post-session extraction/assessment · analytics                                  ││
└───────────────────────────────┬─────────────────────────────────────────────────┘│
                                │                                                   │
                                ▼                                                   │
                         Persistent database                                        │
                                                                                Gemini
                                                                                 Live
```

---

## 5. Character architecture

### 5.1 Renderer abstraction

EnglishLive must not make screens or curriculum code aware of Rive/Pixi/HTML.

```ts
export type CharacterRendererKind = 'rive' | 'html' | 'pixi';

export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  renderer: CharacterRendererConfig;
  persona: CharacterPersona;
  voice: CharacterVoiceProfile;
  framing: CharacterFraming;
  performance: CharacterPerformanceProfile;
}

export interface CharacterRenderer {
  mount(container: HTMLElement): Promise<void>;
  unmount(): Promise<void> | void;
  setSpeaking(value: boolean): void;
  setMouth(pose: MouthPose): void;
  setGaze(gaze: NormalizedPoint): void;
  setEmotion(emotion: CharacterEmotion): void;
  perform(cue: PerformanceCue): void;
  setFraming?(mode: StageMode): void;
}
```

`CharacterHost` chooses the adapter from `character.renderer.kind`.

### 5.2 Rive is the production path

All newly designed adult characters should use Rive.

The Rive implementation should preserve the useful contract already proven in PixiLive:

- `.riv` source
- artboard name
- state machine name
- auto-bound view model properties
- character-specific performance adapter
- generic behavior/performance intent

Canonical Rive channels should include, where supported:

```text
speaking

gazeX
gazeY

mouthOpen
mouthWidth
mouthRound
speechEnergy
lipPress
lowerLipBite
teeth
tongue
cornerPull

bodyY
bodyLean
headY
headTilt
leftHandX
leftHandY
rightHandX
rightHandY

eyeScale
browY
browTilt
smileOpacity
neutralOpacity
frownOpacity
expressionMouthOpacity
tearOpacity
sparkleOpacity
blushOpacity
tailTilt
```

A character may omit channels it cannot express. The performance adapter maps semantic intent to the anatomy it actually has.

### 5.3 Semantic performance, not animation micromanagement

Conversation code emits semantic cues such as:

```ts
{
  affect: 'warm',
  intensity: 0.55,
  gesture: 'reassure',
  gaze: 'user'
}
```

It must never emit bone positions or Rive state-machine internals.

Most motion is local and automatic:

- idle motion
- listening motion
- audio-energy response
- gaze
- lip sync
- small conversational gestures

The model may request rare semantic actions such as greet, celebrate, think, disagree, reassure or goodbye. Character performance must remain stable even if the model makes no performance tool call.

### 5.4 Personality is separate from renderer

Do not store the entire final Gemini system prompt in the character registry.

A character persona contains only identity/style information:

```ts
interface CharacterPersona {
  roleStyle: 'friend' | 'colleague' | 'coach' | 'traveler' | 'custom';
  traits: string[];
  conversationStyle: string;
  boundaries: string[];
}
```

The final prompt is assembled from:

```text
EnglishLive global conversation policy
+ character persona
+ learner profile
+ selected relationship memory
+ current mission contract
+ current mission state
+ teaching/assessment policy
```

This guarantees that switching characters changes the relationship and style without changing curriculum truth.

### 5.5 Initial six

The first build may expose the six current characters while design work continues:

- Benny
- Dino
- Ember/Foxy
- Kiro
- Milo
- Nova

The UI must tolerate different renderer types during this transition. New characters should not add another renderer type unless there is a reviewed architectural reason.

---

## 6. Live conversation architecture

### 6.1 Provider-neutral interface

```ts
interface LiveTransport {
  connect(config: LiveSessionConfig): Promise<void>;
  close(): void;
  sendAudio(pcm: ArrayBuffer): void;
  endAudioStream(): void;
  sendText(text: string): void;

  onInputTranscript(cb: (text: string) => void): Unsubscribe;
  onOutputTranscript(cb: (text: string) => void): Unsubscribe;
  onAudio(cb: (audio: LiveAudioChunk) => void): Unsubscribe;
  onToolCall(cb: (call: LiveToolCall) => Promise<LiveToolResult>): Unsubscribe;
  onInterrupted(cb: () => void): Unsubscribe;
  onStatus(cb: (status: LiveStatus) => void): Unsubscribe;
}
```

First implementation: `GeminiLiveTransport`.

No tutor/curriculum code imports Gemini protocol types directly.

### 6.2 Authentication

Client flow:

```text
EnglishLive client
   │ authenticated HTTPS
   ▼
EnglishLive API /live/token
   │ server-side Gemini secret
   ▼
short-lived / one-use Live credential
   │
   ▼
client connects directly to Gemini Live
```

Web can use same-origin API routes. Capacitor builds use configured `API_BASE_URL`.

Never expose long-lived Gemini credentials through `VITE_*`, mobile config, the JS bundle or a `.riv` asset.

### 6.3 Audio abstraction

Keep microphone and playback behind interfaces from day one:

```ts
interface MicrophoneSource {
  start(onPcm16k: (chunk: ArrayBuffer) => void): Promise<void>;
  stop(): Promise<void>;
}

interface AudioPlayback {
  enqueue(chunk: LiveAudioChunk): void;
  interrupt(): void;
  onSample(cb: (sample: PlaybackSample) => void): Unsubscribe;
}
```

Web implementation may use `AudioWorklet`. If iOS/Android WebView behavior is unreliable, add a Capacitor native implementation without changing TutorRuntime, CharacterHost or curriculum code.

### 6.4 Interruption is a first-class behavior

When the learner starts speaking while the character is talking:

1. stop queued playback immediately;
2. cancel current visual/performance cue;
3. mark provisional output as interrupted;
4. keep the Live session/context alive;
5. return the character to listening behavior;
6. do not accidentally apply state changes from stale model output.

### 6.5 Output gating

State-changing tools must use output gating.

If a model turn is expected to call a control tool such as `assess_mission_turn` or `finish_mission`, provisional model audio/text is buffered until the control transition is resolved. This prevents the learner hearing a response that assumes curriculum state which the app has not accepted.

---

## 7. Conversation Tutor Runtime

This is the core product layer.

### 7.1 The model is an actor inside the runtime

The runtime owns:

- active mission
- active capability targets
- accumulated evidence
- retries/repairs
- progression
- completion
- board/support state
- learner state exposed to the model

The model may propose/judge semantic evidence through tools, but it cannot directly mutate persistent progression.

### 7.2 Mission contract

A mission is not a script.

```ts
export interface ConversationMission {
  id: string;
  version: number;
  level: 'B1' | 'B2';
  title: string;
  learnerFacingSetup: string;

  scenario: {
    relationship: string;
    situation: string;
    openingIntent: string;
  };

  targets: CapabilityTarget[];
  recycle: CapabilityTarget[];

  evidenceRules: EvidenceRule[];
  repairStrategies: RepairStrategy[];
  supportCards?: SupportCard[];

  minimumMeaningfulTurns: number;
  completionPolicy: CompletionPolicy;
}
```

Example:

```ts
{
  id: 'b1-weekend-story-01',
  level: 'B1',
  title: 'Tell me what happened',
  learnerFacingSetup: 'Catch up after the weekend.',
  scenario: {
    relationship: 'friend',
    situation: 'Monday catch-up',
    openingIntent: 'Ask what the learner did and follow the interesting thread.'
  },
  targets: [
    { capability: 'narrate_past_events', weight: 1 },
    { capability: 'sequence_events', weight: 0.8 },
    { capability: 'respond_to_followups', weight: 0.7 }
  ],
  minimumMeaningfulTurns: 5
}
```

There is no authored learner answer and no fixed model dialogue.

### 7.3 Capability graph

Curriculum hierarchy:

```text
CEFR level
  └── capability family
       └── capability
            ├── prerequisite links
            ├── evidence requirements
            ├── recycle spacing
            └── missions that can elicit it
```

Initial B1/B2 families:

- keeping a conversation alive
- personal storytelling / narration
- opinions and reasons
- clarification and repair
- agreeing/disagreeing naturally
- describing and comparing
- planning and negotiating
- work/social conversation
- travel/service situations
- explaining a problem
- handling uncertainty
- longer connected discussion

Grammar, vocabulary, chunks and pronunciation are support layers attached to capabilities; they are not the top-level learner journey.

### 7.4 Evidence model

```ts
interface ConversationEvidence {
  id: string;
  missionId: string;
  turnId: string;
  capabilityId: string;
  source: 'live_audio' | 'transcript' | 'typed' | 'choice';
  verdict: 'strong' | 'partial' | 'not_yet' | 'unclear';
  summary: string;
  confidence: number;
  createdAt: string;
}
```

Rules:

- Automatic transcript is an audit/support signal and may be wrong.
- If meaning is clear from the live interaction but transcript is poor, the semantic assessment may use `live_audio`.
- If meaning is unclear, ask naturally for a repeat/clarification; never invent exact words.
- One successful turn is usually not enough for durable mastery.
- Completion of a mission is not a certificate of CEFR mastery.
- Pronunciation-specific claims require separate evidence; transcript equality is not pronunciation scoring.

### 7.5 Core tools exposed to Live model

The exact API can evolve, but responsibility should stay close to:

```text
get_session_state
assess_mission_turn
present_support
request_character_action
finish_mission
```

`get_session_state` returns only compact current state.  
`assess_mission_turn` records a semantic judgment against an evidence rule.  
`present_support` requests a board/support visual.  
`request_character_action` requests a rare semantic performance cue.  
`finish_mission` succeeds only when the runtime's completion policy allows it.

Do not expose direct database tools, arbitrary UI commands or raw curriculum mutation.

---

## 8. Stage Director and board

### 8.1 Character-first visual rule

Default stage mode is `hero`.

```ts
type StageMode =
  | { kind: 'hero' }
  | { kind: 'board'; board: SupportBoard }
  | { kind: 'roleplay'; context: RoleplayVisual }
  | { kind: 'review' };
```

#### Hero

- character is large and centered;
- very little UI competes with the face;
- mic/status controls stay secondary.

#### Board

- character remains visible;
- character scales down and moves to the side/corner;
- board becomes the dominant content area;
- return to hero after the teaching/support moment.

#### Roleplay

- optional environment/context visual;
- still conversation-first, not a mini-game by default.

#### Review

- post-session progress/evidence summary;
- character may remain present in reduced form.

### 8.2 Board contract

Start small. Do not port every Learn board primitive just because it exists.

Initial board types:

```ts
type SupportBoard =
  | { type: 'phrase'; phrase: string; note?: string }
  | { type: 'contrast'; left: BoardItem; right: BoardItem; note?: string }
  | { type: 'steps'; title?: string; items: BoardItem[] }
  | { type: 'examples'; title?: string; items: BoardItem[] }
  | { type: 'image'; src: string; caption?: string };
```

The board is for useful moments such as:

- showing a phrase the learner is searching for;
- contrasting two forms;
- visualizing a correction after meaning is complete;
- giving a few options/chunks to unlock a stuck learner;
- supporting a roleplay.

Do not constantly show subtitles, grammar notes or a transcript while the learner is trying to converse. That shifts attention from speaking to reading.

### 8.3 Model requests intent, Stage Director decides layout

The model may request:

```ts
present_support({
  type: 'contrast',
  ...
})
```

The model never receives CSS/layout controls. `StageDirector` chooses animation, size, position, timing and safe-area behavior for web/mobile.

---

## 9. Prompt architecture

Do not maintain one huge hand-edited system prompt per character.

Prompt assembly:

```text
1. Global EnglishLive behavior contract
2. Character persona
3. Learner profile (small, relevant)
4. Relationship memory (small, relevant)
5. Current mission contract
6. Current mission state/evidence gaps
7. Tool-use and assessment protocol
8. Performance guidance
```

### Conversation style contract

- natural spoken English by default;
- concise turns; do not lecture;
- one conversational move at a time;
- genuine follow-up questions;
- learner should speak more than the AI over a session;
- correction should not interrupt every mistake;
- preserve meaning and flow first;
- teach explicitly when a repeated/high-value gap blocks the learner;
- avoid announcing grammar objectives unless useful;
- allow interruption;
- do not impersonate a formal assistant.

### Correction policy

Use three modes:

1. **Flow correction** — reformulate naturally without stopping the conversation.
2. **Micro-teach** — briefly surface a useful phrase/contrast, often with board.
3. **Review correction** — collect non-urgent patterns for the end of the session.

Do not correct every error in real time.

---

## 10. Memory architecture

Memory is explicit product state with three separate stores.

### 10.1 Learner profile

Stable learner facts relevant to the product:

```text
preferred name
English goal
self-reported context (work/travel/social/etc.)
interests chosen/shared by learner
preferred character
approximate starting level
settings
```

### 10.2 Learning memory

```text
capability evidence history
recently practiced targets
recurring language gaps
useful chunks introduced
items due for recycle
confidence/fluency observations with provenance
```

### 10.3 Relationship memory

Small facts that make the next conversation feel continuous:

```text
"had a presentation on Tuesday"
"is planning a trip to Spain"
"likes Formula 1"
"was deciding whether to change jobs"
```

Relationship memory should be selective, editable/deletable at the product layer, and must never become an uncontrolled transcript dump.

### 10.4 Session close pipeline

After a session:

```text
raw session events
   ↓
structured mission evidence
   ↓
learning-memory update
   ↓
relationship-memory candidate extraction
   ↓
small next-session context
```

Do not store raw audio by default. Store only what the product needs under the chosen privacy policy.

---

## 11. Persistence and backend

Initial backend: Cloudflare-hosted API with a relational persistence layer. Prefer the same operational family already familiar to the team (Workers/Pages + D1/Drizzle) unless a concrete requirement forces another database.

Core entities:

```text
users
learner_profiles
characters (configuration/version metadata)
capabilities
missions
mission_targets
sessions
session_turns          # optional/retention-controlled
conversation_evidence
capability_state
learning_memory
relationship_memory
user_settings
```

### Server responsibilities

- authentication/session validation;
- Live ephemeral credential issuance;
- mission catalog/version delivery;
- persistent progress;
- memory persistence;
- post-session extraction/normalization;
- analytics events;
- server-side provider secrets.

### Client responsibilities

- audio capture/playback;
- real-time Live socket;
- character rendering/performance;
- Stage Director;
- transient TutorRuntime/session state;
- optimistic visual state where safe.

Persistent progression should be versioned/serialized through the API, not only localStorage.

---

## 12. Web, iOS and Android

### 12.1 Shared application

One React app is built once and packaged with Capacitor.

```text
src/ shared product
web build
   ├── deployed to web
   ├── copied into ios/
   └── copied into android/
```

### 12.2 Platform boundary

```ts
interface PlatformServices {
  microphone: MicrophoneSource;
  playback: AudioPlayback;
  permissions: PermissionService;
  appLifecycle: AppLifecycleService;
  storage: SecureStorageService;
}
```

The first implementation may use browser APIs inside Capacitor. If device QA reveals problems, replace a platform service with a native Capacitor plugin instead of rewriting the product.

### 12.3 Mobile audio spike is an early gate

Before expanding curriculum, verify on real devices:

- microphone permission lifecycle;
- 16 kHz PCM path/resampling quality;
- speaker playback latency;
- interruption/barge-in;
- Bluetooth/headphones;
- app background/foreground;
- phone call/audio-focus interruption;
- Rive frame performance while streaming audio;
- long-session heat/memory behavior.

---

## 13. Suggested repository structure

```text
englishlive/
├── docs/
│   └── ARCHITECTURE.md
├── public/
│   ├── rive/
│   └── audio-capture.worklet.js
├── src/
│   ├── app/
│   │   ├── router/
│   │   └── providers/
│   ├── screens/
│   │   ├── Onboarding/
│   │   ├── CharacterSelect/
│   │   ├── Home/
│   │   ├── LiveSession/
│   │   └── SessionReview/
│   ├── character/
│   │   ├── CharacterHost.tsx
│   │   ├── registry.ts
│   │   ├── contract.ts
│   │   ├── performance/
│   │   └── renderers/
│   │       ├── rive/
│   │       ├── html/        # transitional only
│   │       └── pixi/        # transitional only
│   ├── audio/
│   │   ├── MicrophoneSource.ts
│   │   ├── AudioPlayback.ts
│   │   └── viseme/
│   ├── live/
│   │   ├── LiveTransport.ts
│   │   └── gemini/
│   ├── tutor/
│   │   ├── ConversationTutorRuntime.ts
│   │   ├── prompt/
│   │   ├── tools/
│   │   └── evidence/
│   ├── curriculum/
│   │   ├── capabilities/
│   │   ├── missions/
│   │   │   ├── b1/
│   │   │   └── b2/
│   │   └── types.ts
│   ├── presentation/
│   │   ├── StageDirector.ts
│   │   ├── SupportBoard.tsx
│   │   └── types.ts
│   ├── memory/
│   │   ├── learnerProfile.ts
│   │   ├── learningMemory.ts
│   │   └── relationshipMemory.ts
│   ├── session/
│   │   ├── ConversationSessionController.ts
│   │   └── types.ts
│   ├── platform/
│   │   ├── PlatformServices.ts
│   │   ├── web/
│   │   └── capacitor/
│   └── api/
├── functions/ or worker/
│   └── api/
├── tests/
├── capacitor.config.ts
├── package.json
└── README.md
```

Keep module dependencies directional:

```text
screens
  ↓
session controller
  ├── tutor runtime ──▶ curriculum
  ├── live transport
  ├── character host
  ├── stage director
  └── memory/api
```

Curriculum must never import UI, Rive, Gemini or Capacitor.

---

## 14. First vertical slice

Do not start by authoring dozens of missions.

Build exactly one end-to-end mission with one primary character, then verify the same runtime with a second character.

### Slice requirements

1. User selects a character.
2. App loads one B1 mission.
3. Character appears large in `hero` mode.
4. User starts an interruptible Gemini Live conversation.
5. Audio drives mouth/viseme/performance on the character.
6. TutorRuntime receives/records semantic evidence.
7. One moment intentionally invokes `present_support` and demonstrates hero → board → hero transition.
8. Runtime can stay/repair/advance without scripted dialogue.
9. Session finishes only through application-owned completion policy.
10. Review shows 2–4 useful observations, not a fake numeric fluency score.
11. Learning memory updates.
12. One relationship-memory detail is available in a second session.
13. Works in web Chrome/Safari, real iPhone and real Android.

### First mission suggestion

`B1 / Personal Story / Tell me what happened`

It naturally tests:

- connected narration;
- sequencing;
- past-event language;
- answering follow-up questions;
- conversational repair;
- ability to keep a story moving.

It also makes board support easy to demonstrate without turning the whole session into a lesson.

---

## 15. Build order

### Phase A — foundation

- initialize React/Vite/TypeScript project;
- add Capacitor shell;
- implement config + API base URL;
- implement `LiveTransport` contract + Gemini adapter;
- implement audio platform contracts;
- import/pin first Rive assets and build `CharacterHost`;
- implement one Rive renderer adapter;
- make real-device audio/Rive spike pass.

### Phase B — conversation core

- implement `ConversationMission` schema;
- implement `ConversationTutorRuntime`;
- implement tool protocol + output gating;
- implement evidence state;
- implement Stage Director + minimal board;
- author one B1 mission.

### Phase C — persistence

- auth/user/session API;
- save capability state;
- learning memory;
- relationship memory;
- session review.

### Phase D — character/catalog expansion

- wire the remaining initial characters behind the renderer abstraction;
- add adult Rive characters as they arrive;
- expand B1 capability graph and missions;
- then begin B2.

Do not reverse this order by building a large course catalog before the live loop is validated.

---

## 16. Testing strategy

### Deterministic unit tests

- mission schema validation;
- evidence accumulation;
- completion policy;
- progression cannot skip requirements;
- interrupted/stale tool results cannot mutate current state;
- memory selection limits;
- character registry compatibility;
- Stage Director transitions.

### Contract tests

- every Rive character has required source/artboard/state-machine metadata;
- declared Rive bindings are compatible with the renderer contract;
- every mission references valid capabilities;
- every capability has level/progression metadata;
- prompt assembly remains within configured context budgets.

### Integration tests

- fake Live transport drives TutorRuntime;
- output gating around state tools;
- session resume/reconnect;
- character switch outside/inside active session according to product policy;
- board transition while audio is playing;
- interruption cancels playback and stale performance.

### Device QA

Automated browser tests are not enough. Real-device voice QA is a release gate.

---

## 17. Explicit boundaries to protect

Do not let these shortcuts enter the codebase:

- `if (characterId === 'x')` inside curriculum/tutor logic;
- curriculum importing `@rive-app/*`;
- character registry containing mission order;
- Gemini client deciding mission completion by itself;
- UI reading raw model prose to infer state;
- storing all chat history and calling it "memory";
- using exact transcript text as proof of what the learner pronounced;
- letting board support become permanent subtitles;
- calling a feature branch directly as a production dependency;
- putting provider secrets in the client bundle.

---

## 18. Definition of architectural success

The architecture is working when all of the following are true:

- the same mission works unchanged with two visually different characters;
- a new Rive character can be added without touching curriculum code;
- a new mission can be added without touching character or Live protocol code;
- Gemini Live can be replaced behind `LiveTransport` without rewriting the curriculum;
- the board can change presentation without changing mission state;
- mobile audio can switch from browser implementation to native implementation without changing TutorRuntime;
- relationship memory can make a character feel continuous without polluting curriculum state;
- a conversation still feels natural even when the hidden curriculum is actively collecting evidence.

That last point is the product test that matters most.
