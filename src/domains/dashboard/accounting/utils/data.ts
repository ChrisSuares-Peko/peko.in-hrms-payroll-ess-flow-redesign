import { paths } from '@routes/paths';

import documentPen from '../assets/document-pen.svg';
import folderDocument from '../assets/folder-document.svg';
import pieChart from '../assets/pie-chart.svg';
import transactions from '../assets/transactions.svg';

export interface OnboardingStep {
    id: number;
    label: string;
}

export interface GetStartedBannerContent {
    title: string;
    description: string;
    actionLabel: string;
}

export interface FeatureCardItem {
    key: string;

    illustration: string;

    illustrationBg: string;
    title: string;
    description: string;

    status?: string;
    actionLabel: string;

    primaryAction?: boolean;

    path?: string;
}

export const onboardingSteps: OnboardingStep[] = [
    { id: 1, label: 'Upload Bank Statement' },
    { id: 2, label: 'Categorize Transactions' },
    { id: 3, label: 'View Financial Reports' },
];

export const getStartedBanner: GetStartedBannerContent = {
    title: 'Start by uploading your bank statement',
    description:
        'Import a CSV, Excel, or PDF to automatically populate your transactions and unlock reports.',
    actionLabel: 'Upload Now',
};

export const featureCards: FeatureCardItem[] = [
    {
        key: 'upload-bank-statement',
        illustration: folderDocument,
        illustrationBg: '#FDF6F0',
        title: 'Upload Bank Statement',
        description:
            'Import CSV, Excel, or PDF bank statements. Transactions are automatically extracted and ready to categorize.',
        actionLabel: 'Upload Statement',
        primaryAction: true,
    },
    {
        key: 'transactions',
        illustration: transactions,
        illustrationBg: '#F0F9FD',
        title: 'Transactions',
        description:
            'View, search, and categorize all your financial transactions. Tag expenses, reconcile entries, and keep books clean.',
        status: 'No transactions yet',
        actionLabel: 'View Transactions',
        path: `${paths.dashboard.accounting}/${paths.accounting.transactions}`,
    },
    {
        key: 'financial-statements',
        illustration: documentPen,
        illustrationBg: '#F1F0FD',
        title: 'Financial Statements',
        description:
            'Generate Profit & Loss, Balance Sheet, and Cash Flow reports. Export to PDF or share with your CA.',
        status: 'No transactions yet',
        actionLabel: 'View Reports',
        path: `${paths.dashboard.accounting}/${paths.accounting.financialStatements}`,
    },
    {
        key: 'insights',
        illustration: pieChart,
        illustrationBg: '#FDF0F0',
        title: 'Insights',
        description:
            'Analysis of your spending patterns, revenue trends, and business health. Updated monthly.',
        status: 'No transactions yet',
        actionLabel: 'View Insights',
        path: `${paths.dashboard.accounting}/${paths.accounting.insights}`,
    },
];
