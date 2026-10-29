import Feature1 from '@domains/dashboard/eSign/assets/feature1.svg';
import Feature2 from '@domains/dashboard/eSign/assets/feature2.svg';
import Feature3 from '@domains/dashboard/eSign/assets/feature3.svg';
import feature4 from '@domains/dashboard/eSign/assets/feature4.svg';
import eSignStatus from '@src/domains/dashboard/eSign/assets/eSignStatus.svg';
import settings from '@src/domains/dashboard/eSign/assets/settings.svg';
import signADocument from '@src/domains/dashboard/eSign/assets/signADocument.svg';
import { paths } from '@src/routes/paths';

import Instruction1 from '../assets/Instruction1.svg';
import Instruction2 from '../assets/Instruction2.svg';
import Instruction3 from '../assets/Instruction3.svg';
import Instruction4 from '../assets/Instruction4.svg';
import Instruction5 from '../assets/Instruction5.svg';

export const features = [
    {
        icon: Feature1,
        title: 'Convenience',
        description: 'Conveniently sign documents and complete contracts from any location.',
    },
    {
        icon: Feature2,
        title: 'Personalize your signing',
        description:
            'Personalize your signing by choosing to use a typed signature, a saved signature image, or by drawing it.',
    },
    {
        icon: Feature3,
        title: 'Fast',
        description: 'Receive completed and signed PDF documents instantly.',
    },
    {
        icon: feature4,
        title: 'Easy Interface',
        description: 'Efficiently sign your documents with seamless interface.',
    },
];

export const signer_positionOptions = [
    {
        label: 'Top Left',
        value: 'top-left',
    },
    {
        label: 'Top Mid Left',
        value: 'top-mid-left',
    },
    {
        label: 'Top Mid Right',
        value: 'top-mid-right',
    },
    {
        label: 'Top Right',
        value: 'top-right',
    },
    {
        label: 'Bottom Left',
        value: 'bottom-left',
    },
    {
        label: 'Bottom Mid Left',
        value: 'bottom-mid-left',
    },
    {
        label: 'Bottom Mid Right',
        value: 'bottom-mid-right',
    },
    {
        label: 'Bottom Right',
        value: 'bottom-right',
    },
];

export const eSignSteps = [
    {
        icon: Instruction1,
        text: 'Drag and drop your document into the designated area on the left side of the page. Then click Next.',
    },
    {
        icon: Instruction2,
        text: 'Enter recipient information on the next page.',
    },
    {
        icon: Instruction3,
        text: `Click Send to dispatch the document.`,
    },
    {
        icon: Instruction4,
        text: 'Recipients will receive the document via email and add their signatures.',
    },
    {
        icon: Instruction5,
        text: 'Download the signed document from the eSign Status page.',
    },
];

export const featureRow = [
    {
        image: signADocument,
        title: 'Sign a Document',
        link: paths.eSign.uploadPage,
        accessLimit: true,
    },
    {
        image: eSignStatus,
        title: 'eSign Status',
        link: paths.eSign.historyPage,
        accessLimit: false,
    },
    {
        image: settings,
        title: 'Settings',
        link: paths.eSign.settings,
        accessLimit: false,
    },
];

export const getFutureDate = (days: number) => {
    const today = new Date();
    today.setDate(today.getDate() + days); // Add 90 days to the date
    const formattedDate = today.toISOString().slice(0, 10); // Format as YYYY-MM-DD
    return formattedDate;
};
