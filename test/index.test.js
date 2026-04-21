import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import opentype from 'opentype.js';
import { createDynamicSVGImage, calculateFontSize, initializeFont } from '../src/index.js';

async function svgOf(opts) {
  const bytes = await createDynamicSVGImage(opts);
  return new TextDecoder().decode(bytes);
}

test('createDynamicSVGImage: default produces valid SVG', async () => {
  const svg = await svgOf({ text: 'vitalik.eth' });
  assert.match(svg, /<svg /);
  assert.match(svg, /vitalik\.eth/);
  assert.match(svg, /paint0_linear/); // default gradient
});

test('customElements (#17): injected between text and trailing defs', async () => {
  const badge = '<g transform="translate(10,10)"><text>NATIVE</text></g>';
  const indicator = '<g transform="translate(460,10)"><circle cx="15" cy="15" r="15"/></g>';
  const svg = await svgOf({ text: 'a.eth', customElements: [badge, indicator, '', null] });
  assert.match(svg, /NATIVE/);
  assert.match(svg, /translate\(460,10\)/);
  // badge should come after </text>
  const textClose = svg.indexOf('</text>');
  const badgePos = svg.indexOf('NATIVE');
  assert.ok(badgePos > textClose, 'badge should paint after text');
});

test('customElements: missing/empty handled gracefully', async () => {
  const svg = await svgOf({ text: 'a.eth' }); // no customElements
  assert.match(svg, /<svg /);
  const svg2 = await svgOf({ text: 'a.eth', customElements: [] });
  assert.match(svg2, /<svg /);
});

test('backgroundColor (#18): hex string replaces gradient', async () => {
  const svg = await svgOf({ text: 'a.eth', backgroundColor: '#4F46E5' });
  assert.match(svg, /fill="#4F46E5"/);
  assert.ok(!svg.includes('url(#paint0_linear)'));
});

test('backgroundColor: [r,g,b,a] array becomes rgba()', async () => {
  const svg = await svgOf({ text: 'a.eth', backgroundColor: [255, 100, 50, 0.8] });
  assert.match(svg, /fill="rgba\(255, 100, 50, 0\.8\)"/);
});

test('backgroundColor: transparent with no image produces no background rect', async () => {
  const svg = await svgOf({ text: 'a.eth', backgroundColor: 'transparent' });
  // The <linearGradient> def may still be emitted inside <defs>; what matters
  // is that no <rect> references it or any other fill.
  assert.ok(!svg.match(/<rect[^>]+fill="url\(#paint0_linear\)"/));
  assert.ok(!svg.match(/<rect[^>]+fill="[^"]+"[^>]*\/>/));
});

test('backgroundColor: transparent with image suppresses overlay', async () => {
  const svg = await svgOf({
    text: 'a.eth',
    backgroundImageUrl: 'data:image/png;base64,iVBOR',
    backgroundColor: 'transparent',
  });
  assert.match(svg, /<image href="data:image\/png;base64,iVBOR"/);
  assert.ok(!svg.includes('fill-opacity="0.225"') || !svg.match(/<rect[^>]+fill="#000"/));
});

test('data URI bg (earlier fix): embedded directly, no fetch', async () => {
  const longDataUri = 'data:image/png;base64,' + 'A'.repeat(10000);
  const svg = await svgOf({ text: 'a.eth', backgroundImageUrl: longDataUri });
  assert.ok(svg.includes(longDataUri), 'full data URI should be in output');
});

test('fitMode (#20/#23): default omits textLength', async () => {
  const svg = await svgOf({ text: 'vitalik.eth' });
  assert.ok(!svg.includes('textLength='), 'natural mode should omit textLength');
});

test('fitMode: "exact" emits textLength + lengthAdjust', async () => {
  const svg = await svgOf({ text: 'vitalik.eth', fitMode: 'exact' });
  assert.match(svg, /textLength="[\d.]+"/);
  assert.match(svg, /lengthAdjust="spacingAndGlyphs"/);
});

test('fitMode: "exact" works in non-ENS layout', async () => {
  const svg = await svgOf({ text: 'a.eth', fitMode: 'exact', ensStyle: false });
  assert.match(svg, /textLength="[\d.]+"/);
});

test('manual fontSize (#22): respected, not silently clamped', async () => {
  const svg = await svgOf({ text: 'big', autoFontSize: false, fontSize: 200 });
  assert.match(svg, /font-size="200px"/);
});

test('auto-size still bounded by maxFontSize', async () => {
  const svg = await svgOf({ text: 'tiny', maxFontSize: 32 });
  const m = svg.match(/font-size="(\d+)px"/);
  assert.ok(m && parseInt(m[1]) <= 32);
});

test('paddingY typo (#24): non-square canvas produces correct padding', async () => {
  const svg = await svgOf({ text: 'a', ensStyle: false, width: 400, height: 200 });
  // textAreaHeight = 200 * 0.6 = 120, paddingY should be (200-120)/2 = 40
  assert.match(svg, /padding=40x40/);
});

test('calculateFontSize: CJK ≈ Latin after #21', async () => {
  const latin = await calculateFontSize('hellothere', 200, null, 12, 68);
  const cjk = await calculateFontSize('你好世界', 200, null, 12, 68);
  // After removing the extra 5% complex-script cushion, CJK should be
  // within a few px of Latin at similar visual density.
  assert.ok(Math.abs(latin.fontSize - cjk.fontSize) <= 4, `latin=${latin.fontSize} cjk=${cjk.fontSize}`);
});

test('createDynamicSVGImage: returns Uint8Array', async () => {
  const bytes = await createDynamicSVGImage({ text: 'a' });
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.byteLength > 0);
});

test('missing-glyph routing (#27): Satoshi-loaded, CJK routes to fallback', async () => {
  const buf = fs.readFileSync(new URL('../assets/Satoshi-Bold.ttf', import.meta.url));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  await initializeFont(ab);
  const { measureTextAccurate } = await import('../src/index.js');

  const latin = await measureTextAccurate('vitalik', 48);
  const cjk = await measureTextAccurate('你好', 48);

  assert.equal(latin.isAccurate, true, 'Latin should use OpenType path');
  assert.equal(cjk.isAccurate, false, 'CJK should route to fallback (no glyph coverage)');
});

test('initializeFont (#26): memoized — repeat calls with same source skip re-parse', async () => {
  const buf = fs.readFileSync(new URL('../assets/Satoshi-Bold.ttf', import.meta.url));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const origParse = opentype.parse;
  let parseCount = 0;
  opentype.parse = (...a) => { parseCount++; return origParse(...a); };
  try {
    await initializeFont(ab);
    const after1 = parseCount;
    await initializeFont(ab);
    await initializeFont(ab);
    assert.equal(parseCount, after1, 'same source should not re-parse');
    await initializeFont();
    assert.equal(parseCount, after1, 'no-arg call should return cached');
  } finally {
    opentype.parse = origParse;
  }
});
