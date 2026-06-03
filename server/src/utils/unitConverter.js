/**
 * server/src/utils/unitConverter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * UNIT CONVERSION UTILITY — Core business logic for AasaMedChem (JavaScript Version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Conversion Factors ────────────────────────────────────────────────────────
export const CONVERSION_FACTORS = {
  g:     1,
  kg:    1000,
  mL:    1,
  L:     1000,
  count: 1,
};

// ── Unit → Base Unit Mapping ───────────────────────────────────────────────────
export const BASE_UNIT_FOR_TYPE = {
  weight: 'g',
  volume: 'mL',
  count:  'count',
};

// ── Core Conversion Functions ─────────────────────────────────────────────────

/**
 * Convert a quantity from any supported unit to its base unit.
 */
export function convertToBase(value, fromUnit) {
  return value * CONVERSION_FACTORS[fromUnit];
}

/**
 * Convert a quantity from base units to any target display unit.
 */
export function convertFromBase(baseValue, toUnit) {
  return baseValue / CONVERSION_FACTORS[toUnit];
}

// ── Price Conversion Functions ─────────────────────────────────────────────────

/**
 * Convert a user-entered price (₹ per some unit) into paise per BASE unit.
 */
export function convertPriceToBaseUnitPaise(priceINR, perUnit) {
  return (priceINR * 100) / CONVERSION_FACTORS[perUnit];
}

/**
 * Convert a price stored in paise per base unit back to ₹ per display unit.
 */
export function convertPriceFromBaseUnitPaise(paise, toUnit) {
  return (paise * CONVERSION_FACTORS[toUnit]) / 100;
}

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Returns the list of valid display units for a given unit type.
 */
export function getAvailableUnits(unitType) {
  switch (unitType) {
    case 'weight': return ['g', 'kg'];
    case 'volume': return ['mL', 'L'];
    case 'count':  return ['count'];
  }
}

/**
 * Auto-selects the best human-readable unit for a base value.
 */
export function getSmartDisplayUnit(baseValue, unitType) {
  switch (unitType) {
    case 'weight': {
      if (baseValue >= 1000) {
        return { value: convertFromBase(baseValue, 'kg'), unit: 'kg' };
      }
      return { value: baseValue, unit: 'g' };
    }
    case 'volume': {
      if (baseValue >= 1000) {
        return { value: convertFromBase(baseValue, 'L'), unit: 'L' };
      }
      return { value: baseValue, unit: 'mL' };
    }
    case 'count': {
      return { value: baseValue, unit: 'count' };
    }
  }
}
