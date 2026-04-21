// Character width constants for different Unicode script families (in em units)
const UNICODE_WIDTHS = {
  CJK: 1.2,              // Full-width characters (Chinese, Japanese, Korean)
  EMOJI: 1.1,            // Emojis are slightly wider than regular characters
  ARABIC: 0.65,          // Arabic characters are typically narrower
  HEBREW: 0.6,           // Hebrew characters
  INDIC: 0.7,            // Indic scripts (Devanagari, Bengali, Gurmukhi, Gujarati)
  THAI: 0.8,             // Thai characters
  GEORGIAN: 0.65,        // Georgian characters
  GREEK: 0.6,            // Greek characters
  CYRILLIC: 0.58,        // Cyrillic characters
  UNKNOWN: 1.1,          // Multiplier for unknown Unicode characters
};

// Kerning and spacing adjustment factors
const KERNING_ADJUSTMENTS = {
  BASE: 1.0,                    // Base kerning factor (no adjustment)
  COMPLEX_SCRIPTS: 0.95,        // Complex scripts often have tighter spacing
  LONG_TEXT: 0.98,              // Longer text tends to have slightly tighter spacing
  MULTIPLE_DIGITS: 1.08,        // Extra width for digit-heavy text in proportional fonts
  LIGATURE_REDUCTION: 0.05,     // Reduction per ligature (ligatures save space)
  FONT_SATOSHI: 1.05,           // Satoshi Bold runs ~5% wider than Arial regular; calibrated to resvg's rendered output
  FONT_TIMES: 1.02,             // Times font tends to be wider
};

// Text thresholds for applying different measurement strategies
const TEXT_THRESHOLDS = {
  LONG_TEXT_LENGTH: 20,         // Text longer than this is considered "long"
  MULTIPLE_DIGITS_COUNT: 2,     // More than this many digits triggers digit spacing
  VERY_SHORT_TEXT_LENGTH: 5,    // Text shorter than this gets confidence penalty
};

// Confidence score constants
const CONFIDENCE = {
  BASE: 0.85,                   // Starting confidence for fallback measurements
  COMPLEX_SCRIPTS_PENALTY: 0.1, // Reduce confidence for complex scripts
  SHORT_TEXT_PENALTY: 0.05,     // Reduce confidence for very short text
  LIGATURE_BONUS: 0.05,         // Increase confidence when ligatures detected
  MIN: 0.5,                     // Minimum confidence score
  MAX: 0.95,                    // Maximum confidence score
};

// Other measurement constants
const MEASUREMENT_CONSTANTS = {
  HEIGHT_MULTIPLIER: 1.2,       // Standard line height factor
};

/**
 * Fallback text measurement using mathematical approximation with comprehensive Unicode support
 * Handles international scripts (CJK, Arabic, Hebrew, etc.) and emojis with character-specific widths
 * @param {string} text - The text to measure
 * @param {number} [fontSize=48] - Font size in pixels
 * @param {string} [fontFamily='Arial'] - Font family name for font-specific adjustments
 * @returns {Object} Measurement object containing:
 *   - width: Estimated text width in pixels
 *   - height: Text height in pixels
 *   - actualBoundingBoxAscent: Distance from baseline to top
 *   - actualBoundingBoxDescent: Distance from baseline to bottom
 *   - isAccurate: Always false (indicates fallback measurement)
 *   - confidence: Confidence score (0.5-0.95) based on text complexity
 * @example
 * const metrics = measureTextFallback('你好世界', 48, 'Arial');
 * console.log(`Estimated width: ${metrics.width}px (${metrics.confidence * 100}% confidence)`);
 */
export function measureTextFallback(text, fontSize = 48, fontFamily = 'Arial') {
  // Font-specific metrics (character widths in em units)
  const fontMetrics = {
    'Arial': { avgChar: 0.56, baseline: 0.8, descent: 0.2 },
    'Helvetica': { avgChar: 0.56, baseline: 0.8, descent: 0.2 },
    'Times': { avgChar: 0.5, baseline: 0.75, descent: 0.25 },
    'Georgia': { avgChar: 0.52, baseline: 0.75, descent: 0.25 },
    'Verdana': { avgChar: 0.6, baseline: 0.8, descent: 0.2 },
    'Satoshi': { avgChar: 0.54, baseline: 0.8, descent: 0.2 }, // Custom font
    'default': { avgChar: 0.56, baseline: 0.8, descent: 0.2 }
  };

  // Comprehensive character width database (based on Arial measurements)
  const charWidthDb = {
    // Latin lowercase
    'a': 0.56, 'b': 0.56, 'c': 0.5, 'd': 0.56, 'e': 0.56, 'f': 0.28, 'g': 0.56, 'h': 0.56, 'i': 0.22, 'j': 0.22,
    'k': 0.5, 'l': 0.22, 'm': 0.83, 'n': 0.56, 'o': 0.56, 'p': 0.56, 'q': 0.56, 'r': 0.33, 's': 0.5, 't': 0.28,
    'u': 0.56, 'v': 0.5, 'w': 0.72, 'x': 0.5, 'y': 0.5, 'z': 0.5,

    // Latin uppercase
    'A': 0.67, 'B': 0.67, 'C': 0.72, 'D': 0.72, 'E': 0.67, 'F': 0.61, 'G': 0.78, 'H': 0.72, 'I': 0.28, 'J': 0.5,
    'K': 0.67, 'L': 0.56, 'M': 0.83, 'N': 0.72, 'O': 0.78, 'P': 0.67, 'Q': 0.78, 'R': 0.72, 'S': 0.67, 'T': 0.61,
    'U': 0.72, 'V': 0.67, 'W': 0.94, 'X': 0.67, 'Y': 0.67, 'Z': 0.61,

    // Numbers (monospace in most fonts)
    '0': 0.56, '1': 0.56, '2': 0.56, '3': 0.56, '4': 0.56, '5': 0.56, '6': 0.56, '7': 0.56, '8': 0.56, '9': 0.56,

    // Common punctuation and symbols
    ' ': 0.28, '.': 0.28, ',': 0.28, ';': 0.28, ':': 0.28, '!': 0.28, '?': 0.56, "'": 0.19, '"': 0.35, '`': 0.33,
    '-': 0.33, '–': 0.56, '—': 1.0, '_': 0.56, '(': 0.33, ')': 0.33, '[': 0.28, ']': 0.28, '{': 0.33, '}': 0.33,
    '/': 0.28, '\\': 0.28, '|': 0.26, '@': 1.0, '#': 0.56, '$': 0.56, '%': 0.89, '&': 0.67, '*': 0.39, '+': 0.58,
    '=': 0.58, '<': 0.58, '>': 0.58, '^': 0.47, '~': 0.58
  };

  // Get font metrics for the specified font family
  const fontName = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  const metrics = fontMetrics[fontName] || fontMetrics.default;

  let totalWidth = 0;
  let hasComplexScripts = false;
  let ligatureCount = 0;

  // Use Intl.Segmenter to properly handle grapheme clusters (compound emojis, etc.)
  let segments;
  try {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    segments = [...segmenter.segment(text)];
  } catch (error) {
    // Fallback if Intl.Segmenter is not available
    segments = [...text].map((char, index) => ({ segment: char, index }));
  }

  // Iterate through each grapheme cluster
  for (let i = 0; i < segments.length; i++) {
    const char = segments[i].segment;
    const charCode = char.codePointAt(0);

    let charWidth = charWidthDb[char];

    if (charWidth) {
      // Use precise character width from database
      totalWidth += charWidth;

      // Check for common ligatures
      if (i < segments.length - 1) {
        const nextChar = segments[i + 1].segment;
        const pair = char + nextChar;
        if (['fi', 'fl', 'ff', 'ffi', 'ffl'].includes(pair)) {
          ligatureCount++;
        }
      }
    } else {
      // Categorize by Unicode ranges with accurate widths
      if (
        // East Asian full-width characters (CJK)
        (charCode >= 0x1100 && charCode <= 0x11FF) ||   // Hangul Jamo
        (charCode >= 0x2E80 && charCode <= 0x2FDF) ||   // CJK Radicals
        (charCode >= 0x3000 && charCode <= 0x303F) ||   // CJK Symbols
        (charCode >= 0x3040 && charCode <= 0x309F) ||   // Hiragana
        (charCode >= 0x30A0 && charCode <= 0x30FF) ||   // Katakana
        (charCode >= 0x3100 && charCode <= 0x312F) ||   // Bopomofo
        (charCode >= 0x3130 && charCode <= 0x318F) ||   // Hangul Compatibility Jamo
        (charCode >= 0x3200 && charCode <= 0x32FF) ||   // Enclosed CJK Letters
        (charCode >= 0x3400 && charCode <= 0x4DBF) ||   // CJK Extension A
        (charCode >= 0x4E00 && charCode <= 0x9FFF) ||   // CJK Unified Ideographs
        (charCode >= 0xAC00 && charCode <= 0xD7AF) ||   // Hangul Syllables
        (charCode >= 0xF900 && charCode <= 0xFAFF) ||   // CJK Compatibility
        (charCode >= 0xFE30 && charCode <= 0xFE4F) ||   // CJK Compatibility Forms
        (charCode >= 0xFF00 && charCode <= 0xFFEF) ||   // Halfwidth/Fullwidth Forms
        (charCode >= 0x20000 && charCode <= 0x2A6DF) || // CJK Extension B
        (charCode >= 0x2A700 && charCode <= 0x2B73F) || // CJK Extension C
        (charCode >= 0x2B740 && charCode <= 0x2B81F) || // CJK Extension D
        (charCode >= 0x2B820 && charCode <= 0x2CEAF)    // CJK Extension E
      ) {
        charWidth = UNICODE_WIDTHS.CJK;
        hasComplexScripts = true;
      } else if (
        // Emoji and symbols (variable width, mostly wide)
        (charCode >= 0x1F000 && charCode <= 0x1F9FF) ||  // Emoji blocks
        (charCode >= 0x1FA00 && charCode <= 0x1FAFF) ||  // Extended Emoji
        (charCode >= 0x2600 && charCode <= 0x26FF) ||    // Miscellaneous Symbols
        (charCode >= 0x2700 && charCode <= 0x27BF) ||    // Dingbats
        (charCode >= 0xFE00 && charCode <= 0xFE0F) ||    // Variation Selectors
        (charCode >= 0x1F1E6 && charCode <= 0x1F1FF)     // Regional Indicators (flags)
      ) {
        charWidth = UNICODE_WIDTHS.EMOJI;
      } else if (
        // Arabic script (right-to-left, contextual)
        (charCode >= 0x0600 && charCode <= 0x06FF) ||    // Arabic
        (charCode >= 0x0750 && charCode <= 0x077F) ||    // Arabic Supplement
        (charCode >= 0xFB50 && charCode <= 0xFDFF) ||    // Arabic Presentation Forms-A
        (charCode >= 0xFE70 && charCode <= 0xFEFF)       // Arabic Presentation Forms-B
      ) {
        charWidth = UNICODE_WIDTHS.ARABIC;
        hasComplexScripts = true;
      } else if (
        // Hebrew script (right-to-left)
        (charCode >= 0x0590 && charCode <= 0x05FF)       // Hebrew
      ) {
        charWidth = UNICODE_WIDTHS.HEBREW;
        hasComplexScripts = true;
      } else if (
        // Devanagari and related scripts (Hindi, etc.)
        (charCode >= 0x0900 && charCode <= 0x097F) ||    // Devanagari
        (charCode >= 0x0980 && charCode <= 0x09FF) ||    // Bengali
        (charCode >= 0x0A00 && charCode <= 0x0A7F) ||    // Gurmukhi
        (charCode >= 0x0A80 && charCode <= 0x0AFF)       // Gujarati
      ) {
        charWidth = UNICODE_WIDTHS.INDIC;
        hasComplexScripts = true;
      } else if (
        // Thai script
        (charCode >= 0x0E00 && charCode <= 0x0E7F)       // Thai
      ) {
        charWidth = UNICODE_WIDTHS.THAI;
        hasComplexScripts = true;
      } else if (
        // Georgian script
        (charCode >= 0x10A0 && charCode <= 0x10FF)       // Georgian
      ) {
        charWidth = UNICODE_WIDTHS.GEORGIAN;
        hasComplexScripts = true;
      } else if (
        // Greek script
        (charCode >= 0x0370 && charCode <= 0x03FF)       // Greek
      ) {
        charWidth = UNICODE_WIDTHS.GREEK;
      } else if (
        // Cyrillic script (Russian, etc.)
        (charCode >= 0x0400 && charCode <= 0x04FF) ||    // Cyrillic
        (charCode >= 0x0500 && charCode <= 0x052F)       // Cyrillic Supplement
      ) {
        charWidth = UNICODE_WIDTHS.CYRILLIC;
      } else if (charCode <= 0x007F) {
        // ASCII characters not in database
        charWidth = metrics.avgChar;
      } else {
        // Other Unicode characters - use font average
        charWidth = metrics.avgChar * UNICODE_WIDTHS.UNKNOWN;
      }

      totalWidth += charWidth;
    }
  }

  // Apply font-specific scaling
  const scaledWidth = totalWidth * fontSize;

  // Apply text adjustments
  let kerningAdjustment = KERNING_ADJUSTMENTS.BASE;

  // Check for digit-heavy text that might need extra spacing
  const digitCount = (text.match(/\d/g) || []).length;
  const hasMultipleDigits = digitCount > TEXT_THRESHOLDS.MULTIPLE_DIGITS_COUNT;

  // Kerning adjustments
  if (hasComplexScripts) {
    kerningAdjustment = KERNING_ADJUSTMENTS.COMPLEX_SCRIPTS;
  } else if (text.length > TEXT_THRESHOLDS.LONG_TEXT_LENGTH) {
    kerningAdjustment = KERNING_ADJUSTMENTS.LONG_TEXT;
  }

  // Digit spacing adjustments for proportional fonts (due to tabular styling)
  if (hasMultipleDigits && fontName !== 'Courier') {
    kerningAdjustment *= KERNING_ADJUSTMENTS.MULTIPLE_DIGITS;
  }

  // Ligature adjustments (ligatures take less space than individual characters)
  if (ligatureCount > 0) {
    kerningAdjustment *= (1 - (ligatureCount * KERNING_ADJUSTMENTS.LIGATURE_REDUCTION));
  }

  // Font-specific adjustments
  if (fontName === 'Satoshi') {
    kerningAdjustment *= KERNING_ADJUSTMENTS.FONT_SATOSHI;
  } else if (fontName === 'Times') {
    kerningAdjustment *= KERNING_ADJUSTMENTS.FONT_TIMES;
  }

  // Calculate confidence level
  let confidence = CONFIDENCE.BASE;
  if (hasComplexScripts) confidence -= CONFIDENCE.COMPLEX_SCRIPTS_PENALTY;
  if (text.length < TEXT_THRESHOLDS.VERY_SHORT_TEXT_LENGTH) confidence -= CONFIDENCE.SHORT_TEXT_PENALTY;
  if (ligatureCount > 0) confidence += CONFIDENCE.LIGATURE_BONUS;

  return {
    width: scaledWidth * kerningAdjustment,
    height: fontSize * MEASUREMENT_CONSTANTS.HEIGHT_MULTIPLIER,
    actualBoundingBoxAscent: fontSize * metrics.baseline,
    actualBoundingBoxDescent: fontSize * metrics.descent,
    isAccurate: false,
    confidence: Math.max(CONFIDENCE.MIN, Math.min(CONFIDENCE.MAX, confidence))
  };
}

// Canonical script/emoji classifier. Every other detector in this module
// is a thin wrapper over this — add new Unicode ranges here, not in callers.
/**
 * Classify text by Unicode script bucket.
 * @param {string} text
 * @returns {{
 *   hasCJK: boolean,            // Hiragana, Katakana, CJK ideographs, Hangul — typically outside Latin font coverage
 *   hasRTL: boolean,            // Arabic, Hebrew — bidi + special-font territory
 *   hasIndic: boolean,          // Devanagari, Bengali (Gurmukhi/Gujarati widths via fallback DB)
 *   hasThai: boolean,
 *   hasGeorgian: boolean,
 *   hasGreek: boolean,
 *   hasCyrillic: boolean,
 *   hasEmoji: boolean,          // Pictographic / dingbat / misc-symbol ranges
 *   hasComplexScripts: boolean, // hasCJK || hasRTL || hasIndic || hasThai — legacy bucket
 *   isInternational: boolean,   // any non-Latin script (drives wider-layout path)
 *   needsFallbackFont: boolean  // CJK/RTL/Indic/Thai/Georgian — Satoshi-style Latin fonts won't cover these
 * }}
 */
export function classifyText(text) {
  let hasCJK = false;
  let hasRTL = false;
  let hasIndic = false;
  let hasThai = false;
  let hasGeorgian = false;
  let hasGreek = false;
  let hasCyrillic = false;
  let hasEmoji = false;

  for (const ch of text) {
    const c = ch.codePointAt(0);

    // CJK family
    if (
      (c >= 0x3040 && c <= 0x309F) ||   // Hiragana
      (c >= 0x30A0 && c <= 0x30FF) ||   // Katakana
      (c >= 0x4E00 && c <= 0x9FFF) ||   // CJK Unified Ideographs
      (c >= 0x3400 && c <= 0x4DBF) ||   // CJK Extension A
      (c >= 0xAC00 && c <= 0xD7AF)      // Hangul Syllables
    ) {
      hasCJK = true;
    }

    // Right-to-left scripts
    if (
      (c >= 0x0590 && c <= 0x05FF) ||   // Hebrew
      (c >= 0x0600 && c <= 0x06FF) ||   // Arabic
      (c >= 0x0750 && c <= 0x077F) ||   // Arabic Supplement
      (c >= 0xFB50 && c <= 0xFDFF) ||   // Arabic Presentation Forms-A
      (c >= 0xFE70 && c <= 0xFEFF)      // Arabic Presentation Forms-B
    ) {
      hasRTL = true;
    }

    // Indic
    if (
      (c >= 0x0900 && c <= 0x097F) ||   // Devanagari
      (c >= 0x0980 && c <= 0x09FF) ||   // Bengali
      (c >= 0x0A00 && c <= 0x0A7F) ||   // Gurmukhi
      (c >= 0x0A80 && c <= 0x0AFF)      // Gujarati
    ) {
      hasIndic = true;
    }

    if (c >= 0x0E00 && c <= 0x0E7F) hasThai = true;                       // Thai
    if (c >= 0x10A0 && c <= 0x10FF) hasGeorgian = true;                   // Georgian
    if (c >= 0x0370 && c <= 0x03FF) hasGreek = true;                      // Greek
    if ((c >= 0x0400 && c <= 0x04FF) || (c >= 0x0500 && c <= 0x052F)) hasCyrillic = true;

    // Emoji / pictographic / dingbat bucket — see findings.md for why the
    // wide range is intentional for this library's ENS-style product.
    if (
      (c >= 0x1F000 && c <= 0x1F9FF) ||  // Emoji blocks
      (c >= 0x1FA00 && c <= 0x1FAFF) ||  // Extended Emoji
      (c >= 0x2600 && c <= 0x26FF) ||    // Miscellaneous Symbols
      (c >= 0x2700 && c <= 0x27BF) ||    // Dingbats
      (c >= 0x1F1E6 && c <= 0x1F1FF)     // Regional Indicators (flags)
    ) {
      hasEmoji = true;
    }
  }

  const hasComplexScripts = hasCJK || hasRTL || hasIndic || hasThai;
  const isInternational = hasComplexScripts || hasGeorgian || hasGreek || hasCyrillic || hasEmoji;
  const needsFallbackFont = hasCJK || hasRTL || hasIndic || hasThai || hasGeorgian;

  return {
    hasCJK, hasRTL, hasIndic, hasThai, hasGeorgian, hasGreek, hasCyrillic, hasEmoji,
    hasComplexScripts, isInternational, needsFallbackFont,
  };
}

// Back-compat wrappers over classifyText.
export function hasComplexScripts(text) {
  return classifyText(text).hasComplexScripts;
}

export function hasComplexEmojis(text) {
  return classifyText(text).hasEmoji;
}

/**
 * Analyze text and recommend measurement strategy with safety margins.
 * Returns `classifyText(text)` plus isLongText + recommendedSafetyMargin.
 */
export function getTextMeasurementStrategy(text) {
  const classification = classifyText(text);
  const isLongText = text.length > 50;
  // Flat 10% safety margin. Complex-script text already gets a narrower
  // text area via ENS_LAYOUT.CJK_WIDTH_FACTOR (0.85), so adding another
  // 5% here double-counts — see findings.md #3 / task #21.
  return {
    ...classification,
    needsHighPrecision: classification.hasEmoji || classification.hasComplexScripts,
    hasEmojis: classification.hasEmoji, // legacy alias
    isLongText,
    recommendedSafetyMargin: 0.1,
  };
}
