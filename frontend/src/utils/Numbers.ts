import { isNumber } from "@/shared/types";

// TODO: Write tests!

export function isInteger(arg: unknown): arg is number {
    return isNumber(arg) && Number.isInteger(arg);
}

export function parseToInteger(arg: unknown, radix: number): number {
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
                    `Parsed integer does not match given string (radix: ${radix}): ${str}`
                );
            }
            return num;
        }
        default:
            throw new Error(`Cannot parse number (radix: ${radix}): ${arg}`);
    }
}

export function isFloat(arg: unknown): arg is number {
    return isNumber(arg) && Number.isFinite(arg);
}

export function parseToFloat(arg: unknown): number {
    if (isFloat(arg)) {
        return arg;
    }
    switch (typeof arg) {
        case "number":
            throw new Error(`Not a finite number: ${arg}`);
        case "string": {
            let str = (arg as string).trim();
            const num = parseFloat(str);
            if (isNaN(num)) {
                throw new Error(`Not a valid number: ${str}`);
            }

            if (Number.isInteger(num)) {
                str = str.replace(/\.0+$/, "");
            }

            if (num.toString(10) !== str) {
                throw new Error(
                    `Parsed float does not match given string: ${num.toString(
                        10
                    )} !== ${str}`
                );
            }
            return num;
        }
        default:
            throw new Error(`Cannot parse number: ${arg}`);
    }
}
