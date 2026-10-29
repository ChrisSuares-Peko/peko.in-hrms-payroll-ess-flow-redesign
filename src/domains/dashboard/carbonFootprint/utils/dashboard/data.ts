import buyCreditIcon from '@domains/dashboard/carbonFootprint/assets/icons/buyCarbon.svg';
import reportIcon from '@domains/dashboard/carbonFootprint/assets/icons/reportIcon.svg';
import shareImpactIcon from '@domains/dashboard/carbonFootprint/assets/icons/shareImpactIcon.svg';
import SupportIcon from '@domains/dashboard/carbonFootprint/assets/icons/support.svg';
import transactionIcon from '@domains/dashboard/carbonFootprint/assets/icons/transactionIcon.svg';
import whyActIcon from '@domains/dashboard/carbonFootprint/assets/icons/whyActIcon.svg';
import { paths } from '@src/routes/paths';

export const data = [
    {
        title: 'Impact Report',
        icon: reportIcon,
        path: paths.zeroCarbon.impactReport,
    },
    {
        title: 'Share Your Impact',
        icon: shareImpactIcon,
        path: paths.zeroCarbon.shareImpact,
    },
    {
        title: 'Why Act?',
        icon: whyActIcon,
        path: paths.zeroCarbon.whyAct,
    },
    {
        title: 'Transactions',
        icon: transactionIcon,
        path: paths.zeroCarbon.transactions,
    },
    {
        title: 'Buy Credits',
        icon: buyCreditIcon,
        path: paths.zeroCarbon.buyCredits,
    },
    {
        title: 'Support',
        icon: SupportIcon,
        path: paths.dashboard.needHelp,
    },
];
