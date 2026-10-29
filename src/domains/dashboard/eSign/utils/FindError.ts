/* eslint-disable no-else-return */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const FindError = (errors: any): string | null => {
    const getFirstNestedKey = (obj: any, path = ''): string | null => {
        for (const key in obj) {
            const currentPath = path ? `${path}.${key}` : key;
            if (typeof obj[key] === 'string') {
                return currentPath;
            } else if (typeof obj[key] === 'object') {
                const nestedKey = getFirstNestedKey(obj[key], currentPath);
                if (nestedKey) return nestedKey;
            }
        }
        return null;
    };

    const firstErrorKey = getFirstNestedKey(errors);

    if (firstErrorKey) {
        const formattedKey = firstErrorKey.replace(/\.(\d+)\./g, '[$1].');
        const field =
            document.querySelector(
                `[name="${formattedKey}"], textarea[name="${formattedKey}"], select[name="${formattedKey}"]`
            ) || document.querySelector(`[id$="${formattedKey.replace(/\[|\]/g, '')}"]`);

        if (field) {
            field.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (field as HTMLElement).focus();
        }
    }

    return firstErrorKey;
};

export default FindError;
