import type { Assignment, DataRecord, Expr, Operand } from './types';

/** `Order { id: 482, status: PAID }` — shared by explanations and the UI. */
export const formatFields = (record: DataRecord) =>
  record.fields.map((field) => `${field.name}: ${field.value}`).join(', ');

export const formatRecord = (record: DataRecord) => `${record.type} { ${formatFields(record)} }`;

export const fieldValue = (record: DataRecord, name: string): string | undefined =>
  record.fields.find((field) => field.name === name)?.value;

const formatOperand = (operand: Operand) =>
  operand.type === 'num' ? String(operand.value) : operand.name;

export const formatExpr = (expr: Expr): string =>
  expr.type === 'bin'
    ? `${formatOperand(expr.left)} ${expr.op} ${formatOperand(expr.right)}`
    : formatOperand(expr);

/** `y = x + 2` */
export const formatAssignment = (line: Assignment) => `${line.target} = ${formatExpr(line.expr)}`;

/** 1-based "row r, column c" for a row-major cell index. */
export const cellPosition = (index: number, cols: number) => ({
  row: Math.floor(index / cols) + 1,
  col: (index % cols) + 1,
});
