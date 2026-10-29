export default function useTimeConvert() {
    function convertToAMPM(time: string): string {
        const splitTime: string[] = time?.split(':');
        if (splitTime?.length < 2) {
            return 'Invalid time format';
        }

        let hours: number = parseInt(splitTime?.[0], 10);
        const minutes: number = parseInt(splitTime?.[1], 10);
        const period: string = hours >= 12 ? 'PM' : 'AM';
        hours %= 12;
        hours = hours || 12;
        const convertedTime = `${hours}:${minutes < 10 ? `0${minutes}` : minutes} ${period}`;
        return convertedTime;
    }

    function convertToDateString(dateString: string) {
        const dateObject = new Date(dateString);
        dateObject.setUTCDate(dateObject.getUTCDate());

        const year = dateObject.getUTCFullYear();
        const month = String(dateObject.getUTCMonth() + 1).padStart(2, '0');
        const day = String(dateObject.getUTCDate()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;
        return formattedDate;
    }

    return { convertToAMPM, convertToDateString };
}
