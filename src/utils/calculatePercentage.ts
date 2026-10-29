export function calculatePercentage(used: any, maximum: any) {
    if (!maximum || !used) {
        return 0;
    }

    const percentage = (used / maximum) * 100;
    return Math.round(percentage); // returns the percentage
}
