const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

export const toBaseUnits = (value, decimals) => {
  const normalized = String(value).trim();
  if (!DECIMAL_PATTERN.test(normalized)) {
    throw new Error(`Invalid decimal value: "${value}"`);
  }

  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) {
    throw new Error(
      `Too many decimal places for ${decimals} decimals: received ${fraction.length}`
    );
  }

  const base = 10n ** BigInt(decimals);
  const wholePart = BigInt(whole) * base;
  const fractionPart = BigInt((fraction + "0".repeat(decimals)).slice(0, decimals));
  return wholePart + fractionPart;
};

export const formatUnits = (value, decimals) => {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const fraction = abs % base;

  if (fraction === 0n) {
    return `${negative ? "-" : ""}${whole.toString()}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  return `${negative ? "-" : ""}${whole.toString()}.${fractionText}`;
};

export const divideToDecimalString = (numerator, denominator, precision = 8) => {
  if (denominator === 0n) {
    throw new Error("Division by zero");
  }

  const sign = numerator < 0n !== denominator < 0n ? "-" : "";
  const absNum = numerator < 0n ? -numerator : numerator;
  const absDen = denominator < 0n ? -denominator : denominator;

  const integer = absNum / absDen;
  let remainder = absNum % absDen;
  if (precision <= 0) {
    return `${sign}${integer.toString()}`;
  }

  let fraction = "";
  for (let i = 0; i < precision; i += 1) {
    remainder *= 10n;
    fraction += (remainder / absDen).toString();
    remainder %= absDen;
    if (remainder === 0n) {
      break;
    }
  }

  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${sign}${integer.toString()}.${trimmed}` : `${sign}${integer.toString()}`;
};

