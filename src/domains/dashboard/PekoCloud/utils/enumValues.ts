import dayjs from 'dayjs';

export const assetCategories = [
    { oName: 'Laptop', oValue: 'Laptop' },
    { oName: 'CCTV', oValue: 'CCTV' },
    { oName: 'Printer', oValue: 'Printer' },
    { oName: 'Memory Device', oValue: 'Memory Device' },
    { oName: 'Others', oValue: 'Others' },
];
export const assetTypes = [
    { label: 'Rented', value: 'Rented' },
    { label: 'Leased', value: 'Leased' },
    { label: 'Owned', value: 'Owned' },
];
export const amountRecurrings = [
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Quarterly', value: 'Quarterly' },
    { label: 'Half-Yearly', value: 'Half-Yearly' },
    { label: 'Yearly', value: 'Yearly' },
];
export const currencies = [
    { label: 'USD', value: 'USD' },
    { label: 'INR', value: 'INR' },
];
export const assetWarranties = [
    { label: 'Unlimited', value: 'Unlimited' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '5+', value: '5+' },
];
export const assetStatus = (isEmployeeSelected: any, purchasedDate: string) => {
    let statusList = [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Reserved', value: 'Reserved' },
        { label: 'Disposed', value: 'Disposed' },
        { label: 'Damaged', value: 'Damaged' },
        { label: 'Unavailable', value: 'Unavailable' },
    ];
    const ExcludeIfEmployeeAvail = ['Disposed', 'Damaged', 'Unavailable'];
    const ExcludeIfPurchaseDateIsFuture = ['Disposed', 'Damaged', 'Active'];
    if (isEmployeeSelected) {
        statusList = statusList.filter(status => !ExcludeIfEmployeeAvail.includes(status.value));
    }
    if (purchasedDate && dayjs(purchasedDate).isAfter(dayjs())) {
        statusList = statusList.filter(
            status => !ExcludeIfPurchaseDateIsFuture.includes(status.value)
        );
    }
    return statusList;
};
export const usageHistoryReturnStatus = [
    { label: 'Good', value: 'Good' },
    { label: 'Damaged', value: 'Damaged' },
    { label: 'Perfect', value: 'Perfect' },
];
export const chequeBookCurrencies = [
    { label: 'INR', value: 'INR' },
    { label: 'INR', value: 'INR' },
    { label: 'USD', value: 'USD' },
    { label: 'SAR', value: 'SAR' },
    { label: 'KWD', value: 'KWD' },
];
export const chequeBookStatus = [
    { label: 'Issued', value: 'Issued' },
    { label: 'Active', value: 'Active' },
    { label: 'Exhausted', value: 'Exhausted' },
    { label: 'Lost', value: 'Lost' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Expired', value: 'Expired' },
    { label: 'Reissued', value: 'Reissued' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Returned', value: 'Returned' },
    { label: 'Damaged', value: 'Damaged' },
];
export const chequeLeafStatus = [
    { label: 'Issued', value: 'Issued' },
    { label: 'Presented', value: 'Presented' },
    { label: 'Cleared', value: 'Cleared' },
    { label: 'Bounced', value: 'Bounced' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Stopped', value: 'Stopped' },
    { label: 'Lost', value: 'Lost' },
    { label: 'Expired', value: 'Expired' },
    { label: 'Reissued', value: 'Reissued' },
    { label: 'Pending', value: 'Pending' },
];
export const subscriptionStatus = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'Suspended', value: 'Suspended' },
    { label: 'Trial', value: 'Trial' },
    { label: 'Renewing', value: 'Renewing' },
    { label: 'Failed', value: 'Failed' },
    { label: 'Paused', value: 'Paused' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Upgrade Pending', value: 'Upgrade Pending' },
    { label: 'Downgrade Pending', value: 'Downgrade Pending' },
    { label: 'Grace Period', value: 'Grace Period' },
];
export const vehicleTypes = [
    { oName: 'Car', oValue: 'Car' },
    { oName: 'Suv', oValue: 'Suv' },
    { oName: 'Truck', oValue: 'Truck' },
    { oName: 'Two Wheeler', oValue: 'Two Wheeler' },
    { oName: 'Others', oValue: 'Others' },
];
export const vehicleStatus = (isEmployeeSelected: any, purchasedDate: string) => {
    let statusList = [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Maintenance', value: 'Maintenance' },
        { label: 'Unavailable', value: 'Unavailable' },
        { label: 'Retired', value: 'Retired' },
    ];
    const ExcludeIfEmployeeAvail = ['Maintenance', 'Retired', 'Unavailable'];
    const ExcludeIfPurchaseDateIsFuture = ['Active', 'Maintenance', 'Retired'];
    if (isEmployeeSelected) {
        statusList = statusList.filter(status => !ExcludeIfEmployeeAvail.includes(status.value));
    }
    if (purchasedDate && dayjs(purchasedDate).isAfter(dayjs())) {
        statusList = statusList.filter(
            status => !ExcludeIfPurchaseDateIsFuture.includes(status.value)
        );
    }
    return statusList;
};
