/**
 * client/src/utils/unitConverter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CLIENT-SIDE UNIT CONVERTER (JavaScript version)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CONVERSION_FACTORS = {
  g:     1,
  kg:    1000,
  mL:    1,
  L:     1000,
  count: 1,
};

export const BASE_UNIT_FOR_TYPE = {
  weight: 'g',
  volume: 'mL',
  count:  'count',
};

/**
 * Convert a value from any unit to its base unit.
 */
export function convertToBase(value, fromUnit) {
  return value * CONVERSION_FACTORS[fromUnit];
}

/**
 * Convert a value from base units back to any display unit.
 */
export function convertFromBase(baseValue, toUnit) {
  return baseValue / CONVERSION_FACTORS[toUnit];
}

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

/**
 * Get valid unit options for a given unit type.
 */
export function getAvailableUnits(unitType) {
  switch (unitType) {
    case 'weight': return ['g', 'kg'];
    case 'volume': return ['mL', 'L'];
    case 'count':  return ['count'];
  }
}

/**
 * Get the default display unit for a unit type.
 */
export function getDefaultUnit(unitType) {
  switch (unitType) {
    case 'weight': return 'kg';
    case 'volume': return 'L';
    case 'count':  return 'count';
  }
}

/**
 * Compute the estimated total price (in INR) for a cart item.
 */
export function computeCartItemPrice(product, quantity, selectedUnit) {
  if (!quantity || quantity <= 0) return 0;

  const baseQty    = convertToBase(quantity, selectedUnit);
  const totalPaise = baseQty * product.basePrice.paise;
  return totalPaise / 100;
}

