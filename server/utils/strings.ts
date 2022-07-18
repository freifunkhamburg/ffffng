import _ from "lodash"

export function normalizeString (str: string): string {
    return _.isString(str) ? str.trim().replace(/\s+/g, ' ') : str;
}

export function normalizeMac (mac: string): string {
    // parts only contains values at odd indexes
    const parts = mac.toUpperCase().replace(/:/g, '').split(/([A-F0-9]{2})/);

    const macParts = [];

    for (let i = 1; i < parts.length; i += 2) {
        macParts.push(parts[i]);
    }

    return macParts.join(':');
}

export function parseInteger (str: string): number {
    const parsed = _.parseInt(str, 10);
    if (parsed.toString() === str) {
        return parsed;
    } else {
        throw new SyntaxError(`String does not represent a valid integer: "${str}"`);
    }
}
