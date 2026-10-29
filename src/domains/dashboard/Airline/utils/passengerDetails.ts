export const getPaxType = (passengerType: string) => {
    if (passengerType === 'adult') return 1;
    if (passengerType === 'child') return 2;
    return 3;
};

export const getFairDetails = (fareQuotes: any, passengerType: 'adult' | 'child' | 'infant') => {
    if (!fareQuotes) return null;
    const passengerTypes = {
        adult: 1,
        child: 2,
        infant: 3,
    };
    const fairBreakdown = fareQuotes.FareBreakdown;
    const fare = fairBreakdown.filter(
        (fairDetails: any) => fairDetails.PassengerType === passengerTypes[passengerType]
    )[0];

    const { PassengerCount } = fare;
    return {
        BaseFare: fare.BaseFare / PassengerCount,
        Tax: fare.Tax / PassengerCount,
        // YQTax: fare.YQTax / PassengerCount,
        // AdditionalTxnFeeOfrd: fare.AdditionalTxnFeeOfrd / PassengerCount,
        // AdditionalTxnFeePub: fare.AdditionalTxnFeePub / PassengerCount,
    };
};
