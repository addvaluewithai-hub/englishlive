# Diagnose missing Practice mistake notes

This guide covers the **Practice roleplay** at `/practice/live/:missionId`. It does not describe Free Speak's separate post-conversation transcription analysis or Speaking's lesson evaluation.

## Live diagnostic log

1. Open `/practice/live/<mission-slug>?debug=1` (or append `&debug=1` if the URL already has `?pace=relaxed`).
2. Open browser developer tools to see metadata-only `[Otti Live]` events in development, or tap **Copy live tool log** during the roleplay. The button works in production with the debug query parameter.
3. Make a clearly imperfect spoken sentence, press **Done** on the microphone, and let Otti reply.
4. Repeat, then tap **Done? Review** to request the final review.
5. On the review screen, open **Notes → Details for support**. The timeline appears there, and **Copy details** exports counts, timeline, and saved corrections.

Log events contain only names, counts, timings and connection status. They never include API keys, audio, model tool arguments or transcripts. The existing support report separately includes saved correction text; treat that report as learner data.

The chronological timeline retains up to the last 500 events in memory and survives reconnections within one roleplay. It is passed to the review screen in navigation state; it is not stored server-side and is lost on page reload.

## How to read a failure

| Observation | What it narrows down |
| --- | --- |
| `setup_sent` does not list `record_practice_progress` and `submit_final_review` | Tools were not registered on this connection. Check that the phase is `roleplay` and the session was created with `collector.tools`. |
| `setup_sent` lists both but `setup_accepted` is absent | Setup failed or the connection closed; look for `server_error` / `socket_closed`. |
| `mic_open` and `audio_submitted` appear, but no `tool_call` before or during the next reply | The model did not request a tool. This can be model decision/prompt behavior; the log alone cannot prove which. |
| `tool_call` appears, followed by `unknown_tool` or `tool_error` | Dispatch/schema/handler issue, not a missed model invocation. |
| `tool_result` reports `issues: 0` | The model supplied no distinct valid issues, or the notebook rejected/deduplicated them. Check `notebook.reasons`, `notebook.rejected` and `finalStatus`. |
| `tool_response_dropped` appears | The connection was no longer open when the client attempted to send the tool response. |
| `finish_requested` and then `finish_missing` | A final review tool call never completed within the 15-second wait plus 10-second reminder window (or the connection closed). |
| `finish_received` with `finalStatus: no_clear_issue` | The model did call the final-review tool but claimed it heard no clear mistakes; the issue is model judgment, not missing tool registration. |
| `finish_received` with `finalStatus: issues` and `saved: 0` | Inspect rejection/deduplication counts. Do not treat zero saved issues as evidence of correct English. |

`provider_generation_complete` and `provider_turn_complete` show the model responded, but **do not imply** it used a tool. `tool_response_sent` means the client sent the response over an open socket, not that the provider acknowledged the payload.

## Current architectural limits

- The recording tools are prompt-requested in `src/practice/conversationPrompt.ts`; Gemini is not forced to call them. The current Live setup uses the model's default tool choice behavior.
- The voice tutor sets `disableInputTranscription: true` in `src/practice/tutor/TutorSession.ts`. As a result there is **no reliable independent learner transcript** for auditing what the voice model heard. Only typed turns are available as exact text.
- The notebook can only save mistakes *reported by the model*. It validates and deduplicates the reports but does not itself analyze microphone audio.
- Both notebook functions use `NON_BLOCKING` and the tool responses request `SILENT`, so the teacher can keep the roleplay natural.
- We corrected `FunctionResponse.scheduling` to be a sibling of `response`, as defined by the Gemini API, rather than embedding it inside arbitrary response data.

## Next diagnostic experiment

Compare 3-5 identical test attempts with a clear article/verb error and collect their diagnostic logs. If tool declarations are accepted and audio turns complete but tool calls are consistently absent, test a more direct prompt or use a separate transcription-based review pipeline. If calls occur with `issues: 0`, inspect status and validation counts before rewriting the prompt.

Do not claim the prompt is the confirmed root cause without a recorded failing session. Tool metadata cannot establish what the model actually heard.
