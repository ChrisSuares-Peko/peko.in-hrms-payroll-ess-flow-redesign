import img1 from '@domains/dashboard/works/assets/images/img1.jpg';
import img2 from '@domains/dashboard/works/assets/images/img2.jpg';
import img3 from '@domains/dashboard/works/assets/images/img3.jpeg';
import img4 from '@domains/dashboard/works/assets/images/img4.jpeg';
import bussiness from '@domains/dashboard/works/assets/svg/bussiness.svg';
import computer2 from '@domains/dashboard/works/assets/svg/computer-2.svg';
import computer from '@domains/dashboard/works/assets/svg/computer.svg';
import digital from '@domains/dashboard/works/assets/svg/digital.svg';
import music from '@domains/dashboard/works/assets/svg/music.svg';
import playVideo from '@domains/dashboard/works/assets/svg/playVideo.svg';

import { WorkDetail, workData } from '../type';

export const worksData: workData[] = [
    {
        id: 1,
        workTitle: 'Graphics & Design',
        workImg: computer,
        workDescription: 'Logo Design, Branding, Poster etc',
    },
    {
        id: 2,
        workTitle: 'Web & App Design',
        workImg: computer2,
        workDescription: 'Website Design, App Design, UX Design etc',
    },
    {
        id: 3,
        workTitle: 'Digital Marketing',
        workImg: digital,
        workDescription: 'SEO, SEM, Social Media, Marketing etc',
    },
    {
        id: 4,
        workTitle: 'Video & Animation',
        workImg: playVideo,
        workDescription: 'Logo Design, Branding, Poster etc',
    },
    {
        id: 5,
        workTitle: 'Bussiness',
        workImg: bussiness,
        workDescription: 'Logo Design, Branding, Poster etc',
    },
    {
        id: 6,
        workTitle: 'Music & Audio',
        workImg: music,
        workDescription: 'Logo Design, Branding, Poster etc',
    },
    {
        id: 7,
        workTitle: 'Graphics & Design',
        workImg: computer,
        workDescription: 'Logo Design, Branding, Poster etc',
    },
    {
        id: 8,
        workTitle: 'Web & App Design',
        workImg: computer2,
        workDescription: 'Website Design, App Design, UX Design etc',
    },
];

export const workDetail: WorkDetail = {
    id: 1,
    workTitle: 'Graphics & Design',
    portfolioImages: [img1, img2, img3, img4, img1, img2],
    workDescription:
        'Impactful branding meets top-tier freelancers! Our platform is your gateway to a diverse community of skilled professionals ready to breathe life into your brand. Whether you re seeking a logo redesign, strategic guidance, or a comprehensive brand overhaul, our curated talent pool offers budget-friendly options and ensures on-time delivery.',
    plans: [
        {
            title: 'Starter',
            amount: 999,
            monthlyCost: '  One time payment ',
            features: [
                'Chat, call, meet up to 300 attendees',
                'Web and mobile versions of Office apps',
                '1 TB of cloud storage',
                'Business-class email',
                'Standard security',
                'Anytime phone and web support',
            ],
        },
        {
            title: 'Professional',
            amount: 2999,
            monthlyCost: '  One time payment ',
            features: [
                'Chat, call, meet up to 300 attendees',
                'Web and mobile versions of Office apps',
                '1 TB of cloud storage',
                'Business-class email',
                'Anytime phone and web support',
            ],
            offer: '30% Off',
        },
        {
            title: 'Enterprise',
            amount: 4999,
            monthlyCost: '  One time payment ',
            features: [
                'Chat, call, meet up to 300 attendees',
                'Web and mobile versions of Office apps',
                '1 TB of cloud storage',
                'Business-class email',
                'Standard security',
                'Anytime phone and web support',
                'Business-class email',
            ],
            offer: '30% Off',
        },
    ],
};

export const FirstPlanFeatures = [
    'Logo & Brand Identit',
    'Brand Style Guides',
    'Business Cards & Stationery',
    'Fonts & Typography',
];

export const SecondPlanFeatures = [
    'Logo & Brand identity',
    'Complete Brand Style Guides',
    'Marketing Design',
    'Print Design',
    'Illustration',
];

export const ThirdPlanFeatures = [
    'Logo & Brand identity',
    'Complete Brand Style Guides',
    'Marketing Design',
    'Print Design',
    '3D Design',
    'Fashion & Merchandise',
    'Miscellaneous',
    'Annual financial report',
];
