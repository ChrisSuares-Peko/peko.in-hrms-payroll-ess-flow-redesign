// A single unbroken token (DL number, engine/chassis number) that cannot fit a half-width
// phone column. Such values get a full-width column on xs so they never break mid-string.
export const isLongToken = (value: unknown, minLength = 12): boolean =>
    typeof value === 'string' && !value.includes(' ') && value.length > minLength;
