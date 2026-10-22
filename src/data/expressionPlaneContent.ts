/**
 * Presentation metadata for each canonical Expression Plane
 * (src/core/expressionPlanes.ts) - icon/subtitle/description text that has
 * no equivalent in the canonical model. Keyed by the canonical Plane id so
 * it can never drift out of sync with which numbers a Plane actually
 * represents; names, numbers, and presence all come from the canonical
 * module itself.
 *
 * Relocated here, verbatim and unchanged, from app/(tabs)/blueprint.tsx -
 * that screen previously declared this content locally (itself moved there
 * from app/(tabs)/remedies.tsx before that). It now imports `PLANE_PRESENTATION`
 * from this module instead, with zero change to its own rendered output.
 * This module exists so `src/features/report/reportHtml.ts` (the Birth
 * Chart PDF) can reuse the exact same, already-approved description text -
 * a screen file cannot be imported from `src/core`/`src/features/report`.
 */
import type { ExpressionPlaneId } from '@/core/expressionPlanes';

export interface PlanePresentation {
  icon: string;
  subtitle: string;
  description: string;
}

export const PLANE_PRESENTATION: Record<ExpressionPlaneId, PlanePresentation> = {
  mindLogic: {
    icon: '🧠',
    subtitle: 'Intellect & memory',
    description: 'Your analytical thinking, memory, and cognitive agility.',
  },
  heartIntuition: {
    icon: '💖',
    subtitle: 'Empathy & feelings',
    description: 'Your empathy, spiritual attunement, feelings, and emotional resilience.',
  },
  actionGrounding: {
    icon: '🌱',
    subtitle: 'Execution & discipline',
    description: 'Your physical endurance, discipline, material mastery, and everyday habits.',
  },
  visionPlanning: {
    icon: '🔭',
    subtitle: 'Ideas & strategy',
    description: 'Your ability to come up with ideas, plan ahead, and structure your approach.',
  },
  drivePersistence: {
    icon: '⚡',
    subtitle: 'Focus & resolve',
    description: 'Your inner persistence, focus, and grit to complete objectives.',
  },
  manifestation: {
    icon: '🏃',
    subtitle: 'Decisive movement',
    description: 'Your ability to turn ideas into visible results, and to follow through until something becomes real.',
  },
};
