export function isInteger(arg: unknown): arg is number {
    return typeof arg === "number" && Number.isInteger(arg);
}

// TODO: Write tests!
export function parseInteger(arg: unknown, radix: number): number {
    if (isInteger(arg)) {
        return arg;
    }
    switch (typeof arg) {
        case "number":
            throw new Error(`Not an integer: ${arg}`);
        case "string": {
            if (radix < 2 || radix > 36 || isNaN(radix)) {
                throw new Error(`Radix out of range: ${radix}`);
            }
            const str = (arg as string).trim();
            const num = parseInt(str, radix);
            if (isNaN(num)) {
                throw new Error(`Not a valid number (radix: ${radix}): ${str}`);
            }
            if (num.toString(radix).toLowerCase() !== str.toLowerCase()) {
                throw new Error(
                    `Parsed integer does not match given string (radix: {radix}): ${str}`
                );
            }
            return num;
        }
        default:
            throw new Error(`Cannot parse number (radix: ${radix}): ${arg}`);
    }
}
