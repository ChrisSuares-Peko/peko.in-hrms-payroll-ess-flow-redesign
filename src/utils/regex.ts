export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const alphabets = /^[a-zA-Z\s]+$/;
export const alphaNumeric = /^[a-zA-Z0-9\s,-]+$/;
export const numbers = /^\d+$/;
export const indianMobileRegex = /^[6-9]\d{9}$/;
export const ibanRegex = /^AE\d{2}\d{3}\d{16}$/;
export const trnRegex = /^[A-Z0-9]{10,15}$/;
export const tradeLicenseRegex = /^[A-Z0-9/-]+$/;
export const swiftCodeRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2,5}$/;
export const passportRegex = /^[A-Z0-9]{6,12}$/;
export const removeEmoji = /[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu;

// Corporate Cards — physical card request (Pine Labs field constraints).
// Name on card: letters, digits, space and dot only; 1–25 characters.
export const nameOnCardRegex = /^[A-Za-z0-9 .]{1,25}$/;
// Address line: ASCII letters/digits, a fixed punctuation set ( -'"/\.{}()[]:;#&@!,|=+ ), and only
// space / \r / \n as whitespace (tabs and other invisible whitespace are NOT allowed); 1–100 characters.
// No unicode / smart punctuation. (Literal space is used instead of \s so tabs are rejected per the spec.)
export const addressLineRegex = /^[-'"/\\.{}()[\]:;#&@!,|=+ a-zA-Z0-9\r\n]{1,100}$/;
