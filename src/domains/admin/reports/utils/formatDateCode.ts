export function convertTimeFormat(duration: string) {
    const durationRegex = /^(\d+)([DHM])?(\d+)?([DHM])?(\d+)?([DHM])?$/;
    const match = duration.match(durationRegex);

    if (!match) {
        return 'Invalid input format';
    }

    let formattedDuration = '';

    if (match[1]) {
        formattedDuration += `${match[1]} `;
        if (match[2]) {
            formattedDuration += match[2] === 'D' ? 'd' : match[2].toLowerCase();
        }
    }

    if (match[3]) {
        formattedDuration += ` ${match[3]} `;
        if (match[4]) {
            formattedDuration += match[4] === 'H' ? 'hr' : match[4].toLowerCase();
        }
    }

    if (match[5]) {
        formattedDuration += ` ${match[5]} `;
        if (match[6]) {
            formattedDuration += match[6] === 'M' ? 'm' : match[6].toLowerCase();
        }
    }
    return formattedDuration.trim();
}
