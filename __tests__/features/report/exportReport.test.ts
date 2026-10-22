/**
 * Exercises `src/features/report/exportReport.ts`'s own call-sequencing and
 * error-handling logic, with `expo-print`, `expo-sharing`,
 * `expo-file-system/legacy`, `expo-asset`, and `expo-image-manipulator`
 * fully mocked.
 *
 * This does NOT verify real native PDF creation, real file I/O, real logo
 * loading, or the actual share sheet opening - no real native bridge is
 * exercised anywhere in this file. It verifies that `exportReportAsPdf()`
 * requests base64 PDF data from `expo-print` and writes it, via this app's
 * own `expo-file-system` write call, into a file under `cacheDirectory` -
 * never reading or relying on `Print.printToFileAsync()`'s own returned
 * `uri` (the file path Expo Go on Android has been observed unable to read
 * back - `java.io.IOException: ... isn't readable` - see this module's own
 * doc comment for the full root-cause trace) - and that `resolveLogoDataUri()`
 * (AstroMatrix "Birth Chart PDF Redesign" Stage 2) resolves the bundled logo
 * to a base64 data URI on success and returns `null` without ever throwing
 * on any failure, so a logo problem can never block PDF generation or
 * sharing. Actual PDF creation, real logo loading, and the real native share
 * sheet remain a manual smoke test in Expo Go or a dev client, not covered
 * here.
 */
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///mock-cache/',
  writeAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
}));
jest.mock('expo-asset', () => ({
  Asset: { fromModule: jest.fn() },
}));
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { PNG: 'png', JPEG: 'jpeg', WEBP: 'webp' },
}));
jest.mock('../../../src/features/report/logoAsset', () => ({
  LOGO_MODULE: 'mock-logo-module-id',
}));
jest.mock('../../../src/features/report/reportHtml', () => ({
  buildReportHtml: jest.fn(() => '<html>mock report</html>'),
}));

import { Asset } from 'expo-asset';
import { ImageManipulator } from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { exportReportAsPdf, resolveLogoDataUri, shareReportPdf } from '../../../src/features/report/exportReport';
import { buildReportHtml } from '../../../src/features/report/reportHtml';
import type { StructuredReport } from '../../../src/core/types';

const printToFileAsyncMock = Print.printToFileAsync as jest.Mock;
const shareAsyncMock = Sharing.shareAsync as jest.Mock;
const writeAsStringAsyncMock = FileSystemLegacy.writeAsStringAsync as jest.Mock;
const getInfoAsyncMock = FileSystemLegacy.getInfoAsync as jest.Mock;
const assetFromModuleMock = Asset.fromModule as jest.Mock;
const imageManipulatorManipulateMock = ImageManipulator.manipulate as jest.Mock;
const buildReportHtmlMock = buildReportHtml as jest.Mock;

// `exportReportAsPdf` only passes this through to the (mocked) `buildReportHtml`
// and `Print.printToFileAsync` - its actual shape is irrelevant here.
const FAKE_REPORT = {} as StructuredReport;

// Deliberately the kind of path Expo Go has been observed unable to read
// back - every test below proves this value is never used as the returned
// or shared uri.
const UNREADABLE_PRINT_URI = 'file:///data/user/0/host.exp.exponent/cache/Print/unreadable.pdf';
const FAKE_BASE64 = 'ZmFrZS1wZGYtYnl0ZXM='; // "fake-pdf-bytes", arbitrary - never asserted as real PDF content

const FAKE_LOCAL_URI = 'file:///mock-cache/ExponentAsset-logo.png';
const FAKE_LOGO_BASE64 = 'ZmFrZS1sb2dvLWJ5dGVz'; // "fake-logo-bytes"
const EXPECTED_LOGO_DATA_URI = `data:image/png;base64,${FAKE_LOGO_BASE64}`;

/** Wires Asset.fromModule -> downloadAsync -> ImageManipulator.manipulate
 *  -> renderAsync -> saveAsync as a fully successful chain, resolving with
 *  `base64` (defaulting to FAKE_LOGO_BASE64). Mirrors the real shape:
 *  Asset.fromModule returns an Asset-like object with localUri/downloadAsync;
 *  ImageManipulator.manipulate returns a context with renderAsync; renderAsync
 *  resolves to an ImageRef-like object with saveAsync; saveAsync resolves to
 *  an ImageResult-like object with an optional base64 field. */
function mockLogoChain({ localUri = FAKE_LOCAL_URI, base64 = FAKE_LOGO_BASE64 as string | undefined } = {}) {
  assetFromModuleMock.mockReturnValue({ localUri, downloadAsync: jest.fn().mockResolvedValue(undefined) });
  const saveAsyncMock = jest.fn().mockResolvedValue({ uri: 'file:///manipulated.png', width: 1024, height: 1024, base64 });
  const renderAsyncMock = jest.fn().mockResolvedValue({ saveAsync: saveAsyncMock });
  imageManipulatorManipulateMock.mockReturnValue({ renderAsync: renderAsyncMock });
  return { saveAsyncMock, renderAsyncMock };
}

beforeEach(() => {
  printToFileAsyncMock.mockReset().mockResolvedValue({
    uri: UNREADABLE_PRINT_URI,
    numberOfPages: 1,
    base64: FAKE_BASE64,
  });
  shareAsyncMock.mockReset().mockResolvedValue(undefined);
  writeAsStringAsyncMock.mockReset().mockResolvedValue(undefined);
  getInfoAsyncMock.mockReset().mockResolvedValue({ exists: true, uri: 'unused', size: 0, isDirectory: false, modificationTime: 0 });
  assetFromModuleMock.mockReset();
  imageManipulatorManipulateMock.mockReset();
  mockLogoChain(); // default: successful logo resolution, so unrelated tests below don't need to care
  buildReportHtmlMock.mockClear();
});

describe('resolveLogoDataUri', () => {
  test('resolves the bundled logo module and returns a data:image/png;base64 URI on success', async () => {
    const result = await resolveLogoDataUri();

    expect(assetFromModuleMock).toHaveBeenCalledWith('mock-logo-module-id');
    expect(imageManipulatorManipulateMock).toHaveBeenCalledWith(FAKE_LOCAL_URI);
    expect(result).toBe(EXPECTED_LOGO_DATA_URI);
  });

  test('requests PNG format explicitly (the native default is JPEG)', async () => {
    const { saveAsyncMock } = mockLogoChain();
    await resolveLogoDataUri();
    expect(saveAsyncMock).toHaveBeenCalledWith({ base64: true, format: 'png' });
  });

  test('returns null, without throwing, if the asset has no localUri after downloadAsync', async () => {
    mockLogoChain({ localUri: null });
    await expect(resolveLogoDataUri()).resolves.toBeNull();
    // Never attempts to manipulate an image it couldn't resolve a URI for.
    expect(imageManipulatorManipulateMock).not.toHaveBeenCalled();
  });

  test('returns null, without throwing, if Asset.fromModule itself throws', async () => {
    assetFromModuleMock.mockImplementation(() => {
      throw new Error('could not resolve asset module');
    });
    await expect(resolveLogoDataUri()).resolves.toBeNull();
  });

  test('returns null, without throwing, if downloadAsync rejects', async () => {
    assetFromModuleMock.mockReturnValue({
      localUri: FAKE_LOCAL_URI,
      downloadAsync: jest.fn().mockRejectedValue(new Error('network unavailable')),
    });
    await expect(resolveLogoDataUri()).resolves.toBeNull();
    expect(imageManipulatorManipulateMock).not.toHaveBeenCalled();
  });

  test('returns null, without throwing, if ImageManipulator.manipulate throws', async () => {
    imageManipulatorManipulateMock.mockImplementation(() => {
      throw new Error('manipulation context failed');
    });
    await expect(resolveLogoDataUri()).resolves.toBeNull();
  });

  test('returns null, without throwing, if renderAsync rejects', async () => {
    imageManipulatorManipulateMock.mockReturnValue({
      renderAsync: jest.fn().mockRejectedValue(new Error('render failed')),
    });
    await expect(resolveLogoDataUri()).resolves.toBeNull();
  });

  test('returns null, without throwing, if saveAsync rejects', async () => {
    imageManipulatorManipulateMock.mockReturnValue({
      renderAsync: jest.fn().mockResolvedValue({ saveAsync: jest.fn().mockRejectedValue(new Error('save failed')) }),
    });
    await expect(resolveLogoDataUri()).resolves.toBeNull();
  });

  test('returns null, without throwing, if saveAsync resolves without a base64 field', async () => {
    // Set up the chain inline, not via mockLogoChain's defaulted `base64`
    // param (a destructured default applies even when `undefined` is
    // explicitly passed, which would silently fall back to
    // FAKE_LOGO_BASE64 and defeat this exact case).
    assetFromModuleMock.mockReturnValue({ localUri: FAKE_LOCAL_URI, downloadAsync: jest.fn().mockResolvedValue(undefined) });
    imageManipulatorManipulateMock.mockReturnValue({
      renderAsync: jest.fn().mockResolvedValue({
        saveAsync: jest.fn().mockResolvedValue({ uri: 'file:///manipulated.png', width: 1024, height: 1024 }),
      }),
    });
    await expect(resolveLogoDataUri()).resolves.toBeNull();
  });

  test('logs a warning (not an error, never a throw) on failure', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    assetFromModuleMock.mockImplementation(() => {
      throw new Error('boom');
    });
    await resolveLogoDataUri();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('could not load the logo'), expect.any(Error));
    warnSpy.mockRestore();
  });
});

describe('exportReportAsPdf', () => {
  test('requests base64 output and writes it into a file under cacheDirectory - never the original printToFileAsync uri', async () => {
    const resultUri = await exportReportAsPdf(FAKE_REPORT);

    expect(buildReportHtmlMock).toHaveBeenCalledWith(FAKE_REPORT, EXPECTED_LOGO_DATA_URI);
    expect(printToFileAsyncMock).toHaveBeenCalledWith({ html: '<html>mock report</html>', base64: true });

    expect(writeAsStringAsyncMock).toHaveBeenCalledTimes(1);
    const [writtenUri, writtenContents, writeOptions] = writeAsStringAsyncMock.mock.calls[0];
    expect(writtenUri).toMatch(/^file:\/\/\/mock-cache\/astromatrix-report-\d+\.pdf$/);
    expect(writtenContents).toBe(FAKE_BASE64);
    expect(writeOptions).toEqual({ encoding: 'base64' });

    expect(getInfoAsyncMock).toHaveBeenCalledWith(writtenUri);
    expect(resultUri).toBe(writtenUri);
    expect(resultUri).not.toBe(UNREADABLE_PRINT_URI);
  });

  test('throws, and never writes a file, if printToFileAsync does not return base64 data', async () => {
    printToFileAsyncMock.mockResolvedValueOnce({ uri: UNREADABLE_PRINT_URI, numberOfPages: 1 });

    await expect(exportReportAsPdf(FAKE_REPORT)).rejects.toThrow('did not return base64 PDF data');
    expect(writeAsStringAsyncMock).not.toHaveBeenCalled();
  });

  test('throws, and never writes a file, if base64 is an empty string', async () => {
    printToFileAsyncMock.mockResolvedValueOnce({ uri: UNREADABLE_PRINT_URI, numberOfPages: 1, base64: '' });

    await expect(exportReportAsPdf(FAKE_REPORT)).rejects.toThrow('did not return base64 PDF data');
    expect(writeAsStringAsyncMock).not.toHaveBeenCalled();
  });

  test('throws, and never writes a file, if the copied-in printToFileAsync failure propagates', async () => {
    printToFileAsyncMock.mockRejectedValueOnce(new Error('print failed'));

    await expect(exportReportAsPdf(FAKE_REPORT)).rejects.toThrow('print failed');
    expect(writeAsStringAsyncMock).not.toHaveBeenCalled();
  });

  test('a writeAsStringAsync failure propagates, not swallowed', async () => {
    writeAsStringAsyncMock.mockRejectedValueOnce(new Error('write failed'));
    await expect(exportReportAsPdf(FAKE_REPORT)).rejects.toThrow('write failed');
  });

  test('throws if the written file does not verifiably exist afterward', async () => {
    getInfoAsyncMock.mockResolvedValueOnce({ exists: false, uri: 'unused' });
    await expect(exportReportAsPdf(FAKE_REPORT)).rejects.toThrow('did not produce a readable file');
  });

  test('throws, and never writes a file, if no cache directory is available', async () => {
    jest.resetModules();
    jest.doMock('expo-file-system/legacy', () => ({
      cacheDirectory: null,
      writeAsStringAsync: jest.fn(),
      getInfoAsync: jest.fn(),
      EncodingType: { UTF8: 'utf8', Base64: 'base64' },
    }));
    jest.doMock('../../../src/features/report/reportHtml', () => ({
      buildReportHtml: jest.fn(() => '<html>mock report</html>'),
    }));
    jest.doMock('expo-print', () => ({
      printToFileAsync: jest.fn().mockResolvedValue({ uri: UNREADABLE_PRINT_URI, numberOfPages: 1, base64: FAKE_BASE64 }),
    }));
    jest.doMock('expo-sharing', () => ({ shareAsync: jest.fn() }));
    jest.doMock('expo-asset', () => ({
      Asset: { fromModule: jest.fn().mockReturnValue({ localUri: FAKE_LOCAL_URI, downloadAsync: jest.fn().mockResolvedValue(undefined) }) },
    }));
    jest.doMock('expo-image-manipulator', () => ({
      ImageManipulator: {
        manipulate: jest.fn().mockReturnValue({
          renderAsync: jest.fn().mockResolvedValue({ saveAsync: jest.fn().mockResolvedValue({ base64: FAKE_LOGO_BASE64 }) }),
        }),
      },
      SaveFormat: { PNG: 'png' },
    }));
    jest.doMock('../../../src/features/report/logoAsset', () => ({ LOGO_MODULE: 'mock-logo-module-id' }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const freshModule = require('../../../src/features/report/exportReport');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const freshFileSystem = require('expo-file-system/legacy');

    await expect(freshModule.exportReportAsPdf(FAKE_REPORT)).rejects.toThrow(
      'No writable cache directory is available',
    );
    expect(freshFileSystem.writeAsStringAsync).not.toHaveBeenCalled();
  });

  describe('logo-loading failures never block PDF generation or sharing (Stage 2 requirement)', () => {
    test('generation succeeds, with buildReportHtml called with a null logo, when Asset.fromModule throws', async () => {
      assetFromModuleMock.mockImplementation(() => {
        throw new Error('asset resolution failed');
      });

      const resultUri = await exportReportAsPdf(FAKE_REPORT);

      expect(buildReportHtmlMock).toHaveBeenCalledWith(FAKE_REPORT, null);
      expect(printToFileAsyncMock).toHaveBeenCalled();
      expect(writeAsStringAsyncMock).toHaveBeenCalledTimes(1);
      expect(resultUri).toMatch(/^file:\/\/\/mock-cache\/astromatrix-report-\d+\.pdf$/);
    });

    test('generation succeeds, with buildReportHtml called with a null logo, when the manipulation chain rejects', async () => {
      imageManipulatorManipulateMock.mockReturnValue({
        renderAsync: jest.fn().mockRejectedValue(new Error('render failed')),
      });

      const resultUri = await exportReportAsPdf(FAKE_REPORT);

      expect(buildReportHtmlMock).toHaveBeenCalledWith(FAKE_REPORT, null);
      expect(resultUri).toMatch(/^file:\/\/\/mock-cache\/astromatrix-report-\d+\.pdf$/);
    });

    test('a generated PDF can still be shared normally after a logo failure', async () => {
      assetFromModuleMock.mockImplementation(() => {
        throw new Error('asset resolution failed');
      });

      const resultUri = await exportReportAsPdf(FAKE_REPORT);
      await shareReportPdf(resultUri);

      expect(shareAsyncMock).toHaveBeenCalledWith(resultUri);
    });
  });
});

describe('shareReportPdf', () => {
  test('shares exactly the uri it is given, unmodified', async () => {
    await shareReportPdf('file:///mock-cache/already-written-report.pdf');
    expect(shareAsyncMock).toHaveBeenCalledWith('file:///mock-cache/already-written-report.pdf');
  });

  test('a Sharing.shareAsync failure propagates unchanged', async () => {
    shareAsyncMock.mockRejectedValueOnce(new Error('Not allowed to read file under given URL'));
    await expect(shareReportPdf('file:///mock-cache/report.pdf')).rejects.toThrow(
      'Not allowed to read file under given URL',
    );
  });
});
