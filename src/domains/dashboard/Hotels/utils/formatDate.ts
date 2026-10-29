// eg: input:'2024-02-28' , Output: "28 Feb'"
export const formatNewDate = (dateString: string | number | Date): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
    };
    const formattedDate = date.toLocaleDateString('en-GB', options);
    return `${formattedDate.slice(0, 2)} ${formattedDate.slice(3)}`;
};

export const mapRatingStringToNumber = (rating: string): number => {
    switch (rating) {
        case 'FiveStar':
            return 5;
        case 'FourStar':
            return 4;
        case 'ThreeStar':
            return 3;
        case 'TwoStar':
            return 2;
        case 'OneStar':
            return 1;
        default:
            return 0; // For 'No Stars' or unknown ratings
    }
};
