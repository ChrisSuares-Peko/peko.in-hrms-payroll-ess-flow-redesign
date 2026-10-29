import dayjs, { Dayjs } from 'dayjs';

/**
 * Function to determine the default picker value based on minDate, maxDate, and currentDate.
 *
 * @param {Dayjs | undefined} minDate - The minimum selectable date.
 * @param {Dayjs | undefined} maxDate - The maximum selectable date.
 * @returns {Dayjs} - The calculated default picker value.
 */
export const getDefaultPickerValue = (minDate?: Dayjs, maxDate?: Dayjs): Dayjs => {
   
    const currentDate = dayjs(); // Get the current date
    try {
        // Determine the defaultPickerValue based on maxDate and minDate
        if (maxDate && minDate) {
            // Both maxDate and minDate are available
            if (maxDate.isAfter(currentDate)) {
                // If maxDate is in the future
                if (minDate.isAfter(currentDate)) {
                    // If minDate is also in the future, prioritize minDate
                    return minDate;
                }
                // If minDate is not in the future, use the current date
                return currentDate;
            }
            // If maxDate is not in the future, use maxDate (since it's the latest available)
            return maxDate;
        }
        if (minDate) {
            // Only minDate is available
            if (minDate.isAfter(currentDate)) {
                // If minDate is in the future, use minDate
                return minDate;
            }
            // If minDate is not in the future, use the current date
            return currentDate;
        }
        if (maxDate) {
            // Only maxDate is available
            if (maxDate.isAfter(currentDate)) {
                // If maxDate is in the future, use the current date
                return currentDate;
            }
            // If maxDate is not in the future, use maxDate (past date)
            return maxDate;
        }
        // Neither maxDate nor minDate are available, default to current date
        return currentDate;
    } catch (error) {
        return currentDate;
    }
};
