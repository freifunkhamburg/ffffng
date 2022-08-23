import { isString, MAC } from "../types";

export function normalizeString(str: string): string {
    return isString(str) ? str.trim().replace(/\s+/g, " ") : str;
}

export function normalizeMac(mac: MAC): MAC {
    // parts only contains values at odd indexes
    const parts = mac
        .toUpperCase()
        .replace(/[-:]/g, "")
        .split(/([A-F0-9]{2})/);

    const macParts = [];

    for (let i = 1; i < parts.length; i += 2) {
        macParts.push(parts[i]);
    }

    return macParts.join(":") as MAC;
}

export function parseInteger(str: string): number {
    const parsed = parseInt(str, 10);
    if (parsed.toString() === str) {
        return parsed;
    } else {
        throw new SyntaxError(
            `String does not represent a valid integer: "${str}"`
        );
    }
}
