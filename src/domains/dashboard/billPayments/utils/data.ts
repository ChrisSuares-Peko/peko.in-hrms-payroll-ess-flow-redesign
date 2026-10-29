import { BBPSCategoryName } from '@customtypes/general';
import BroadbandNew from '@src/domains/dashboard/billPayments/assets/iconsNew/Broadband.svg';
import CreditCardNew from '@src/domains/dashboard/billPayments/assets/iconsNew/Credit Card Payment.svg';
import DthNew from '@src/domains/dashboard/billPayments/assets/iconsNew/DTH.svg';
import ElectricityNew from '@src/domains/dashboard/billPayments/assets/iconsNew/Electricity Bill.svg';
import FastagNew from '@src/domains/dashboard/billPayments/assets/iconsNew/FastTag.svg';
import LandlineNew from '@src/domains/dashboard/billPayments/assets/iconsNew/Landline Bill.svg';
import LpgNew from '@src/domains/dashboard/billPayments/assets/iconsNew/LPG.svg';
import PipedGasNew from '@src/domains/dashboard/billPayments/assets/iconsNew/Pipedgas.svg';
import PrepaidMeterNew from '@src/domains/dashboard/billPayments/assets/iconsNew/Prepaid Meter.svg';
import TrafficChallanNew from '@src/domains/dashboard/billPayments/assets/iconsNew/Traffic Challan.svg';
import WaterNew from '@src/domains/dashboard/billPayments/assets/iconsNew/water.svg';
import bike from '@src/domains/dashboard/billPayments/assets/svg/bike.svg';
import cableIcon from '@src/domains/dashboard/billPayments/assets/svg/cable.svg';
import car from '@src/domains/dashboard/billPayments/assets/svg/car.svg';
import clubsIcon from '@src/domains/dashboard/billPayments/assets/svg/clubs.svg';
import deposite from '@src/domains/dashboard/billPayments/assets/svg/deposite.svg';
import donation from '@src/domains/dashboard/billPayments/assets/svg/donation.svg';
import Education from '@src/domains/dashboard/billPayments/assets/svg/Education.svg';
import health from '@src/domains/dashboard/billPayments/assets/svg/health.svg';
import hospitalIcon from '@src/domains/dashboard/billPayments/assets/svg/hospital.svg';
import life from '@src/domains/dashboard/billPayments/assets/svg/life.svg';
import loan from '@src/domains/dashboard/billPayments/assets/svg/loan.svg';
import services from '@src/domains/dashboard/billPayments/assets/svg/munService.svg';
import taxes from '@src/domains/dashboard/billPayments/assets/svg/munTax.svg';
import ncmcIcon from '@src/domains/dashboard/billPayments/assets/svg/ncmc.svg';
import npsIcon from '@src/domains/dashboard/billPayments/assets/svg/nps.svg';
import rentalIcon from '@src/domains/dashboard/billPayments/assets/svg/rental.svg';
import society from '@src/domains/dashboard/billPayments/assets/svg/society.svg';
import subscriptionIcon from '@src/domains/dashboard/billPayments/assets/svg/subscription.svg';
import PostpaidNew from '@src/domains/dashboard/telecomPayments/assets/iconsNew/Postpaid.svg';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';

const {
    broadband,
    education,
    electricity,
    landline,
    lpg,
    pipedGas,
    postpaid,
    water,
    creditCard,
    cable,
    dth,
    fastag,
    bikeInsurance,
    carInsurance,
    clubs,
    donations,
    Insurance,
    hospital,
    housingSociety,
    lifeInsurance,
    loanRepayment,
    municipalServices,
    municipalTaxes,
    ncmc,
    nps,
    prepaidMeter,
    recurringDeposite,
    rental,
    subscription,
    challan,
    test,
} = BBPSCategoryName;
export const billPayments = [
    {
        icon: ElectricityNew,
        title: 'Electricity Bill',
        url: paths.billPayments.electricity,
        accessKey: accessKeys.electricity,
        apiUrl: 'electricity',
        BBPSCategoryName: electricity,
    },
    {
        icon: LpgNew,
        title: 'LPG Cylinder',
        url: paths.billPayments.lpg,
        accessKey: accessKeys.lpg,
        apiUrl: 'lpg',
        BBPSCategoryName: lpg,
    },
    {
        icon: PipedGasNew,
        title: 'Piped Gas',
        url: paths.billPayments.pipedGas,
        accessKey: accessKeys.pipedGas,
        apiUrl: 'piped-gas',
        BBPSCategoryName: pipedGas,
    },
    {
        icon: BroadbandNew,
        title: 'Broadband Bill',
        url: paths.billPayments.broadband,
        accessKey: accessKeys.broadband,
        apiUrl: 'broadband',
        BBPSCategoryName: broadband,
    },

    {
        icon: WaterNew,
        title: 'Water Bill',
        url: paths.billPayments.water,
        accessKey: accessKeys.water,
        apiUrl: 'water',
        BBPSCategoryName: water,
    },
    {
        icon: cableIcon,
        title: 'Cable Recharge',
        url: paths.billPayments.cable,
        accessKey: accessKeys.cable,
        apiUrl: 'cable',
        BBPSCategoryName: cable,
    },
    {
        icon: DthNew,
        title: 'DTH Recharge',
        url: paths.billPayments.dth,
        accessKey: accessKeys.dth,
        apiUrl: 'dth',
        BBPSCategoryName: dth,
    },
    {
        icon: FastagNew,
        title: 'FASTag Recharge',
        url: paths.billPayments.fastag,
        accessKey: accessKeys.fastag,
        apiUrl: 'fastag',
        BBPSCategoryName: fastag,
    },
    {
        icon: TrafficChallanNew,
        title: 'Traffic Challan',
        url: paths.billPayments.challan,
        accessKey: accessKeys.challan,
        apiUrl: 'challan',
        BBPSCategoryName: challan,
    },
    {
        icon: LandlineNew,
        title: 'Landline Bill',
        url: paths.billPayments.landline,
        accessKey: accessKeys.landline,
        apiUrl: 'landline',
        BBPSCategoryName: landline,
    },
    {
        icon: LandlineNew,
        title: 'Test',
        url: paths.telecomPayments.test,
        accessKey: accessKeys.test,
        apiUrl: 'test',
        BBPSCategoryName: test,
    },
    {
        icon: health,
        title: 'Insurance',
        url: paths.billPayments.Insurance,
        accessKey: accessKeys.Insurance,
        apiUrl: 'insurance',
        BBPSCategoryName: Insurance,
    },
    {
        icon: Education,
        title: 'Education Fee',
        url: paths.billPayments.education,
        accessKey: accessKeys.education,
        apiUrl: 'education',
        BBPSCategoryName: education,
    },
    {
        icon: clubsIcon,
        title: 'Clubs & Associations',
        url: paths.billPayments.clubs,
        accessKey: accessKeys.clubs,
        apiUrl: 'clubs',
        BBPSCategoryName: clubs,
    },
    {
        icon: hospitalIcon,
        title: 'Hospital & Pathology',
        url: paths.billPayments.hospital,
        accessKey: accessKeys.hospitals,
        apiUrl: 'hospital',
        BBPSCategoryName: hospital,
    },
    {
        icon: society,
        title: 'Housing Society',
        url: paths.billPayments.housingSociety,
        accessKey: accessKeys.housingSociety,
        apiUrl: 'housing-society',
        BBPSCategoryName: housingSociety,
    },
    {
        icon: subscriptionIcon,
        title: 'Subscription',
        url: paths.billPayments.subscription,
        accessKey: accessKeys.bbps_subscriptions,
        apiUrl: 'subscription',
        BBPSCategoryName: subscription,
    },
    {
        icon: ncmcIcon,
        title: 'NCMC',
        url: paths.billPayments.ncmc,
        accessKey: accessKeys.ncmc,
        apiUrl: 'ncmc',
        BBPSCategoryName: ncmc,
    },
    {
        icon: npsIcon,
        title: 'NPS',
        url: paths.billPayments.nps,
        accessKey: accessKeys.nps,
        apiUrl: 'nps',
        BBPSCategoryName: nps,
    },
    {
        icon: PrepaidMeterNew,
        title: 'Prepaid Meter',
        url: paths.billPayments.prepaidMeter,
        accessKey: accessKeys.prepaidMeter,
        apiUrl: 'prepaid-meter',
        BBPSCategoryName: prepaidMeter,
    },
    {
        icon: CreditCardNew,
        title: 'Credit Card Payment',
        url: paths.billPayments.creditCard,
        accessKey: accessKeys.creditCard,
        apiUrl: 'credit-card',
        BBPSCategoryName: creditCard,
    },
    {
        icon: loan,
        title: 'Loan Repayment',
        url: paths.billPayments.loanRepayment,
        accessKey: accessKeys.loanRepayment,
        apiUrl: 'loan-repayment',
        BBPSCategoryName: loanRepayment,
    },
    {
        icon: taxes,
        title: 'Municipal Taxes',
        url: paths.billPayments.municipalTaxes,
        accessKey: accessKeys.municipalTaxes,
        apiUrl: 'municipal-taxes',
        BBPSCategoryName: municipalTaxes,
    },
    {
        icon: services,
        title: 'Municipal Services',
        url: paths.billPayments.municipalServices,
        accessKey: accessKeys.municipalServices,
        apiUrl: 'municipal-services',
        BBPSCategoryName: municipalServices,
    },
    {
        icon: deposite,
        title: 'Recurring Deposite',
        url: paths.billPayments.recurringDeposite,
        accessKey: accessKeys.recurringDeposite,
        apiUrl: 'deposite',
        BBPSCategoryName: recurringDeposite,
    },
    {
        icon: rentalIcon,
        title: 'Rental',
        url: paths.billPayments.rental,
        accessKey: accessKeys.rental,
        apiUrl: 'rental',
        BBPSCategoryName: rental,
    },
    {
        icon: donation,
        title: 'Donations',
        url: paths.billPayments.donations,
        accessKey: accessKeys.donation,
        apiUrl: 'donation',
        BBPSCategoryName: donations,
    },
    {
        icon: life,
        title: 'Life Insurance',
        url: paths.billPayments.lifeInsurance,
        accessKey: accessKeys.lifeInsurance,
        apiUrl: 'life',
        BBPSCategoryName: lifeInsurance,
    },
    {
        icon: bike,
        title: 'Bike Insurance',
        url: paths.billPayments.bikeInsurance,
        accessKey: accessKeys.bikeInsurance,
        apiUrl: 'bike',
        BBPSCategoryName: bikeInsurance,
    },
    {
        icon: car,
        title: 'Car Insurance',
        url: paths.billPayments.carInsurance,
        accessKey: accessKeys.carInsurance,
        apiUrl: 'car',
        BBPSCategoryName: carInsurance,
    },
];

export const telecomServices = [
    {
        icon: PostpaidNew,
        title: 'Mobile Postpaid',
        url: paths.telecomPayments.postpaid,
        accessKey: accessKeys.postpaid,
        apiUrl: 'postpaid',
        BBPSCategoryName: postpaid,
    },
];

export const tableData: any[] = [
    {
        id: '1',
        name: 'John Doe',
        accountNo: '1234567890',
        isActive: true,
        serviceType: 'GSM',
    },
    {
        id: '2',
        name: 'Jane Smith',
        accountNo: '9876543210',
        isActive: false,
        serviceType: 'DEL',
    },
    {
        id: '3',
        name: 'Michael Johnson',
        accountNo: '4567891230',
        isActive: true,
        serviceType: 'BROADBAND',
    },
    {
        id: '4',
        name: 'Emily Davis',
        accountNo: '7891234560',
        isActive: false,
        serviceType: 'ELIFE',
    },
];

export const bulkBalanceDataArray = [
    {
        data: {
            id: 1,
            name: 'John Doe',
            accountNo: '1234567890',
            optional1: 'Etisalat Package A',
        },
        billAmount: 200,
        status: true,
        message: '',
    },
    {
        data: {
            id: 2,
            name: 'Jane Smith',
            accountNo: '0987654321',
            optional1: 'Etisalat Package B',
        },
        billAmount: 500,
        status: true,
        message: '',
    },
    {
        data: {
            id: 3,
            name: 'Bob Johnson',
            accountNo: '1122334455',
            optional1: '',
        },
        billAmount: 150,
        status: true,
        message: '',
    },
];

export const limitData = {
    accessKey: 'etisalat_bill',
    minDenomination: 50,
    maxDenomination: 1000,
};

export const mockComplaintData = [
    {
        id: '1',
        createdAt: new Date().toISOString(),
        complaintId: 'CMP-1001',
        txnID: 'TXN-987654',
        offersText: '10% Cashback on Recharge',
        mobileNumber: '9876543210',
        complaintType: 'Transaction Failure',
        description: 'Payment deducted but transaction failed.',
        status: 'PENDING',
    },
    {
        id: '2',
        createdAt: new Date().toISOString(),
        complaintId: 'CMP-1002',
        txnID: 'TXN-123456',
        offersText: '20% Discount on Bill Payment',
        mobileNumber: '9123456789',
        complaintType: 'Incorrect Billing',
        description: 'Wrong bill amount charged on my account.',
        status: 'PAID',
    },
    {
        id: '3',
        createdAt: new Date().toISOString(),
        complaintId: 'CMP-1003',
        txnID: 'TXN-654321',
        offersText: 'No offer applied',
        mobileNumber: '9871234560',
        complaintType: 'Offer Not Applied',
        description: 'Promotional offer not applied on my transaction.',
        status: 'EXPIRED',
    },
    {
        id: '4',
        createdAt: new Date().toISOString(),
        complaintId: 'CMP-1004',
        txnID: 'TXN-777888',
        offersText: '5% Cashback on DTH Recharge',
        mobileNumber: '9988776655',
        complaintType: 'Refund Not Received',
        description: 'Refund was promised but not received yet.',
        status: 'PENDING',
    },
    {
        id: '5',
        createdAt: new Date().toISOString(),
        complaintId: 'CMP-1005',
        txnID: 'TXN-555666',
        offersText: '15% Discount on Mobile Recharge & Bills',
        mobileNumber: '9001122334',
        complaintType: 'Slow Transaction Processing',
        description: 'Transaction took too long to process.',
        status: 'PAID',
    },
];

/**
 * Returns true when a BBPS customer-param name represents the consumer's mobile / contact number.
 *
 * Used by the LPG Gas flow to identify which input must be pinned to the Peko account holder's
 * registered mobile number (pre-filled, non-editable). LPG billers name this field inconsistently —
 * "Registered Contact Number" (BPCL), "Mobile Number" (HPCL/IOCL), "LPG_ID or Contact Number"
 * (BPCL Commercial) — so we match by substring rather than equality.
 */
export const isMobileLikeParam = (paramName: string): boolean => {
    if (!paramName) return false;
    const lower = paramName.toLowerCase();
    return (
        lower === 'registered contact number' ||
        lower.includes('contact number') ||
        lower.includes('mobile number')
    );
};
