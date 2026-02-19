const OPERATOR_PREFIX = "[op:";

export function buildStatusEventNote(note?: string, operatorLabel?: string) {
  const operator = operatorLabel?.trim();
  const plainNote = note?.trim();

  if (!operator && !plainNote) {
    return null;
  }
  if (operator && plainNote) {
    return `${OPERATOR_PREFIX}${operator}] ${plainNote}`;
  }
  if (operator) {
    return `${OPERATOR_PREFIX}${operator}]`;
  }
  return plainNote ?? null;
}

export function parseStatusEventNote(note?: string | null) {
  if (!note) {
    return { operatorLabel: null as string | null, noteText: null as string | null };
  }

  if (note.startsWith(OPERATOR_PREFIX)) {
    const closeIdx = note.indexOf("]");
    if (closeIdx > OPERATOR_PREFIX.length) {
      const operatorLabel = note.slice(OPERATOR_PREFIX.length, closeIdx).trim() || null;
      const trailing = note.slice(closeIdx + 1).trim();
      return { operatorLabel, noteText: trailing || null };
    }
  }

  return { operatorLabel: null, noteText: note };
}
