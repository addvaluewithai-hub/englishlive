# A1 U1-L01 — release / QA ledger (NOT READY)

**Product:** Draft [EnglishLive PR #54](https://github.com/addvaluewithai-hub/englishlive/pull/54).
**Curriculum/queue:** merged [English Course PR #9](https://github.com/addvaluewithai-hub/english-course/pull/9), `interactive-content-production/status/A1.md` says **in-progress**.
**Canon:** A1 Stage-07 U1-L01, source-locked Stage-06 ledger and phrase/word control decisions.
**Coverage:** [36-item source mapping](content-coverage.snapshot.json), authoritative [course mapping](https://github.com/addvaluewithai-hub/english-course/blob/main/interactive-content-production/coverage/A1/U1-L01.json); **12 scope conflicts need curriculum owner decision**.

| Gate | Status | Evidence / remaining work |
| --- | --- | --- |
| Exact source-IDs and roles | **structurally audited** | Course `coverage_gate.py check A1 U1-L01` in CI; 8 ability, 5 phrase, 8 grammar, 13 word, 2 pronunciation; 12 unresolved escalations |
| Curriculum owner review | **BLOCKED** | Resolve [12 open decisions](https://github.com/addvaluewithai-hub/english-course/blob/main/interactive-content-production/coverage/A1/U1-L01-REVIEW.md), with written approvals; do not force unrelated cards |
| Product phrase/script mapping | **authoring check** | All 5 locked-productive phrases now in exact teacher lines + authored two-speaker source, planned final Speaking; this does NOT demonstrate student production |
| Full authored listening | **asset missing** | TTS Factory `production/a1-u1-l01/gemini-tts-request.json`, edition `pilot02`, job `englotti-a1-u1-l01-dialogue-pilot02`; paid job not dispatched |
| Audio / timestamp review | **NOT TESTED** | Need completed WAV, diarized word transcript, VTT and Cloudinary URLs; six audited turn bounds + four clip bounds and actual listening review |
| Visual QA | **agent-inspected; owner review pending** | [Chromium frame run #38857861117](https://github.com/addvaluewithai-hub/englishlive/actions/runs/38857861117): **69 A1 PNGs across 12 sheets**, at 320x640/400x860/1280x900, plus **78 B1 regression PNGs across 15 sheets**. Zero structural warnings. Agent opened all A1 sheets in grouped montages and inspected representative original frames; pedagogical/owner review remains pending |
| PCM non-overlap | **unit guarded, Live untested** | `waitForTeacherAudioDrain` prevents prerecording from starting before PCM queue is silent, tested with fake queue. Actual Gemini PCM / device, audio turn races, mic echo, interruptions and reconnection pending |
| Speaking | **Live untested** | Otti decides sufficiency in changed first meeting; must refuse to pass thin/no-sense greetings and goodbye loops. Check good/weak answer counterexamples with real provider |
| Cold new agent | **static smoke only** | Course `test_cold_agent_handoff.py` confirms source discovery and `IN_FLIGHT_REVIEW`. A genuinely independent agent trial not performed |
| Owner acceptance / deploy | **NOT AUTHORIZED** | Course manifest `delivery_content_production_authorized=false`; no merge/release until source+voice+Speaking and owner review |

## Speaking counterexamples to run with an actual Live teacher

| Learner sample (test fixture only) | Expected Otti response | Must call complete_scene? |
| --- | --- | --- |
| silence / unintelligible speech | repeat simple A1 first-contact task, allow repair | NO |
| "Okay." | give gentle specific invitation to greet or introduce name | NO |
| "Bye, bye, bye." | do not enter farewell loop; ask for meaningful name/wellbeing exchange | NO |
| "Hello, I'm Nour. What's your name?" | answer as Sam and continue to wellbeing question | Not yet |
| "Good morning, I'm Nour. What's your name? How are you?" followed by relevant natural replies and politeness | maintain small real exchange, finish only with sufficient independent evidence | Otti judgement |

Do not confuse MC receptive correctness, authoring tests or provider transcripts with learner's productive-speaking evidence.

## Next actions

1. Curriculum owner reviews 12 raised source-scope questions and signs off decisions (not mass level changes).
2. Review/approve exact source dialogue **pilot02**; dispatch Gemini TTS Factory paid job from its generic workflow; do not misuse `learn-curriculums` issue gateway.
3. Inspect actual audio, word boundaries, clip trims; set `approved:true` and URLs only after verification.
4. Replay `play_lesson_audio(name-exchange)` and wellbeing clip during Otti Live teaching: prove no overlap with Gemini PCM, suppressed microphone, no unearned audio completion, and clean failures/reconnect.
5. Review real contact sheets, fix visuals, rerun QA, conduct Speaking fixtures with weak and strong responses.
6. Mark Course `qualityGates.*=accepted` only with actual evidence/owner approval; run `coverage_gate.py ready A1 U1-L01`, then request release separately.

## Screenshot regression evidence from actual Chromium

- **Before:** [run #38857358684](https://github.com/addvaluewithai-hub/englishlive/actions/runs/38857358684) flagged a real compact 320x640 overlap between Otti and the final MC feedback; one warning, A1 suite failed. B1 baseline still green.
- **After:** [run #38857861117](https://github.com/addvaluewithai-hub/englishlive/actions/runs/38857861117) passed: 69 A1 + 78 B1 frames, 12 + 15 scene/view contact sheets, **zero structural warnings**, no reported internal board scrolling or Otti/quiz intersection. The 12 A1 sheets were opened for agent visual review at three layouts. Real audio was unavailable and never simulated as heard.
- The clean run is a rendering-regression check **only**, not a claim the listening experience or student learning has been validated. Any subsequent CSS/teaching content change invalidates affected visual screenshots.
