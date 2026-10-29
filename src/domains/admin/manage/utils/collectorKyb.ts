export const getKybStatusDropdown = (kybStatus: string) => {
    const allStatuses = [
        { value: 'INITIATED', label: 'Initiated' },
        { value: 'DOCUMENT UPLOADED', label: 'Document Uploaded' },
        { value: 'E-SIGN PENDING', label: 'E-sign Pending' },
        { value: 'PENDING REVIEW', label: 'Pending Review' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
    ];

    switch (kybStatus) {
        case 'INITIATED':
            // Show all statuses if status is 'INITIATED'
            return allStatuses.filter(
                status => status.value !== 'APPROVED' && status.value !== 'REJECTED'
            );

        case 'DOCUMENT UPLOADED':
            // Show all except 'INITIATED'
            return allStatuses.filter(
                status =>
                    status.value !== 'INITIATED' &&
                    status.value !== 'APPROVED' &&
                    status.value !== 'REJECTED'
            );
        case 'E-SIGN PENDING':
            // Show all except 'INITIATED'
            return allStatuses.filter(
                status =>
                    status.value !== 'INITIATED' &&
                    status.value !== 'APPROVED' &&
                    status.value !== 'REJECTED'
            );
        case 'PENDING REVIEW':
            // Show all except 'INITIATED'
            return allStatuses.filter(status => status.value !== 'INITIATED');

        case 'APPROVED':
            // If 'APPROVED', no need to show any values
            return [];

        case 'REJECTED':
            // Show 'DOCUMENT UPLOADED', 'APPROVED', and 'REJECTED' options
            return allStatuses.filter(status => status.value !== 'INITIATED');

        default:
            // Return all statuses if no match is found (can be adjusted as needed)
            return allStatuses;
    }
};

export function capitalizeFirstLetter(str: string) {
    if (!str) return ''; // Handle cases where the string might be undefined or null
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
