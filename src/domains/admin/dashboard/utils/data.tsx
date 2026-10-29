import MoneyBackIcon from '@assets/icons/MoneyBack.svg';
import { serviceCategoryNames } from '@utils/accessKeys';

import ActiveUser from '../assets/icon/Active Users .svg';
import GMV from '../assets/icon/GMV.svg';
import RegisteredUser from '../assets/icon/Registered Users.svg';
import ServiceProvider from '../assets/icon/Service Providers.svg';
import Transaction from '../assets/icon/Transactions.svg';

export const dashData = [
    {
        bgColor: 'bg-bgIconCard',
        icon: Transaction,
        title: 'Transactions',
        amount: '5231',
    },
    {
        bgColor: 'bg-bgIconCard',
        icon: GMV,
        title: 'GMV',
        amount: '3530752 AED',
    },
    {
        bgColor: 'bg-bgIconCard',
        icon: MoneyBackIcon,
        title: 'Cashback Earned',
        amount: '67806 AED',
    },
    {
        bgColor: 'bg-bgIconCard',
        icon: RegisteredUser,
        title: 'Registered Users',
        amount: '256',
    },
    {
        bgColor: 'bg-bgIconCard',
        icon: ServiceProvider,
        title: 'Service Providers',
        amount: '30',
    },
    {
        bgColor: 'bg-bgIconCard',
        icon: ActiveUser,
        title: 'Active Users',
        amount: '31',
    },
];

export const todaysData = [
    {
        bgColor: 'bg-bgIconCard',
        icon: Transaction,
        title: 'Transactions ',
        value: '0',
    },
    {
        bgColor: 'bg-bgIconCard',
        icon: GMV,
        title: 'GMV',
        value: '0 AED',
    },
    {
        bgColor: 'bg-bgIconCard',
        icon: MoneyBackIcon,
        title: 'Cashback Earned',
        value: '0 AED',
    },
    {
        bgColor: 'bg-bgIconCard',
        icon: RegisteredUser,
        title: 'Registered Users',
        value: '0',
    },
];

export const chartData = [
    {
        name: 'Mobile Payments',
        amount: 2400,
    },
    {
        name: serviceCategoryNames.utility,
        amount: 2210,
    },
    {
        name: 'Air Tickets',
        amount: 2290,
    },
    {
        name: 'Gift Cards',
        amount: 2000,
    },
    {
        name: 'Logistics',
        amount: 2181,
    },
    {
        name: 'Subscriptions',
        amount: 2500,
    },
    {
        name: 'Zero Carbon',
        amount: 2100,
    },
];
