export const tripMethods = [
    { value: 1, label: 'One Way' },
    { value: 2, label: 'Round Trip' },
    { value: 3, label: 'Multi City' },
];

type PassengerType = 'adult' | 'child' | 'infant';
type Gender = 'M' | 'F';

export const getTitleOptions = (passengerType: PassengerType, gender: Gender) => {
    const titles = {
        adult: {
            M: [
                { label: 'Mr', value: 'Mr' },
                { label: 'Capt', value: 'Capt' },
                { label: 'Dr', value: 'Dr' },
                { label: 'Prof', value: 'Prof' },
            ],
            F: [
                { label: 'Miss', value: 'Miss' },
                { label: 'Mrs', value: 'Mrs' },
                { label: 'Ms', value: 'Ms' },
                { label: 'Capt', value: 'Capt' },
                { label: 'Dr', value: 'Dr' },
                { label: 'Prof', value: 'Prof' },
            ],
        },
        child: {
            M: [
                { label: 'Mr', value: 'Mr' },
                { label: 'Mstr', value: 'Mstr' },
            ],
            F: [
                { label: 'Miss', value: 'Miss' },
                { label: 'Ms', value: 'Ms' },
            ],
        },
        infant: {
            M: [
                { label: 'Inf', value: 'Inf' },
                { label: 'Mstr', value: 'Mstr' },
            ],
            F: [
                { label: 'Inf', value: 'Inf' },
                { label: 'Miss', value: 'Miss' },
                { label: 'Ms', value: 'Ms' },
            ],
        },
    };

    return titles[passengerType] ? titles[passengerType][gender] : [];
};
