import type {
  EnglishLiveMemoryState,
  RelationshipMemoryNote,
  RelationshipMemoryProposal,
} from './types';

const STORAGE_KEY = 'englishlive.memory.v1';

export function emptyEnglishLiveMemory(): EnglishLiveMemoryState {
  return {
    version: 1,
    capabilities: {},
    recentSessions: [],
    relationshipNotes: [],
    updatedAt: new Date().toISOString(),
  };
}

export function readEnglishLiveMemory(): EnglishLiveMemoryState {
  if (typeof window === 'undefined') return emptyEnglishLiveMemory();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyEnglishLiveMemory();
    const parsed = JSON.parse(raw) as Partial<EnglishLiveMemoryState>;
    if (parsed.version !== 1 || !parsed.capabilities || !Array.isArray(parsed.recentSessions) || !Array.isArray(parsed.relationshipNotes)) {
      return emptyEnglishLiveMemory();
    }
    const relationshipNotes = parsed.relationshipNotes.filter((note): note is RelationshipMemoryNote =>
      Boolean(
        note
        && typeof note.id === 'string'
        && typeof note.text === 'string'
        && typeof note.characterId === 'string'
        && typeof note.sourceMissionId === 'string'
        && typeof note.createdAt === 'string',
      ),
    );
    return {
      version: 1,
      capabilities: parsed.capabilities,
      recentSessions: parsed.recentSessions.slice(-12),
      relationshipNotes: relationshipNotes.slice(-12),
      ...(typeof parsed.lastPartnerId === 'string' ? { lastPartnerId: parsed.lastPartnerId } : {}),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyEnglishLiveMemory();
  }
}

export function saveEnglishLiveMemory(memory: EnglishLiveMemoryState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...memory, updatedAt: new Date().toISOString() }));
}

export function keepRelationshipMemory(
  proposal: RelationshipMemoryProposal,
  sourceMissionId: string,
  characterId: string,
): RelationshipMemoryNote {
  const memory = readEnglishLiveMemory();
  const note: RelationshipMemoryNote = {
    id: crypto.randomUUID(),
    kind: proposal.kind,
    text: proposal.text.trim().slice(0, 160),
    characterId,
    sourceMissionId,
    createdAt: new Date().toISOString(),
  };
  memory.relationshipNotes = [...memory.relationshipNotes, note].slice(-12);
  saveEnglishLiveMemory(memory);
  return note;
}

export function removeRelationshipMemory(noteId: string) {
  const memory = readEnglishLiveMemory();
  memory.relationshipNotes = memory.relationshipNotes.filter((note) => note.id !== noteId);
  saveEnglishLiveMemory(memory);
}
