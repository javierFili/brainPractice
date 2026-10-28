import type { CodeLine, CodeRule } from '../types';
import type { ItemViolation } from './recordRules';

/** Variables a line reads (resources are not variables). */
export function readsOf(line: CodeLine): string[] {
  switch (line.op) {
    case 'set': {
      const operands = [line.expr.left, ...(line.expr.right ? [line.expr.right.value] : [])];
      return operands.filter((o): o is string => typeof o === 'string');
    }
    case 'print':
    case 'write':
      return [line.value];
    case 'open':
    case 'close':
      return [];
  }
}

/** Every name written on a line: assigned variable, read variables and resources. */
export function namesOf(line: CodeLine): string[] {
  switch (line.op) {
    case 'set':
      return [line.target, ...readsOf(line)];
    case 'print':
      return [line.value];
    case 'write':
      return [line.value, line.resource];
    case 'open':
    case 'close':
      return [line.resource];
  }
}

export const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/;

const lineOf = (index: number) => `line ${index + 1}`;

function firstSetAfter(lines: readonly CodeLine[], name: string, from: number): number {
  return lines.findIndex((line, i) => i > from && line.op === 'set' && line.target === name);
}

/** Every line that breaks `rule`, top to bottom. The program is straight-line code. */
export function codeRuleViolations(rule: CodeRule, lines: readonly CodeLine[]): ItemViolation[] {
  const found: ItemViolation[] = [];
  const add = (index: number, reason: string) => found.push({ index, reason });

  switch (rule.type) {
    case 'defined-before-use': {
      const assigned = new Set<string>();
      lines.forEach((line, i) => {
        const missing = readsOf(line).find((name) => !assigned.has(name));
        if (missing !== undefined) {
          const later = firstSetAfter(lines, missing, i - 1);
          const where =
            later === -1
              ? 'it is never set'
              : later === i
                ? 'this line is the first to set it'
                : `it is first set on ${lineOf(later)}`;
          add(i, `it reads ${missing}, which has not been assigned yet (${where})`);
        }
        if (line.op === 'set') assigned.add(line.target);
      });
      return found;
    }
    case 'close-opened':
      lines.forEach((line, i) => {
        if (line.op !== 'open') return;
        const closed = lines.some(
          (other, j) => j > i && other.op === 'close' && other.resource === line.resource,
        );
        if (!closed) add(i, `${line.resource} is opened here but never closed afterwards`);
      });
      return found;
    case 'write-while-open': {
      const open = new Set<string>();
      lines.forEach((line, i) => {
        if (line.op === 'open') open.add(line.resource);
        if (line.op === 'close') open.delete(line.resource);
        if (line.op !== 'write' || open.has(line.resource)) return;
        const { resource } = line;
        const closedAt = lines.findLastIndex(
          (other, j) => j < i && other.op === 'close' && other.resource === resource,
        );
        const openedAt = lines.findIndex(
          (other, j) => j > i && other.op === 'open' && other.resource === resource,
        );
        const state =
          closedAt !== -1
            ? `was already closed on ${lineOf(closedAt)}`
            : openedAt !== -1
              ? `is only opened later, on ${lineOf(openedAt)}`
              : 'is never opened';
        add(i, `it writes to ${resource}, which ${state}`);
      });
      return found;
    }
    case 'camel-case':
      lines.forEach((line, i) => {
        const bad = namesOf(line).find((name) => !CAMEL_CASE.test(name));
        if (bad !== undefined) add(i, `the name ${bad} is not camelCase`);
      });
      return found;
  }
}
