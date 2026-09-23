export type LiveToolBehavior = 'BLOCKING' | 'NON_BLOCKING';

export interface LiveToolDeclaration {
  name: string;
  description: string;
  behavior?: LiveToolBehavior;
  parameters: Record<string, unknown>;
}

export interface LiveClientTool {
  declaration: LiveToolDeclaration;
  handle(args: Record<string, unknown>): unknown | Promise<unknown>;
}

export interface LiveSessionSetup {
  systemInstruction: string;
  tools?: readonly LiveClientTool[];
}
