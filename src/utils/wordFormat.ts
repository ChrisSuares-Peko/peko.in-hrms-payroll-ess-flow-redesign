export const toTitleCase = (str: string): string => {
    try {
        if (!str) throw new Error('Input string is empty or invalid');
        if (str === 'N/A') return str;

        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    } catch (error) {
        console.error(`Error in toTitleCase: ${error.message}`);
        return str; // Return empty string as a fallback
    }
};

export const toSentenceCase = (str: string): string => {
    try {
        if (!str) throw new Error('Input string is empty or invalid');
        if (str === 'N/A') return str;

        const lowerStr = str.toLowerCase().trim();
        return lowerStr.charAt(0).toUpperCase() + lowerStr.slice(1);
    } catch (error) {
        console.error(`Error in toSentenceCase: ${error.message}`);
        return str; // Return empty string as a fallback
    }
};

type Role = string | undefined;

// It will convert string CORPORATE  to Corporate...
const formatString = (role: Role): string => {
    if (!role) return '';
    return `${role.charAt(0).toUpperCase()}${role.slice(1).toLowerCase()}`;
};

export default formatString;

export const seperateFullName = (fullname: string) => {
    if (!fullname) return ['', ''];
    const names = fullname.trim().split(' ');

    // Return the first element and join the rest as the second element
    return [names[0], names.slice(1).join(' ')];
};


export const sanitizeBillerName = (name?: string | null): string =>
    (name ?? '')
        .replace(/\b(?:undefined|null)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

export const snakeCaseToSentenceCase = (input: string) => {
    try {
        const words = input.toLowerCase().split('_');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    } catch (error) {
        return input;
    }
};
