import assetManagement from '@domains/dashboard/PekoCloud/assets/images/assetManagement.png';
import docStorage from '@domains/dashboard/PekoCloud/assets/images/docStorage.png';
import fleetManagement from '@domains/dashboard/PekoCloud/assets/images/fleetManagement.png';
import subManagement from '@domains/dashboard/PekoCloud/assets/images/subManagement.png';
import frame1 from '@domains/dashboard/turbo/assets/frame1.png';
import frame2 from '@domains/dashboard/turbo/assets/frame2.png';
import frame3 from '@domains/dashboard/turbo/assets/frame3.png';
import frame4 from '@domains/dashboard/turbo/assets/frame4.png';
import frame5 from '@domains/dashboard/turbo/assets/frame5.png';
import frame6 from '@domains/dashboard/turbo/assets/frame6.png';
import frame7 from '@domains/dashboard/turbo/assets/frame7.png';
import { paths } from '@src/routes/paths';

import dl from '../assets/icons/dl.svg';
import documentCenter from '../assets/icons/documentCenter.svg';
import driver from '../assets/icons/driver.svg';
import fastagRecharge from '../assets/icons/fastagRecharge.svg';
import fitness from '../assets/icons/fitness.svg';
import fleet from '../assets/icons/fleet.svg';
import insurance from '../assets/icons/insurance.svg';
import manageSubscription from '../assets/icons/manageSubscription.svg';
import pollution from '../assets/icons/pollution.svg';
import registration from '../assets/icons/registration.svg';
import trafficChallan from '../assets/icons/trafficChallan.svg';
import truck from '../assets/icons/truck.svg';
import vehicleReports from '../assets/icons/vehicleReports.svg';

export const dashboardCard = [
    {
        title: 'Total Documents',
        value: 'Fleet Summary',
        isPercentage: false,
        icon: fleet,
        bgColor: 'bg-[#FCF9FF]',
    },
    {
        title: 'Active Documents',
        value: 'Driver License Summary',
        isPercentage: false,
        icon: dl,
        bgColor: 'bg-[#F1FFF6]',
    },
];

export const iconcardData = [
    {
        title: 'Manage Fleet',
        value: '0',
        isPercentage: false,
        icon: truck,
        bgColor: 'bg-[#FFF6F2]',
        url: paths.turbo.manageFleet,
    },
    {
        title: 'Driver Profiles',
        value: '0',
        isPercentage: false,
        icon: driver,
        bgColor: 'bg-[#F9F4FF]',
        url: paths.turbo.driverProfiles,
    },
    {
        title: 'Document Center',
        value: '0',
        isPercentage: false,
        icon: documentCenter,
        bgColor: 'bg-[#F9F4FF]',
        url: paths.turbo.documentCentre,
    },
    {
        title: 'Recharge FASTag',
        value: '0',
        isPercentage: false,
        icon: fastagRecharge,
        bgColor: 'bg-[#F9F4FF]',
        url: `${paths.dashboard.billPayments}/${paths.billPayments.fastag}`,
    },
    {
        title: 'Traffic Challans',
        value: '0',
        isPercentage: false,
        icon: trafficChallan,
        bgColor: 'bg-[#FFF6F2]',
        url: `${paths.dashboard.turbo}/${paths.turbo.challans}`,
    },
    {
        title: 'Vehicle Reports',
        value: '0',
        isPercentage: false,
        icon: vehicleReports,
        bgColor: 'bg-[#FFF6F2]',
        // Absolute, like Traffic Challans — TurboIconCard navigates with the raw value.
        url: `${paths.dashboard.turbo}/${paths.turbo.vehicleReports}`,
    },
    {
        title: 'Manage Subscription',
        value: '0',
        isPercentage: false,
        icon: manageSubscription,
        bgColor: 'bg-[#F9F4FF]',
        url: paths.turbo.manageSubscription,
    },
];
export const renewalCardsData = [
    {
        icon: insurance, // Replace with your icon path
        title: 'Insurance',
        renewalDate: '02.01.2025',
        bgColor: 'bg-[#FCF9FF]', // light lavender
    },
    {
        icon: registration, // Replace with your icon path
        title: 'Registration',
        renewalDate: '02.10.2030',
        bgColor: 'bg-[#F1FFF6]', // light green
    },
    {
        icon: pollution, // Replace with your icon path
        title: 'Pollution',
        renewalDate: '02.10.2025',
        bgColor: 'bg-[#FFF8EB]', // light yellow
    },
    {
        icon: fitness, // Replace with your icon path
        title: 'Fitness Upto',
        renewalDate: '02.10.2025',
        bgColor: 'bg-[#F2F7FB]', // light blue
    },
];

export const dataSource = [
    {
        key: '1',
        vehicleNumber: 'MH12AB1234',
        makeModel: 'Hyundai i20',
        fuelType: 'Petrol',
        insuranceStatus: 'VALID',
        pucStatus: 'INVALID',
        driverName: 'Rahul Sharma',
    },
    {
        key: '2',
        vehicleNumber: 'DL01CD5678',
        makeModel: 'Maruti Swift',
        fuelType: 'Diesel',
        insuranceStatus: 'VALID',
        pucStatus: 'VALID',
        driverName: 'Sneha Verma',
    },
    {
        key: '3',
        vehicleNumber: 'KA03EF9012',
        makeModel: 'Tata Nexon',
        fuelType: 'Electric',
        insuranceStatus: 'INVALID',
        pucStatus: 'VALID',
        driverName: 'Amit Joshi',
    },
];

export const data = [
    {
        key: '1',
        date: '2025-04-01',
        actionType: 'Added Vehicle',
        description: 'A new vehicle was added to the fleet.',
        asset: 'Mahindra Bolero',
    },
    {
        key: '2',
        date: '2025-04-05',
        actionType: 'Assigned Driver',
        description: 'Driver Ramesh Kumar was assigned to Vehicle MH12AB1234.',
        asset: 'MH12AB1234',
    },
    {
        key: '3',
        date: '2025-04-10',
        actionType: 'Insurance Updated',
        description: 'Insurance details updated for Vehicle GJ01CD5678.',
        asset: '₹12,500',
    },
    {
        key: '4',
        date: '2025-04-15',
        actionType: 'PUC Renewed',
        description: 'PUC certificate renewed for Vehicle DL04EF7890.',
        asset: 'DL04EF7890',
    },
];

export const featureData = [
    {
        icon: frame1,
        iconMob: docStorage,
        title: 'Vehicle Verification',
        description: 'Instantly fetch verified RC details by registration number.',
    },
    {
        icon: frame2,
        iconMob: subManagement,
        title: 'Driver License Validation',
        description: 'Confirm driver license data with just the DL number.',
    },
    {
        icon: frame3,
        iconMob: assetManagement,
        title: 'FASTag Recharge',
        description: 'Recharge FASTag balances through verified bank providers.',
    },
    {
        icon: frame4,
        iconMob: fleetManagement,
        title: 'Compliance Tracking',
        description: 'Track expiry of RC, insurance, PUC, permits, and more.',
    },
    {
        icon: frame5,
        iconMob: fleetManagement,
        title: 'Fleet & Driver Management',
        description: 'Add, assign, and manage your entire fleet and drivers with ease.',
    },
    {
        icon: frame6,
        iconMob: fleetManagement,
        title: 'Document Center',
        description: 'Upload and manage vehicle-related docs like insurance, PUC, tax receipts.',
    },
    {
        icon: frame7,
        iconMob: fleetManagement,
        title: 'Downloadable Reports',
        description: 'Export full fleet or driver data in CSV format.',
    },
];

export const serviceDetails =
    'Instantly verify vehicle and driver details, manage documents, recharge FASTag, and stay compliant — all in one place.';

export const subDescription = '';
