import dayjs from 'dayjs';

import { capitalizeFirstLetter, getVehicleAge } from './vehicleDetailsHelpers';

const useVehicleData = (verifyRcResponse: any) => {
    const vehicleDetails = [
        { label: 'Vehicle No.', value: verifyRcResponse?.vehicleNumber },
        { label: 'Make & Model', value: verifyRcResponse?.model },
        { label: 'Class', value: verifyRcResponse.rawData?.class },
        { label: 'Body Type', value: capitalizeFirstLetter(verifyRcResponse?.rawData?.body_type) },
        { label: 'Fuel Type', value: capitalizeFirstLetter(verifyRcResponse?.fuelType) },
        { label: 'Color', value: capitalizeFirstLetter(verifyRcResponse?.rawData?.vehicle_colour) },
    ];

    const registrationAndTaxDetails = [
        {
            label: 'Registration Date',
            value: dayjs(verifyRcResponse?.regDate).format('YYYY-MM-DD'),
        },
        {
            label: 'Expiry Date',
            value: dayjs(verifyRcResponse?.rawData?.rc_expiry_date).format('YYYY-MM-DD'),
        },
        // { label: 'Tax Validity', value: formattedDateTime(verifyRcResponse.regDate) },
        { label: 'Vehicle Age', value: getVehicleAge(verifyRcResponse?.regDate) },
        { label: 'Owner Count', value: verifyRcResponse?.rawData?.owner_count },
    ];

    const insuranceAndPucDetails = [
        { label: 'Insurance Company', value: verifyRcResponse?.insuranceCompany },
        { label: 'Policy Number', value: verifyRcResponse?.policyNumber },
        {
            label: 'Insurance Valid Upto',
            value: dayjs(verifyRcResponse.insuranceValidUpto).format('YYYY-MM-DD'),
        },
        { label: 'Upload Insurance Document', isUpload: true, docType: 'Insurance' },

        { label: 'PUC Number', value: verifyRcResponse.rawData.pucc_number },
        {
            label: 'PUC Valid Upto',
            value: dayjs(verifyRcResponse.pucValidUpto).format('YYYY-MM-DD'),
        },
        { label: 'Upload PUC Document', isUpload: true, docType: 'PUC' },
    ];

    const technicalDetails = [
        { label: 'Engine Number', value: verifyRcResponse.engineNumber },
        { label: 'Chassis Number', value: verifyRcResponse.chassisNumber },
        { label: 'Cylinders / CC', value: verifyRcResponse.rawData.vehicle_cylinders_no },
        { label: 'Unladen / Gross Weight', value: verifyRcResponse.rawData.unladen_weight },
        { label: 'Wheelbase', value: verifyRcResponse.rawData.wheelbase },
        { label: 'Seat / Sleeper Capacity', value: verifyRcResponse.rawData.vehicle_seat_capacity },
    ];

    const complianceLegalFlags = [
        { label: 'RC Status', value: verifyRcResponse?.rcStatus }, // text like ACTIVE
        {
            label: 'Blacklist Status',
            value: verifyRcResponse?.blacklistStatus ? 'Blacklisted' : 'Not Blacklisted',
        }, // convert true/false to Yes/No
        {
            label: 'Permit Valid Upto',
            value: verifyRcResponse?.rawData?.permit_valid_upto
                ? dayjs(verifyRcResponse.rawData.permit_valid_upto).format('YYYY-MM-DD')
                : 'N/A',
        },
        { label: 'Non-use Status', value: verifyRcResponse?.rawData?.non_use_status || 'N/A' },
    ];

    const ownerInfo = [
        { label: 'Owner Name', value: capitalizeFirstLetter(verifyRcResponse.ownerName) },
        {
            label: "Father's Name",
            value: capitalizeFirstLetter(verifyRcResponse.rawData.owner_father_name),
        },
        {
            label: 'Present Address',
            value: capitalizeFirstLetter(verifyRcResponse.presentAddress),
        },
    ];

    return {
        vehicleDetails,
        registrationAndTaxDetails,
        insuranceAndPucDetails,
        technicalDetails,
        complianceLegalFlags,
        ownerInfo,
    };
};

export default useVehicleData;
