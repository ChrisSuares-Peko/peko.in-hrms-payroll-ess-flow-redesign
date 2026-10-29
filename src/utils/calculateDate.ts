export const getWorkingDaysInMonth = (year: number, month: number, workingDays: string[]) => {
    // month is 1-indexed (1 = January)
    const dayMap = {
        'SUN': 0,
        'MON': 1,
        'TUE': 2,
        'WED': 3,
        'THU': 4,
        'FRI': 5,
        'SAT': 6
    } as const;
    const workingDayIndices:number[] = workingDays.map((day) => dayMap[day as keyof typeof dayMap]);
    const date = new Date(year, month - 1, 1);
    let count = 0;
    while (date.getMonth() === month - 1) {
        if (workingDayIndices.includes(date.getDay())) {
            count += 1;
        }
        date.setDate(date.getDate() + 1);
    }
    return count;
}

export const getNonWorkingDaysBreakdown = (year: number, month: number, workingDays: string[]) => {
    // month is 1-indexed (1 = January)
    const dayMap:any = {
        0: 'SUN',
        1: 'MON',
        2: 'TUE',
        3: 'WED',
        4: 'THU',
        5: 'FRI',
        6: 'SAT'
    } as const;

    // Helper to get human readable name
    const readableName: Record<string, string> = {
        SUN: "Sunday",
        MON: "Monday",
        TUE: "Tuesday",
        WED: "Wednesday",
        THU: "Thursday",
        FRI: "Friday",
        SAT: "Saturday"
    };

    // Determine non-working day names
    const allDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const nonWorkingDayNames = allDays.filter(day => !workingDays.includes(day));
    // Build result object
    const result: { [key: string]: number } = {};
    nonWorkingDayNames.forEach((day) => {
        result[day] = 0;
    });

    // Loop through month and count
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
        const dayIdx = date.getDay();
        const dayName = dayMap[dayIdx];
        if (nonWorkingDayNames.includes(dayName)) {
            result[dayName] += 1;
        }
        date.setDate(date.getDate() + 1);
    }

    // Return as array of { day: "sunday", count: <number> }
    return Object.entries(result).map(([dayKey, count]) => ({
        day: readableName[dayKey],
        count
    }));
};
















