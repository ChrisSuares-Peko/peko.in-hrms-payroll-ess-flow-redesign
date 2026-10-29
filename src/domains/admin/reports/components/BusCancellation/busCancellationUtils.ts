interface CancellationWindow {
    fromHour: number;
    toHour: number; // -1 = no upper limit
    chargePercent: number;
    flatCharge: number;
}

function parseCancellationPolicy(policy: string): CancellationWindow[] {
    return policy
        .split(';')
        .filter(Boolean)
        .map((segment) => {
            const [fromHour, toHour, chargePercent, flatCharge] = segment.split(':').map(Number);
            return { fromHour, toHour, chargePercent, flatCharge };
        });
}

// pickUpTime is minutes from midnight (e.g. "956" = 15:56)
function buildDepartureDate(doj: string, pickUpTime: string): Date {
    const base = new Date(doj); // midnight at journey date in its own timezone offset
    base.setMinutes(base.getMinutes() + parseInt(pickUpTime, 10));
    return base;
}

export function calculateBusRefundAmount(
    amountInINR: string | number,
    cancellationPolicy: string,
    doj: string,
    pickUpTime: string
): number {
    const amount = parseFloat(String(amountInINR));
    if (!amount || !cancellationPolicy || !doj || !pickUpTime) return 0;

    const windows = parseCancellationPolicy(cancellationPolicy);
    const departure = buildDepartureDate(doj, pickUpTime);
    const hoursUntilDeparture = (departure.getTime() - Date.now()) / (1000 * 60 * 60);

    const match = windows.find(({ fromHour, toHour }) => {
        const aboveFloor = hoursUntilDeparture >= fromHour;
        const belowCeiling = toHour === -1 || hoursUntilDeparture < toHour;
        return aboveFloor && belowCeiling;
    });

    if (!match) return 0;

    const chargeAmount = (amount * match.chargePercent) / 100 + match.flatCharge;
    return Math.max(0, Math.round((amount - chargeAmount) * 100) / 100);
}
