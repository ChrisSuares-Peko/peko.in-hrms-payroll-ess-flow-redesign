import assetsLock from '@domains/dashboard/PekoCloud/assets/icons/assetsLock.svg';
import devices from '@domains/dashboard/PekoCloud/assets/icons/devices.svg';
import documentRed from '@domains/dashboard/PekoCloud/assets/icons/document-red.svg';
import documents from '@domains/dashboard/PekoCloud/assets/icons/documents.svg';
import dollarRound from '@domains/dashboard/PekoCloud/assets/icons/dollar-round.svg';
import fleetBus from '@domains/dashboard/PekoCloud/assets/icons/fleet-bus.svg';
import laptop from '@domains/dashboard/PekoCloud/assets/icons/laptop-red.svg';
import ReminderAssets from '@domains/dashboard/PekoCloud/assets/icons/reminders/Assets.svg';
import ReminderCompanyDoc from '@domains/dashboard/PekoCloud/assets/icons/reminders/Company_Doc.svg';
import ReminderFinancial from '@domains/dashboard/PekoCloud/assets/icons/reminders/Financial.svg';
import ReminderFleet from '@domains/dashboard/PekoCloud/assets/icons/reminders/Fleet.svg';
import ReminderOwnersDoc from '@domains/dashboard/PekoCloud/assets/icons/reminders/Owners_Doc.svg';
import subscriptions from '@domains/dashboard/PekoCloud/assets/icons/subscriptions.svg';
import userChecked from '@domains/dashboard/PekoCloud/assets/icons/user-checked.svg';
import userGroup from '@domains/dashboard/PekoCloud/assets/icons/user-group.svg';
import wallet from '@domains/dashboard/PekoCloud/assets/icons/wallet.svg';
import AE_logo from '@domains/dashboard/PekoCloud/assets/images/AE_logo.png';
import assetManagement from '@domains/dashboard/PekoCloud/assets/images/assetManagement.png';
import docStorage from '@domains/dashboard/PekoCloud/assets/images/docStorage.png';
import EID_logo from '@domains/dashboard/PekoCloud/assets/images/EID_logo.png';
import fleetManagement from '@domains/dashboard/PekoCloud/assets/images/fleetManagement.png';
import pekoAsset from '@domains/dashboard/PekoCloud/assets/images/pekoAsset.png';
import documentIcon from '@domains/dashboard/PekoCloud/assets/images/pekoDoc.png';
import pekoFleet from '@domains/dashboard/PekoCloud/assets/images/pekoFleet.png';
import pekoSub from '@domains/dashboard/PekoCloud/assets/images/pekoSub.png';
import subManagement from '@domains/dashboard/PekoCloud/assets/images/subManagement.png';
import { paths } from '@src/routes/paths';

export const dashboardData = [
    {
        title: 'Total Documents',
        value: '25',
        isCurrency: false,
        icon: documents,
        bgColor: 'bg-[#F3FFEF]',
    },
    {
        title: 'Total Subscriptions',
        value: '12',
        isCurrency: false,
        icon: subscriptions,
        bgColor: 'bg-[#FFF6F2]',
    },
    {
        title: 'Total Subscription Spent',
        value: '42000',
        isCurrency: true,
        icon: wallet,
        bgColor: 'bg-[#FFF0FC]',
    },
    {
        title: 'Total Assets',
        value: '88',
        isCurrency: false,
        icon: assetsLock,
        bgColor: 'bg-[#FFF0FC]',
    },
];

export const ReminderData = [
    {
        title: 'Kashifs Emirates ID renewal',
        value: '250',
        icon: AE_logo,
        subLabel: 'Valid until 15 March 2025',
    },
    {
        title: 'Kashifs Emirates ID renewal',
        value: '250',
        icon: EID_logo,
        subLabel: 'Valid until 15 March 2025',
    },
    {
        title: 'Kashifs Emirates ID renewal',
        value: '250',
        icon: AE_logo,
        subLabel: 'Valid until 15 March 2025',
    },
    {
        title: 'Kashifs Emirates ID renewal',
        value: '250',
        icon: EID_logo,
        subLabel: 'Valid until 15 March 2025',
    },
    {
        title: 'Kashifs Emirates ID renewal',
        value: '250',
        icon: EID_logo,
        subLabel: 'Valid until 15 March 2025',
    },
];

export const ReminderDataList = [ReminderData, ReminderData, ReminderData];

export const activities = [
    {
        image: 'https://static.vecteezy.com/system/resources/previews/014/018/579/original/ms-365-logo-on-transparent-background-free-vector.jpg',
        label: 'Your Microsoft 365 subscription is due for renewal on',
        date: ' July 24, 2025.',
    },
    {
        image: 'https://static.vecteezy.com/system/resources/previews/014/018/579/original/ms-365-logo-on-transparent-background-free-vector.jpg',
        label: 'Your Microsoft 365 subscription is due for renewal on',
        date: ' July 24, 2025.',
    },
    {
        image: 'https://static.vecteezy.com/system/resources/previews/014/018/579/original/ms-365-logo-on-transparent-background-free-vector.jpg',
        label: 'Your Microsoft 365 subscription is due for renewal on',
        date: ' July 24, 2025.',
    },
    {
        image: 'https://static.vecteezy.com/system/resources/previews/014/018/579/original/ms-365-logo-on-transparent-background-free-vector.jpg',
        label: 'Your Microsoft 365 subscription is due for renewal on',
        date: ' July 24, 2025.',
    },
    {
        image: 'https://static.vecteezy.com/system/resources/previews/014/018/579/original/ms-365-logo-on-transparent-background-free-vector.jpg',
        label: 'Your Microsoft 365 subscription is due for renewal on',
        date: ' July 24, 2025.',
    },
];

export const navMenuDetails = [
    {
        icon: documentRed,
        title: 'Company Documents',
        isActive: true,
        link: `/${paths.pekoCloud.index}/${paths.pekoCloud.companyDocuments}`,
    },

    {
        icon: userChecked,
        title: 'Ownership Documents',
        isActive: true,
        link: `/${paths.pekoCloud.index}/${paths.pekoCloud.ownershipDocuments}`,
    },
    {
        icon: dollarRound,
        title: 'Financials',
        isActive: true,
        link: `/${paths.pekoCloud.index}/${paths.pekoCloud.financials}`,
    },
    {
        icon: userGroup,
        title: 'Employee Details ',
        isActive: true,
        link: `/${paths.pekoCloud.index}/${paths.pekoCloud.employeeDetails}`,
    },
    {
        icon: devices,
        title: 'Subscriptions',
        isActive: true,
        link: `/${paths.pekoCloud.index}/${paths.pekoCloud.subscriptions}`,
    },
    {
        icon: laptop,
        title: 'Assets',
        isActive: true,
        link: `/${paths.pekoCloud.index}/${paths.pekoCloud.assets}`,
    },
    {
        icon: fleetBus,
        title: 'Fleet Management',
        isActive: true,
        link: `/${paths.pekoCloud.index}/${paths.pekoCloud.fleet}`,
    },
];

export const UpcomingActivityData = [
    {
        title: 'New Employee Joined',
        description:
            'Responsible for driving revenue growth by identifying and pursuing new business opportunities, a',
        date: '20-10-2023',
    },
    {
        title: 'New Employee Joined',
        description:
            'Responsible for driving revenue growth by identifying and pursuing new business opportunities, a',
        date: '20-10-2023',
    },
    {
        title: 'New Employee Joined',
        description:
            'Responsible for driving revenue growth by identifying and pursuing new business opportunities, a',
        date: '20-10-2023',
    },
];

export const featureData = [
    {
        icon: documentIcon,
        iconMob: docStorage,
        title: 'Document Storage',
        description:
            'Safely upload and organize company registration, ownership, and legal documents.',
    },
    {
        icon: pekoSub,
        iconMob: subManagement,
        title: 'Subscription Management',
        description:
            'Manage all software subscriptions in one place, helping you track renewals, usage, and costs.',
    },
    {
        icon: pekoAsset,
        iconMob: assetManagement,
        title: 'Asset Management',
        description: 'Keep track of all company assets, in a structured, searchable format.',
    },
    {
        icon: pekoFleet,
        iconMob: fleetManagement,
        title: 'Fleet Management',
        description:
            'Store and access all fleet details—vehicle registrations, maintenance schedules, and more.',
    },
];
export const serviceDetails =
    'Our platform centralizes all critical company information in one secure, easy-to-access location. Store and manage essential documents, including company registration and ownership records, with ease. Track assets efficiently, keeping up-to-date records of equipment, properties, and more. Organize software subscriptions to monitor renewals and costs, ensuring no details slip through the cracks. Additionally, maintain a comprehensive view of your fleet, with information on vehicle registrations, maintenance, and schedules. Say goodbye to scattered files and manual tracking; our platform streamlines your operations, saving time and providing a single source of truth for all your business’s vital data.';
export const subDescription =
    'Access every essential detail in one secure, centralized platform, and stay organized as your company grows.';

export const fetchDocIcon = (type: string) => {
    if (type === 'ASSETS_DOCS') {
        return ReminderAssets;
    }
    if (type === 'FLEETS_DOCS') {
        return ReminderFleet;
    }
    if (type === 'CHEQUE_LEAVES' || type === 'FINANCE_DOCS') {
        return ReminderFinancial;
    }
    if (type === 'OWNERS_DOCS') {
        return ReminderOwnersDoc;
    }
    if (type === 'COMPANY_DOCS') {
        return ReminderCompanyDoc;
    }
    return ReminderCompanyDoc;
};
