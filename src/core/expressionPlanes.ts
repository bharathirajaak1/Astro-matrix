/**
 * Canonical "Planes of Expression" model - the six Lo Shu rows/columns the
 * Blueprint and Remedies UI present to the user. Pure TypeScript, derived
 * entirely from the existing `LO_SHU_LAYOUT` (no second copy of the grid's
 * digits) so there is one place the grid's shape is written down.
 *
 * Deliberately named `ExpressionPlane`, not `Plane`, to avoid colliding with
 * the existing `LoShuPlanes` interface in `types.ts` while both coexist -
 * this module does not replace, read, or depend on `LoShuPlanes`.
 */
import { LO_SHU_LAYOUT } from './loShu';
import type { Digit } from './types';

/** Stable, display-independent key. Never rename once shipped - display
 *  copy can change freely without touching data wiring. */
export type ExpressionPlaneId =
  | 'mindLogic'
  | 'heartIntuition'
  | 'actionGrounding'
  | 'visionPlanning'
  | 'drivePersistence'
  | 'manifestation';

/** `'row'`/`'column'` cover the six Planes below. `'diagonal'` is reserved
 *  for later reuse (e.g. golden/silver yoga highlighting) and is not
 *  produced by this module yet. */
export type LoShuLineType = 'row' | 'column' | 'diagonal';

export interface LoShuCellRef {
  row: 0 | 1 | 2;
  col: 0 | 1 | 2;
  digit: Digit;
}

export interface ExpressionPlane {
  id: ExpressionPlaneId;
  name: string;
  type: LoShuLineType;
  /** Grid-reading order, 1:1 with `cells` at the same index. */
  numbers: readonly [Digit, Digit, Digit];
  cells: readonly [LoShuCellRef, LoShuCellRef, LoShuCellRef];
}

/** One Plane plus one person's presence against it. Never recalculates the
 *  Plane definition or the Lo Shu digits themselves - only reads the
 *  `counts` already produced by `buildLoShuGrid()`. */
export interface ExpressionPlanePresence {
  plane: ExpressionPlane;
  presentCount: 0 | 1 | 2 | 3;
  presentNumbers: Digit[];
  missingNumbers: Digit[];
}

function rowCells(rowIndex: 0 | 1 | 2): [LoShuCellRef, LoShuCellRef, LoShuCellRef] {
  return ([0, 1, 2] as const).map((col) => ({
    row: rowIndex,
    col,
    digit: LO_SHU_LAYOUT[rowIndex][col],
  })) as [LoShuCellRef, LoShuCellRef, LoShuCellRef];
}

function columnCells(colIndex: 0 | 1 | 2): [LoShuCellRef, LoShuCellRef, LoShuCellRef] {
  return ([0, 1, 2] as const).map((row) => ({
    row,
    col: colIndex,
    digit: LO_SHU_LAYOUT[row][colIndex],
  })) as [LoShuCellRef, LoShuCellRef, LoShuCellRef];
}

function cellDigits(cells: readonly [LoShuCellRef, LoShuCellRef, LoShuCellRef]): [Digit, Digit, Digit] {
  return [cells[0].digit, cells[1].digit, cells[2].digit];
}

interface PlaneMeta {
  id: ExpressionPlaneId;
  name: string;
  type: LoShuLineType;
  cells: readonly [LoShuCellRef, LoShuCellRef, LoShuCellRef];
}

const PLANE_META: readonly PlaneMeta[] = [
  { id: 'mindLogic', name: 'Mind & Logic', type: 'row', cells: rowCells(0) },
  { id: 'heartIntuition', name: 'Heart & Intuition', type: 'row', cells: rowCells(1) },
  { id: 'actionGrounding', name: 'Action & Grounding', type: 'row', cells: rowCells(2) },
  { id: 'visionPlanning', name: 'Vision & Planning', type: 'column', cells: columnCells(0) },
  { id: 'drivePersistence', name: 'Drive & Persistence', type: 'column', cells: columnCells(1) },
  { id: 'manifestation', name: 'Manifestation', type: 'column', cells: columnCells(2) },
];

/** The six canonical Planes of Expression. */
export const EXPRESSION_PLANES: readonly ExpressionPlane[] = PLANE_META.map((meta) => ({
  ...meta,
  numbers: cellDigits(meta.cells),
}));

/** One Plane's presence against a person's existing Lo Shu `counts`. */
export function getExpressionPlanePresence(
  plane: ExpressionPlane,
  counts: Record<Digit, number>,
): ExpressionPlanePresence {
  const presentNumbers = plane.numbers.filter((n) => counts[n] > 0);
  const missingNumbers = plane.numbers.filter((n) => counts[n] === 0);
  return {
    plane,
    presentCount: presentNumbers.length as 0 | 1 | 2 | 3,
    presentNumbers,
    missingNumbers,
  };
}

/** All six Planes' presence against a person's existing Lo Shu `counts`. */
export function getAllExpressionPlanePresence(counts: Record<Digit, number>): ExpressionPlanePresence[] {
  return EXPRESSION_PLANES.map((plane) => getExpressionPlanePresence(plane, counts));
}
