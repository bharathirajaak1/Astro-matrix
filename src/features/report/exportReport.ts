/**
 * PDF generation and sharing for a `StructuredReport`. The only module in
 * `src/features/report/` that imports Expo/native code - `reportHtml.ts`
 * stays plain Node/Jest-testable by not importing from here. Unlike that
 * module, the functions here ARE partially unit-tested (see
 * `__tests__/features/report/exportReport.test.ts`) by mocking
 * `expo-print`/`expo-sharing`/`expo-file-system/legacy`/`expo-asset`/
 * `expo-image-manipulator` - those tests verify this file's own
 * call-sequencing and error-handling logic only. They never exercise a real
 * native bridge, so actual PDF creation, real logo loading, and the real
 * share sheet remain a manual smoke test in Expo Go or a dev client.
 *
 * Root cause, revised from first principles (an earlier copy-before-share
 * attempt was proven insufficient by a second manual test - see below):
 * the actual failure is `ExpoFileSystem.copyAsync` itself being unable to
 * READ the file `Print.printToFileAsync()` wrote, inside Expo Go on
 * Android - `java.io.IOException: Location '...cache/Print/....pdf' isn't
 * readable`. This is not a destination-path problem (no destination was
 * ever reached - the SOURCE read failed) and so cannot be fixed by writing
 * the copy somewhere else, which is what the previous fix attempted. The
 * most plausible explanation, consistent with a documented Expo SDK 57 /
 * Expo Go issue (expo/expo#50746): `expo-print`'s native module writes the
 * PDF through a path that Expo Go's own sandboxing does not expose back to
 * the generic `expo-file-system` read APIs running in the same JS context -
 * an Expo Go-specific limitation, not a bug in either package's own public
 * contract, and not reproducible by inspecting their APIs in isolation.
 *
 * Fix: request `base64: true` from `Print.printToFileAsync()` so the PDF
 * bytes come back inline over the bridge, and never attempt to read the
 * file `expo-print` itself wrote at all. The bytes are then written, by
 * this app's own `expo-file-system` write call, into a file this app
 * created itself (and therefore definitely can read back, since the same
 * API that wrote it is what verifies and shares it) - never the original,
 * unreadable-in-Expo-Go path.
 */
import { Asset } from 'expo-asset';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { cacheDirectory, writeAsStringAsync, getInfoAsync, EncodingType } from 'expo-file-system/legacy';

import type { StructuredReport } from '@/core/types';
import { LOGO_MODULE } from './logoAsset';
import { buildReportHtml } from './reportHtml';

/**
 * Resolves the bundled AstroMatrix logo (assets/icon.png) to a base64
 * `data:image/png;base64,...` URI that the pure, Expo-free `reportHtml.ts`
 * can receive as a plain string (never importing Expo itself - see that
 * module's own doc comment on `buildReportHtml`'s `logoDataUri` parameter).
 *
 * Why this exact approach (AstroMatrix "Birth Chart PDF Redesign" Stage 2
 * audit): `Print.printToFileAsync` renders HTML through iOS's `WKWebView`,
 * which cannot load local/bundled asset URLs - per Expo's own SDK 57
 * `expo-print` documentation, local images must be converted to base64 and
 * inlined. `expo-asset`'s `Asset.fromModule(...).downloadAsync()` resolves
 * the bundled module to a real local file URI reliably across Expo Go, a
 * dev client, and a standalone build; `expo-image-manipulator`'s
 * `ImageManipulator.manipulate(uri).renderAsync()` then `.saveAsync({
 * base64: true })` reads that file and produces base64 output - this is
 * Expo's own documented pattern for this exact scenario (their own example
 * uses the hook-based `useImageManipulator`, meant for a component; this
 * file is a plain async function, so the equivalent imperative
 * `ImageManipulator.manipulate()` API is used instead - confirmed, against
 * the actually-installed expo-image-manipulator type declarations, to work
 * identically outside a component). `format: SaveFormat.PNG` is passed
 * explicitly because the native default is JPEG, which would silently
 * change the embedded image's format.
 *
 * Never throws: any failure (asset resolution, manipulation, or base64
 * extraction) is caught and returns `null` - the cover page renders
 * without the logo rather than blocking PDF generation or sharing. Logged
 * via `console.warn`, never surfaced to the user as an error.
 */
export async function resolveLogoDataUri(): Promise<string | null> {
  try {
    const asset = Asset.fromModule(LOGO_MODULE);
    await asset.downloadAsync();
    if (!asset.localUri) {
      return null;
    }

    const context = ImageManipulator.manipulate(asset.localUri);
    const rendered = await context.renderAsync();
    const { base64 } = await rendered.saveAsync({ base64: true, format: SaveFormat.PNG });

    return base64 ? `data:image/png;base64,${base64}` : null;
  } catch (error) {
    console.warn('AstroMatrix: could not load the logo for the Birth Chart PDF - continuing without it.', error);
    return null;
  }
}

/**
 * Builds the report HTML, renders it via `expo-print` with base64 output
 * requested, and writes those bytes into a file under this app's own
 * `cacheDirectory`. Returns that file's `uri`. Does not share or open
 * anything - see `shareReportPdf` for that, kept as a deliberately separate
 * step so a caller can create a PDF without forcing the share sheet to
 * open.
 *
 * Validates the PDF data at each stage rather than assuming success:
 *  - throws if `Print.printToFileAsync` doesn't return base64 data despite
 *    being asked for it (never silently falls back to its unreadable
 *    `uri` - that fallback is exactly the bug this fix exists to avoid);
 *  - throws if no cache directory is available;
 *  - throws if, after writing, the file does not verifiably exist.
 * Any failure (including from `Print.printToFileAsync` itself) propagates
 * to the caller unchanged - this never swallows an error or returns a uri
 * on failure. The base64 PDF data itself is never logged anywhere.
 */
export async function exportReportAsPdf(report: StructuredReport): Promise<string> {
  const logoDataUri = await resolveLogoDataUri();
  const html = buildReportHtml(report, logoDataUri);
  const { base64 } = await Print.printToFileAsync({ html, base64: true });

  if (!base64) {
    throw new Error('Print.printToFileAsync did not return base64 PDF data.');
  }
  if (!cacheDirectory) {
    throw new Error('No writable cache directory is available on this device.');
  }

  const destination = `${cacheDirectory}astromatrix-report-${Date.now()}.pdf`;
  await writeAsStringAsync(destination, base64, { encoding: EncodingType.Base64 });

  const info = await getInfoAsync(destination);
  if (!info.exists) {
    throw new Error(`Writing the report PDF did not produce a readable file at ${destination}`);
  }

  return destination;
}

/**
 * Opens the native share sheet for an already-generated PDF `uri` (e.g.
 * the result of `exportReportAsPdf`). A separate step from PDF creation -
 * never called automatically by `exportReportAsPdf`. By the time this is
 * called, `uri` already points at a file this app wrote and verified
 * itself (see `exportReportAsPdf`), so no further path resolution is
 * needed here - this is a direct, unmodified passthrough to
 * `Sharing.shareAsync`. Propagates any failure unchanged.
 */
export async function shareReportPdf(uri: string): Promise<void> {
  await Sharing.shareAsync(uri);
}
