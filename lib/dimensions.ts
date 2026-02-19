export interface ParsedDimension {
  inches: number | null;
  error?: string;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function parseDimensionInput(input?: string): ParsedDimension {
  if (!input || input.trim() === "") {
    return { inches: null };
  }

  const raw = input.trim().toLowerCase();
  const compact = raw.replace(/,/g, "");

  const feetMatch = compact.match(/(-?\d+(?:\.\d+)?)\s*(?:ft|feet|')/);
  const inchMatch = compact.match(/(-?\d+(?:\.\d+)?)\s*(?:in|inch|inches|")/);

  if (feetMatch || inchMatch) {
    const feet = feetMatch ? Number(feetMatch[1]) : 0;
    const inches = inchMatch ? Number(inchMatch[1]) : 0;

    if (!Number.isFinite(feet) || !Number.isFinite(inches) || feet < 0 || inches < 0) {
      return { inches: null, error: `Invalid dimension: ${input}` };
    }

    return { inches: round(feet * 12 + inches) };
  }

  const unitMatch = compact.match(/^(-?\d+(?:\.\d+)?)\s*(mm|millimeter|millimeters|cm|centimeter|centimeters|m|meter|meters|in|inch|inches)?$/);
  if (!unitMatch) {
    return { inches: null, error: `Invalid dimension: ${input}` };
  }

  const value = Number(unitMatch[1]);
  const unit = unitMatch[2] ?? "in";

  if (!Number.isFinite(value) || value < 0) {
    return { inches: null, error: `Invalid dimension: ${input}` };
  }

  let inches = value;
  if (unit === "mm" || unit === "millimeter" || unit === "millimeters") {
    inches = value / 25.4;
  } else if (unit === "cm" || unit === "centimeter" || unit === "centimeters") {
    inches = value / 2.54;
  } else if (unit === "m" || unit === "meter" || unit === "meters") {
    inches = value * 39.3701;
  }

  return { inches: round(inches) };
}

export function formatInches(value?: number | null) {
  if (value == null) {
    return "-";
  }

  const rounded = round(value);
  if (Number.isInteger(rounded)) {
    return `${rounded} in`;
  }

  return `${rounded.toFixed(2)} in`;
}

export function formatCaseDimensions(lengthIn?: number | null, widthIn?: number | null, heightIn?: number | null) {
  if (lengthIn == null && widthIn == null && heightIn == null) {
    return "Not set";
  }

  return `${formatInches(lengthIn)} x ${formatInches(widthIn)} x ${formatInches(heightIn)}`;
}
