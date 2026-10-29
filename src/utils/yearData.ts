const currentFullYear = new Date().getFullYear();
export const yearsData = [
    { label: (currentFullYear - 1).toString(), value: (currentFullYear - 1).toString() },
    { label: currentFullYear.toString(), value: currentFullYear.toString() },
    { label: (currentFullYear + 1).toString(), value: (currentFullYear + 1).toString() },
]

export const yearsCurrentAndPrev = [
    { label: (currentFullYear - 1).toString(), value: (currentFullYear - 1).toString() },
    { label: currentFullYear.toString(), value: currentFullYear.toString() },
]