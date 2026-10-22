import { useState } from 'react';
import { Alert, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { buildStructuredReport } from '@/core/report';
import { exportReportAsPdf, shareReportPdf } from '@/features/report/exportReport';
import { useProfileStore } from '@/features/profile/store';
import { todayISO } from '@/lib/date';
import { Button, Card, Screen, SectionHeader, Txt } from '@/ui/components';
import { spacing } from '@/ui/theme';

/**
 * Explore > Birth Chart Report, step 2: the real entry point to the
 * existing, already-verified report pipeline (`buildStructuredReport` ->
 * `exportReportAsPdf` -> `shareReportPdf`, the exact sequence used by
 * Settings' dev-only smoke test). This screen only orchestrates those
 * calls - no report content, calculation, or PDF layout is touched here.
 *
 * The "what's inside" copy below is deliberately limited to sections that
 * genuinely exist in `buildReportHtml`'s actual output (reportHtml.ts):
 * Core Numbers, Your Personal Core Summary, Lo Shu Grid, Planes of
 * Expression, and Your Personal Pattern Review. Terms like a dedicated
 * "life application guidance", "cycles and priorities", "practical action
 * plan", or "closing summary" section are deliberately NOT mentioned here
 * because no such section exists in the current report - claiming
 * otherwise would misdescribe the actual PDF.
 */
export default function BirthChartIntroScreen() {
  const profile = useProfileStore((s) => s.profile);
  const hydrated = useProfileStore((s) => s.hydrated);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!profile) {
      Alert.alert('No Profile Found', 'Add your birth details to generate a Birth Chart Report.');
      return;
    }
    if (generating) return;

    void Haptics.selectionAsync();
    setGenerating(true);
    try {
      const report = buildStructuredReport(profile, todayISO());
      const uri = await exportReportAsPdf(report);
      // A resolved `shareReportPdf` means the native share sheet was shown
      // and dismissed - true whether the user completed a share or
      // cancelled it. Neither case is an error, so neither gets its own
      // alert; only a genuine thrown failure (caught below) does.
      await shareReportPdf(uri);
    } catch {
      // Deliberately a plain, non-technical message - never the raw error
      // or a stack trace, per this screen's requirements. Settings' own
      // dev-only smoke test still surfaces the raw error for debugging.
      Alert.alert('Something Went Wrong', "We couldn't generate your report. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Txt variant="title">Birth Chart Report</Txt>
        <Txt variant="body" color="textMuted">
          A downloadable PDF built from your saved numerology profile - yours to keep, print, or
          share.
        </Txt>
      </View>

      <SectionHeader title="What's Inside" />
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ gap: 2 }}>
            <Txt variant="heading">Your Five Core Numbers</Txt>
            <Txt variant="body" color="textMuted">
              Life Path, Destiny, Soul Urge, Personality, and Birthday, each with its meaning and
              how it may show up for you - plus a combined summary across all five.
            </Txt>
          </View>
          <View style={{ gap: 2 }}>
            <Txt variant="heading">Your Lo Shu Grid</Txt>
            <Txt variant="body" color="textMuted">
              A full visual grid from your birth date, with which numbers are present, repeated,
              or missing, and what each traditionally points to.
            </Txt>
          </View>
          <View style={{ gap: 2 }}>
            <Txt variant="heading">Planes of Expression</Txt>
            <Txt variant="body" color="textMuted">
              All six expression patterns from your grid, with a mini-grid and interpretation for
              each.
            </Txt>
          </View>
          <View style={{ gap: 2 }}>
            <Txt variant="heading">Your Personal Pattern Review</Txt>
            <Txt variant="body" color="textMuted">
              Strengths, areas to explore, ways to develop, and what may be easy to overlook -
              offered as prompts for reflection, not fixed traits.
            </Txt>
          </View>
        </View>
      </Card>

      <Txt variant="caption" color="textMuted">
        This report draws on traditional numerology associations. It's a tool for reflection, not
        a prediction, a scientific assessment, or a guarantee of any outcome.
      </Txt>

      {!profile && hydrated ? (
        <Txt variant="caption" color="danger" center>
          Complete onboarding to generate your Birth Chart Report.
        </Txt>
      ) : null}

      <Button
        label={generating ? 'Generating…' : 'Generate & Share PDF'}
        onPress={handleGenerate}
        loading={generating}
        disabled={generating || !hydrated}
      />
    </Screen>
  );
}
