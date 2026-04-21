import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyText,
  hasComplexScripts,
  hasComplexEmojis,
  getTextMeasurementStrategy,
  measureTextFallback,
} from '../src/text-measurement.js';

test('classifyText: Latin only', () => {
  const c = classifyText('vitalik.eth');
  assert.equal(c.hasCJK, false);
  assert.equal(c.hasRTL, false);
  assert.equal(c.hasEmoji, false);
  assert.equal(c.isInternational, false);
  assert.equal(c.hasComplexScripts, false);
  assert.equal(c.needsFallbackFont, false);
});

test('classifyText: CJK', () => {
  const c = classifyText('你好世界');
  assert.equal(c.hasCJK, true);
  assert.equal(c.hasComplexScripts, true);
  assert.equal(c.needsFallbackFont, true);
  assert.equal(c.isInternational, true);
});

test('classifyText: RTL (Arabic + Hebrew)', () => {
  assert.equal(classifyText('مرحبا').hasRTL, true);
  assert.equal(classifyText('שלום').hasRTL, true);
});

test('classifyText: Indic + Thai', () => {
  assert.equal(classifyText('नमस्ते').hasIndic, true);
  assert.equal(classifyText('สวัสดี').hasThai, true);
});

test('classifyText: Georgian / Greek / Cyrillic — international but not complex', () => {
  const geo = classifyText('გამარჯობა');
  assert.equal(geo.hasGeorgian, true);
  assert.equal(geo.hasComplexScripts, false);
  assert.equal(geo.isInternational, true);
  assert.equal(geo.needsFallbackFont, true); // Satoshi-style fonts don't cover Georgian

  const gr = classifyText('γεια');
  assert.equal(gr.hasGreek, true);
  assert.equal(gr.hasComplexScripts, false);
  assert.equal(gr.needsFallbackFont, false); // Latin fonts usually cover Greek

  const cyr = classifyText('привет');
  assert.equal(cyr.hasCyrillic, true);
  assert.equal(cyr.hasComplexScripts, false);
});

test('classifyText: emoji and compound emoji', () => {
  assert.equal(classifyText('🌟').hasEmoji, true);
  assert.equal(classifyText('👨‍👩‍👧‍👦').hasEmoji, true); // compound via ZWJ
  assert.equal(classifyText('🇹🇷').hasEmoji, true); // regional indicator (flag)
  assert.equal(classifyText('no emoji here').hasEmoji, false);
});

test('back-compat wrappers still work', () => {
  assert.equal(hasComplexScripts('你好'), true);
  assert.equal(hasComplexScripts('hello'), false);
  assert.equal(hasComplexEmojis('🌟'), true);
  assert.equal(hasComplexEmojis('hello'), false);
});

test('getTextMeasurementStrategy: flat 10% margin after task #21', () => {
  assert.equal(getTextMeasurementStrategy('hello').recommendedSafetyMargin, 0.1);
  assert.equal(getTextMeasurementStrategy('你好').recommendedSafetyMargin, 0.1);
  assert.equal(getTextMeasurementStrategy('مرحبا').recommendedSafetyMargin, 0.1);
});

test('getTextMeasurementStrategy: legacy fields preserved', () => {
  const s = getTextMeasurementStrategy('hello 🌟');
  assert.equal(s.hasEmojis, true); // legacy alias
  assert.equal(s.hasEmoji, true); // canonical
  assert.equal(typeof s.isLongText, 'boolean');
});

test('measureTextFallback: Latin produces plausible widths', () => {
  const m = measureTextFallback('hello', 48, 'Arial');
  assert.equal(m.isAccurate, false);
  assert.ok(m.width > 0, 'width must be positive');
  assert.ok(m.confidence >= 0.5 && m.confidence <= 0.95);
});

test('measureTextFallback: CJK wider than Latin of same length', () => {
  const latin = measureTextFallback('abcd', 48);
  const cjk = measureTextFallback('你好世界', 48);
  assert.ok(cjk.width > latin.width, 'CJK should measure wider per char');
});

test('measureTextFallback: emoji width (1.1em)', () => {
  const m = measureTextFallback('🌟', 48);
  // EMOJI width 1.1 * 48 = 52.8, with kerning/font factor
  assert.ok(m.width > 40 && m.width < 70, `got ${m.width}`);
});

test('measureTextFallback: compound emoji is one grapheme', () => {
  // Family emoji is one grapheme cluster; shouldn't be counted as 4 emoji.
  const single = measureTextFallback('👨', 48);
  const family = measureTextFallback('👨‍👩‍👧‍👦', 48);
  // Family should measure close to single (one cluster), not 4× wider.
  assert.ok(family.width < single.width * 2, `family=${family.width} vs single=${single.width}`);
});
