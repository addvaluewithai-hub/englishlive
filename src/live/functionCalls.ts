import type { FunctionCall, FunctionResponse } from './liveProtocol';
import { responseObject, scheduledResponse } from './liveProtocol';
import type { LiveClientTool } from './tools';
import type { LiveCallbacks } from './types';

/**
 * Run one provider function call against the declared client tools and answer it.
 * Duplicate call ids are answered once. Diagnostics carry tool names only, never arguments.
 */
export async function answerFunctionCall(call: FunctionCall, tools: readonly LiveClientTool[], answered: Set<string>,
  callbacks: LiveCallbacks, respond: (responses: FunctionResponse[]) => void) {
  callbacks.onDiagnostic?.({ event: 'tool_call', name: call.name });
  if (!call.name) return;
  if (call.id && answered.has(call.id)) {
    callbacks.onDiagnostic?.({ event: 'duplicate_tool_call', name: call.name });
    return;
  }
  if (call.id) answered.add(call.id);
  const tool = tools.find((candidate) => candidate.declaration.name === call.name);
  if (!tool) {
    callbacks.onDiagnostic?.({ event: 'unknown_tool', name: call.name });
    respond([{ id: call.id, name: call.name, response: { error: `Unknown tool: ${call.name}` } }]);
    return;
  }
  try {
    const value = responseObject(await tool.handle(call.args ?? {}));
    callbacks.onDiagnostic?.({
      event: 'tool_result', name: call.name, saved: value.saved === true,
      issues: typeof value.issues === 'number' ? value.issues : undefined,
      goals: typeof value.goals === 'number' ? value.goals : undefined,
    });
    respond([{ id: call.id, name: call.name, response: scheduledResponse(value, tool.declaration.behavior) }]);
  } catch (reason) {
    callbacks.onDiagnostic?.({ event: 'tool_error', name: call.name });
    respond([{ id: call.id, name: call.name, response: { error: reason instanceof Error ? reason.message : 'Tool failed.' } }]);
  }
}
