import capitalize from 'lodash/capitalize';

export const probationOptions = [
    { key: 1, id: 1, value: 1, label: '1 month', name: 1 },
    { key: 2, id: 2, value: 2, label: ' 2 months', name: 2 },
    { key: 3, id: 3, value: 3, label: '3 months', name: 3 },
    { key: 4, id: 4, value: 4, label: '4 months', name: 4 },
    { key: 5, id: 5, value: 5, label: '5 months', name: 5 },
    { key: 6, id: 6, value: 6, label: '6 months', name: 6 },
    { key: 7, id: 7, value: 7, label: '7 months', name: 7 },
    { key: 8, id: 8, value: 8, label: '8 months', name: 8 },
    { key: 9, id: 9, value: 9, label: '9 months', name: 9 },
    { key: 10, id: 10, value: 10, label: '10 months', name: 10 },
    { key: 11, id: 11, value: 11, label: '11 months', name: 11 },
    { key: 12, id: 12, value: 12, label: '12 months', name: 12 },
];

/** Probation for a new employee unless HR picks another value. */
export const DEFAULT_PROBATION_MONTHS = 3;

// Probation Period choices for Add Employee, the edit drawer and bulk upload; "No probation" is a
// confirmed hire. The status itself is never picked — it follows the joining date and these months.
export const probationPeriodOptions = [
    { key: 0, id: 0, value: 0, label: 'No probation', name: 0 },
    ...probationOptions.map(option => ({ ...option, label: option.label.trim() })),
];

export const formatDocName = (docName: any) => {
    // Convert camelCase to space-separated words
    const spaced = docName.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Capitalize the first letter of each word
    return spaced
        .split(' ')
        .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const documentOptions = [
    { key: 1, id: 1, value: 'Adhaar Card', label: 'Adhaar Card' },
    { key: 2, id: 2, value: 'Pan Card', label: 'Pan Card' },
    { key: 3, id: 3, value: 'Bank Statement', label: 'Bank Statement' },
    { key: 4, id: 4, value: 'Offer Letter', label: 'Offer Letter' },
    {key:5,id:5,value:"10th Certificate",label:"10th Certificate"},
    {key:6,id:6,value:"12th Certificate",label:"12th Certificate"},
    {key:7,id:7,value:"Passport",label:"Passport"},
];
export const RequiredExpiryDateDocs = ["Passport"]   
export const stateOptions = [
    { key: 1, id: 1, value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { key: 2, id: 2, value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
    { key: 3, id: 3, value: 'Assam', label: 'Assam' },
    { key: 4, id: 4, value: 'Bihar', label: 'Bihar' },
    { key: 5, id: 5, value: 'Chhattisgarh', label: 'Chhattisgarh' },
    { key: 6, id: 6, value: 'Goa', label: 'Goa' },
    { key: 7, id: 7, value: 'Gujarat', label: 'Gujarat' },
    { key: 8, id: 8, value: 'Haryana', label: 'Haryana' },
    { key: 9, id: 9, value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
    { key: 10, id: 10, value: 'Jharkhand', label: 'Jharkhand' },
    { key: 11, id: 11, value: 'Karnataka', label: 'Karnataka' },
    { key: 12, id: 12, value: 'Kerala', label: 'Kerala' },
    { key: 13, id: 13, value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { key: 14, id: 14, value: 'Maharashtra', label: 'Maharashtra' },
    { key: 15, id: 15, value: 'Manipur', label: 'Manipur' },
    { key: 16, id: 16, value: 'Meghalaya', label: 'Meghalaya' },
    { key: 17, id: 17, value: 'Mizoram', label: 'Mizoram' },
    { key: 18, id: 18, value: 'Nagaland', label: 'Nagaland' },
    { key: 19, id: 19, value: 'Odisha', label: 'Odisha' },
    { key: 20, id: 20, value: 'Punjab', label: 'Punjab' },
    { key: 21, id: 21, value: 'Rajasthan', label: 'Rajasthan' },
    { key: 22, id: 22, value: 'Sikkim', label: 'Sikkim' },
    { key: 23, id: 23, value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { key: 24, id: 24, value: 'Telangana', label: 'Telangana' },
    { key: 25, id: 25, value: 'Tripura', label: 'Tripura' },
    { key: 26, id: 26, value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { key: 27, id: 27, value: 'Uttarakhand', label: 'Uttarakhand' },
    { key: 28, id: 28, value: 'West Bengal', label: 'West Bengal' },
    //  Union Territories
    { key: 29, id: 29, value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands' },
    { key: 30, id: 30, value: 'Chandigarh', label: 'Chandigarh' },
    {
        key: 31,
        id: 31,
        value: 'Dadra and Nagar Haveli and Daman and Diu',
        label: 'Dadra and Nagar Haveli and Daman and Diu',
    },
    { key: 32, id: 32, value: 'Delhi', label: 'Delhi' },
    { key: 33, id: 33, value: 'Jammu and Kashmir', label: 'Jammu and Kashmir' },
    { key: 34, id: 34, value: 'Ladakh', label: 'Ladakh' },
    { key: 35, id: 35, value: 'Lakshadweep', label: 'Lakshadweep' },
    { key: 36, id: 36, value: 'Puducherry', label: 'Puducherry' },
];

const ONES = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigitsToWords = (num: number): string => {
    if (num < 20) return ONES[num];
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
};

const threeDigitsToWords = (num: number): string => {
    const hundreds = Math.floor(num / 100);
    const rest = num % 100;
    if (hundreds && rest) return `${ONES[hundreds]} Hundred ${twoDigitsToWords(rest)}`;
    if (hundreds) return `${ONES[hundreds]} Hundred`;
    return twoDigitsToWords(rest);
};

/** Converts a non-negative integer to words using the Indian numbering system (lakh/crore), e.g. 264000 -> "Two Lakh Sixty Four Thousand". */
export const numberToIndianWords = (value: number): string => {
    const num = Math.floor(Math.abs(value));
    if (num === 0) return 'Zero';

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    const parts: string[] = [];
    if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
    if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
    if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
    if (remainder) parts.push(threeDigitsToWords(remainder));

    return parts.join(' ');
};

const sanitizeAmountValue = (value?: number | string): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const numericString = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
        const parsed = Number(numericString);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
};

export const parseSalaryAmount = (value?: number | string): number => sanitizeAmountValue(value);

export const amountToWords = (amount?: number | string): string => {
    const numericAmount = sanitizeAmountValue(amount);

    if (!Number.isFinite(numericAmount) || numericAmount === 0) return 'Zero';

    let integerPart = Math.floor(numericAmount);
    let decimalPart = Math.round((numericAmount - integerPart) * 100); // paise

    if (decimalPart === 100) {
        integerPart += 1;
        decimalPart = 0;
    }

    let words = '';

    if (integerPart > 0) {
        words += `${capitalize(numberToIndianWords(integerPart))} Rupees`;
    }

    if (decimalPart > 0) {
        if (integerPart > 0) words += ' and ';
        words += `${capitalize(numberToIndianWords(decimalPart))} Paise`;
    }

    return words;
};

export const formatLabel = (value?: string) => {
    if (!value) return 'Exit';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const formatText = (value: any) => {
    if (!value) return '';

    return String(value)
        .replace(/_/g, ' ') // replace underscores with spaces
        .toLowerCase() // convert all letters to lowercase
        .replace(/\b\w/g, char => char.toUpperCase()) // capitalize first letter of each word
        .trim();
};

export const statusOptions = [
    { key: 1, value: 'INPROBATION', label: 'Probation' },
    { key: 2, value: 'ACTIVE', label: 'Active' },
];

export const contractTypeOptions = [
    { key: 1, value: 'FULL_TIME', label: 'Full Time' },
    { key: 2, value: 'PART_TIME', label: 'Part Time' },
];
