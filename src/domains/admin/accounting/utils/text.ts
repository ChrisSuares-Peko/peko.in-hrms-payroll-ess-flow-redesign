const SHOWN_NAMES = 3;

export const numbered = (noun: string, entryNumber?: string | null) =>
    entryNumber ? `${noun} ${entryNumber}` : noun;

export const plural = (count: number, singular: string, pluralForm: string) =>
    count === 1 ? singular : pluralForm;

export const joinNames = (names: string[]) => {
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

export const describeItems = (items: string[], count: number) => {
    const names = items.slice(0, SHOWN_NAMES);
    if (!names.length) return '';
    const rest = count - names.length;
    return rest > 0 ? `${names.join(', ')} and ${rest} more` : joinNames(names);
};
