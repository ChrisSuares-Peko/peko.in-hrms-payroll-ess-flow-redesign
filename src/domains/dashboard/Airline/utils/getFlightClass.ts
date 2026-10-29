interface IFlightClass {
    [key: string]: string;
}

export const retrieveFlightClass = (classCode: number) => {
    const flightClass: IFlightClass = {
        1: 'All',
        2: 'Economy Class',
        3: 'Premium Economy',
        4: 'Business Class',
        6: 'First Class',
    };
    return flightClass[classCode] || 'Unknown Class';
};

export const findLastSegment = (journey: any) => {
    const lastSegment = journey[journey.length - 1];
    return lastSegment;
};
