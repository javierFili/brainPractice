import { msg, type Message } from '@/domain/shared';
import { describeCodeRule, describeRecordRule } from '../format';
import type { BugHunterContent } from '../types';
import { codeRuleViolations } from './codeRules';
import { recordRuleViolations } from './recordRules';

export interface Violation {
  /** 0-based item index. */
  readonly index: number;
  /** 0-based index into `content.rules`. */
  readonly ruleIndex: number;
  readonly rule: Message;
  readonly reason: Message;
}

/**
 * Checks every item against every stated rule. A well-formed challenge yields exactly one
 * violation; the generator uses this as its quality gate, the review screen to name the rule.
 */
export function findViolations(content: BugHunterContent): Violation[] {
  const found =
    content.kind === 'code-rule'
      ? content.rules.flatMap((rule, ruleIndex) =>
          codeRuleViolations(rule, content.lines).map((v) => ({
            ...v,
            ruleIndex,
            rule: describeCodeRule(rule),
          })),
        )
      : content.rules.flatMap((rule, ruleIndex) =>
          recordRuleViolations(rule, content.records).map((v) => ({
            ...v,
            ruleIndex,
            rule: describeRecordRule(rule),
          })),
        );
  return found.sort((a, b) => a.index - b.index || a.ruleIndex - b.ruleIndex);
}

/** Feedback sentence; always names the item number, the rule and the concrete reason. */
export const explainViolation = (violation: Violation, ruleCount: number): Message =>
  ruleCount > 1
    ? msg('programming:bugHunter.explanation.numbered', {
        item: violation.index + 1,
        reason: violation.reason,
        number: violation.ruleIndex + 1,
        rule: violation.rule,
      })
    : msg('programming:bugHunter.explanation.single', {
        item: violation.index + 1,
        reason: violation.reason,
        rule: violation.rule,
      });
