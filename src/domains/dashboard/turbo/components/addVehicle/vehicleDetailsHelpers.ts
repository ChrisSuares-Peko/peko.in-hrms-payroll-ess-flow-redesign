export const capitalizeFirstLetter = (text: any): string => {
    if (typeof text === 'string') {
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    return text; // return as-is if not a string
};

// FASTag is not applicable to 2-wheelers / 3-wheelers.
// rawData.class carries a wheel-class code suffix, e.g. "M-Cycle/Scooter(2WN)" or "Three Wheeler (Passenger)(3WT)".
export const isFastagApplicable = (vehicleClass?: string): boolean => {
    if (!vehicleClass) return true;
    return !/\((?:2|3)\s*W/i.test(vehicleClass);
};

export const getVehicleAge = (regDate: any): string => {
    const reg = new Date(regDate);
    const now = new Date();

    let years = now.getFullYear() - reg.getFullYear();
    let months = now.getMonth() - reg.getMonth();

    if (now.getDate() < reg.getDate()) months -= 1;
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    if (years === 0) return `${months} ${months === 1 ? 'Month' : 'Months'}`;
    if (months === 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`;
    return `${years} ${years === 1 ? 'Year' : 'Years'} ${months} ${months === 1 ? 'Month' : 'Months'}`;
};
