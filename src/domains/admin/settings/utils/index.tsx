export function maskActivationCode(code: string, visibleChars = 4) {
    const codeLength = code.length;

    // Ensure that the number of visible characters does not exceed half the length of the code
    if (visibleChars * 2 > codeLength) {
        visibleChars = Math.floor(codeLength / 2);
    }

    const start = code.slice(0, visibleChars);
    const end = code.slice(-visibleChars);
    const maskedSection = '*'.repeat(codeLength - visibleChars * 2);

    return `${start}${maskedSection}${end}`;
}
