/**
 * Isolates the one `require()` of the bundled AstroMatrix logo PNG
 * (assets/icon.png) into its own tiny module. Metro resolves this
 * `require()` to a numeric asset module id at bundle time - exactly what
 * `expo-asset`'s `Asset.fromModule()` expects - but under Jest (no Metro,
 * no image-file transform configured in jest.config.js) attempting to
 * `require()` a binary PNG directly inside `exportReport.ts` would break
 * every test that imports that module. Isolating it here lets
 * `exportReport.test.ts` mock this one module directly (the same way it
 * already mocks `reportHtml.ts` wholesale) instead of needing new Jest
 * image-transform infrastructure.
 */
export const LOGO_MODULE = require('../../../assets/icon.png');
