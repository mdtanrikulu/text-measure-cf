// Fallback text measurement with comprehensive Unicode support
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

  // Iterate through each character (handling surrogate pairs for emojis)
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    let charCode = text.codePointAt(i);
    
    // Skip low surrogate if we're on a high surrogate
    if (charCode > 0xFFFF) {
      i++; // Skip the next character as it's part of this surrogate pair
    }
    
    let charWidth = charWidthDb[char];
    
    if (charWidth) {
      // Use precise character width from database
      totalWidth += charWidth;
      
      // Check for common ligatures
      if (i < text.length - 1) {
        const nextChar = text[i + 1];
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
        charWidth = 1.2; // Full-width characters - increased from 1.0 to account for actual rendering width
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
        charWidth = 1.1; // Emojis are often slightly wider than regular characters
      } else if (
        // Arabic script (right-to-left, contextual)
        (charCode >= 0x0600 && charCode <= 0x06FF) ||    // Arabic
        (charCode >= 0x0750 && charCode <= 0x077F) ||    // Arabic Supplement
        (charCode >= 0xFB50 && charCode <= 0xFDFF) ||    // Arabic Presentation Forms-A
        (charCode >= 0xFE70 && charCode <= 0xFEFF)       // Arabic Presentation Forms-B
      ) {
        charWidth = 0.65; // Arabic characters are typically narrower
        hasComplexScripts = true;
      } else if (
        // Hebrew script (right-to-left)
        (charCode >= 0x0590 && charCode <= 0x05FF)       // Hebrew
      ) {
        charWidth = 0.6; // Hebrew characters
        hasComplexScripts = true;
      } else if (
        // Devanagari and related scripts (Hindi, etc.)
        (charCode >= 0x0900 && charCode <= 0x097F) ||    // Devanagari
        (charCode >= 0x0980 && charCode <= 0x09FF) ||    // Bengali
        (charCode >= 0x0A00 && charCode <= 0x0A7F) ||    // Gurmukhi
        (charCode >= 0x0A80 && charCode <= 0x0AFF)       // Gujarati
      ) {
        charWidth = 0.7; // Indic scripts
        hasComplexScripts = true;
      } else if (
        // Thai script
        (charCode >= 0x0E00 && charCode <= 0x0E7F)       // Thai
      ) {
        charWidth = 0.8; // Thai characters
        hasComplexScripts = true;
      } else if (
        // Georgian script
        (charCode >= 0x10A0 && charCode <= 0x10FF)       // Georgian
      ) {
        charWidth = 0.65; // Georgian characters
        hasComplexScripts = true;
      } else if (
        // Greek script
        (charCode >= 0x0370 && charCode <= 0x03FF)       // Greek
      ) {
        charWidth = 0.6; // Greek characters
      } else if (
        // Cyrillic script (Russian, etc.)
        (charCode >= 0x0400 && charCode <= 0x04FF) ||    // Cyrillic
        (charCode >= 0x0500 && charCode <= 0x052F)       // Cyrillic Supplement
      ) {
        charWidth = 0.58; // Cyrillic characters
      } else if (charCode <= 0x007F) {
        // ASCII characters not in database
        charWidth = metrics.avgChar;
      } else {
        // Other Unicode characters - use font average
        charWidth = metrics.avgChar * 1.1; // Slightly wider for unknown characters
      }
      
      totalWidth += charWidth;
    }
  }

  // Apply font-specific scaling
  const scaledWidth = totalWidth * fontSize;
  
  // Apply text adjustments
  let kerningAdjustment = 1.0;
  
  // Check for digit-heavy text that might need extra spacing
  const digitCount = (text.match(/\d/g) || []).length;
  const hasMultipleDigits = digitCount > 2;
  
  // Kerning adjustments
  if (hasComplexScripts) {
    kerningAdjustment = 0.95; // Complex scripts often have tighter spacing
  } else if (text.length > 20) {
    kerningAdjustment = 0.98; // Longer text tends to have slightly tighter average spacing
  }
  
  // Digit spacing adjustments for proportional fonts (due to tabular styling)
  if (hasMultipleDigits && fontName !== 'Courier') {
    kerningAdjustment *= 1.08; // Add 8% extra width for digit-heavy text in proportional fonts
  }
  
  // Ligature adjustments (ligatures take less space than individual characters)
  if (ligatureCount > 0) {
    kerningAdjustment *= (1 - (ligatureCount * 0.05)); // 5% reduction per ligature
  }
  
  // Font-specific adjustments
  if (fontName === 'Satoshi') {
    kerningAdjustment *= 0.96; // Satoshi tends to be tighter
  } else if (fontName === 'Times') {
    kerningAdjustment *= 1.02; // Times tends to be wider
  }

  // Calculate confidence level
  let confidence = 0.85; // Base confidence
  if (hasComplexScripts) confidence -= 0.1;
  if (text.length < 5) confidence -= 0.05; // Very short text is harder to predict
  if (ligatureCount > 0) confidence += 0.05; // Ligatures are predictable

  return {
    width: scaledWidth * kerningAdjustment,
    height: fontSize * 1.2,
    actualBoundingBoxAscent: fontSize * metrics.baseline,
    actualBoundingBoxDescent: fontSize * metrics.descent,
    isAccurate: false,
    confidence: Math.max(0.5, Math.min(0.95, confidence)) // Clamp between 50-95%
  };
}

// Detect if text contains complex scripts that might need special handling
export function hasComplexScripts(text) {
  return [...text].some(char => {
    const charCode = char.codePointAt(0);
    return (
      // CJK scripts
      (charCode >= 0x3040 && charCode <= 0x309F) ||   // Hiragana
      (charCode >= 0x30A0 && charCode <= 0x30FF) ||   // Katakana
      (charCode >= 0x4E00 && charCode <= 0x9FFF) ||   // CJK Unified Ideographs
      (charCode >= 0xAC00 && charCode <= 0xD7AF) ||   // Hangul Syllables
      // Arabic scripts
      (charCode >= 0x0600 && charCode <= 0x06FF) ||   // Arabic
      (charCode >= 0xFB50 && charCode <= 0xFDFF) ||   // Arabic Presentation Forms-A
      // Indic scripts
      (charCode >= 0x0900 && charCode <= 0x097F) ||   // Devanagari
      (charCode >= 0x0980 && charCode <= 0x09FF) ||   // Bengali
      // Thai script
      (charCode >= 0x0E00 && charCode <= 0x0E7F) ||   // Thai
      // Hebrew script
      (charCode >= 0x0590 && charCode <= 0x05FF)      // Hebrew
    );
  });
}

// Get appropriate fallback strategy based on text content
export function getTextMeasurementStrategy(text) {
  const hasEmojis = [...text].some(char => {
    const charCode = char.codePointAt(0);
    return (charCode >= 0x1F000 && charCode <= 0x1FFFF) || 
           (charCode >= 0x2600 && charCode <= 0x26FF) ||
           (charCode >= 0x2700 && charCode <= 0x27BF);
  });
  
  const hasComplex = hasComplexScripts(text);
  const isLong = text.length > 50;
  
  return {
    needsHighPrecision: hasEmojis || hasComplex,
    hasEmojis,
    hasComplexScripts: hasComplex,
    isLongText: isLong,
    recommendedSafetyMargin: hasComplex ? 0.15 : 0.1 // 15% vs 10%
  };
}