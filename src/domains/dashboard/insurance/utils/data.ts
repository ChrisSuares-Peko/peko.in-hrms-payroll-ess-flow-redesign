import bikeLogo from '@src/domains/dashboard/insurance/assets/icons/bike.svg';
import carLogo from '@src/domains/dashboard/insurance/assets/icons/car.svg';
import healthLogo from '@src/domains/dashboard/insurance/assets/icons/health.svg';
import taxiLogo from '@src/domains/dashboard/insurance/assets/icons/taxi.svg';
import companyLogo from '@src/domains/dashboard/insurance/assets/images/companyLogo.png';

import {
    IconCardProps,
    insuranceType,
    personList,
    policyOptionsType,
    policyPeriodType,
    tabDetailsSectionType,
} from '../types/type';

export const InsuranceServices: IconCardProps[] = [
    {
        icon: healthLogo,
        title: 'Health Insurance',
        path: '/insurance/health',
    },
    {
        icon: carLogo,
        title: 'Car Insurance',
        path: '/insurance/car',
    },
    {
        icon: bikeLogo,
        title: 'Bike Insurance',
        path: '/insurance/bike',
    },
    {
        icon: taxiLogo,
        title: 'Taxi Insurance',
        path: '/insurance/taxi',
    },
];

export const personsList: personList[] = [
    {
        id: 1,
        personName: 'Self',
        isIncrease: false,
    },
    {
        id: 2,
        personName: 'Spouse',
        isIncrease: false,
    },
    {
        id: 3,
        personName: 'Son',
        isIncrease: true,
    },
    {
        id: 4,
        personName: 'Daughter',
        isIncrease: true,
    },
    {
        id: 5,
        personName: 'Mother',
        isIncrease: false,
    },
    {
        id: 6,
        personName: 'Father',
        isIncrease: false,
    },
    {
        id: 7,
        personName: 'Father-in-law',
        isIncrease: false,
    },
    {
        id: 8,
        personName: 'mother-in-law',
        isIncrease: false,
    },
];

export const claimRate = [
    {
        label: '90%-95%',
        count: 3,
    },
    {
        label: '80%-89%',
        count: 8,
    },
    {
        label: '70%-79%',
        count: 2,
    },
];

export const insuranceCompanies = [
    {
        label: 'ICICI Lombard',
    },
    {
        label: 'Bajaj Allianz',
    },
    {
        label: 'Bajaj Allianz',
    },
    {
        label: 'Tata AIG',
    },
    {
        label: 'Bajaj Allianz',
    },
    {
        label: 'Airvolta',
    },
];

export const insuranceList: insuranceType[] = [
    {
        id: 94935,
        logo: companyLogo,
        name: 'HDFC Ergo Optima Secure',
        claimRate: 90,
        cover: '5',
        cashlessHospitals: '20',
        benefits: [
            'Existing illnesses covered after 3 years',
            '•100% of approved claim is paid by insurer',
        ],
        price: 2000,
        period: 'year',
        emiStart: 400,
    },
    {
        id: 94935,
        logo: companyLogo,
        name: 'HDFC Ergo Optima Secure',
        claimRate: 70,
        cover: '5',
        cashlessHospitals: '20',
        benefits: [
            'Existing illnesses covered after 3 years',
            '•100% of approved claim is paid by insurer',
        ],
        price: 2000,
        period: 'year',
        emiStart: 400,
    },
    {
        id: 94935,
        logo: companyLogo,
        name: 'HDFC Ergo Optima Secure',
        claimRate: 95,
        cover: '5',
        cashlessHospitals: '20',
        benefits: [
            'Existing illnesses covered after 3 years',
            '•100% of approved claim is paid by insurer',
        ],
        price: 2000,
        period: 'year',
        emiStart: 400,
    },
    {
        id: 94935,
        logo: companyLogo,
        name: 'HDFC Ergo Optima Secure',
        claimRate: 95,
        cover: '5',
        cashlessHospitals: '20',
        benefits: [
            'Existing illnesses covered after 3 years',
            '•100% of approved claim is paid by insurer',
        ],
        price: 2000,
        period: 'year',
        emiStart: 400,
    },
    {
        id: 94935,
        logo: companyLogo,
        name: 'HDFC Ergo Optima Secure',
        claimRate: 95,
        cover: '5',
        cashlessHospitals: '20',
        benefits: [
            'Existing illnesses covered after 3 years',
            '•100% of approved claim is paid by insurer',
        ],
        price: 2000,
        period: 'year',
        emiStart: 400,
    },
];

export const policyPeriod: policyPeriodType[] = [
    {
        id: 1,
        duration: '1 Year',
        price: 7000,
    },
    {
        id: 2,
        duration: '2 Year',
        price: 50000,
        discount: 1000,
    },
    {
        id: 3,
        duration: '3 Year',
        price: 21000,
        discount: 10000,
    },
];

export const policyOptions: policyOptionsType[] = [
    { value: '10', price: '₹ 10 Lakh', duration: 'Premium - ₹70,000/Year' },
    { value: '20', price: '₹ 20 Lakh', duration: 'Premium - ₹80,000/Year' },
    { value: '30', price: '₹ 30 Lakh', duration: 'Premium - ₹90,000/Year' },
];

export const insuranceCoverage: tabDetailsSectionType[] = [
    {
        title: 'Bonus On Claim',
        description:
            'Irrespective of any claim status 100% increase in coverage after 2 years 2X coverage from Day 1 is provided instantly and 4X coverage after 2 years',
    },
    {
        title: 'Health Checkup',
        description:
            'Health check-up benefit post completion of every policy year irrespective of claim status up to Rs 2500',
    },
    {
        title: 'Share Claim Payments',
        description: ' Full claim paid by insurer',
    },

    {
        title: 'Bonus On Claim',
        description:
            'Irrespective of any claim status 100% increase in coverage after 2 years 2X coverage from Day 1 is provided instantly and 4X coverage after 2 years',
    },
];

export const insuranceNotCovered: tabDetailsSectionType[] = [
    {
        title: 'Maternity cover',
        description: 'Not available in this plan',
    },
    {
        title: 'Out patient consultation benefits',
        description: 'Not available in this plan',
    },
    {
        title: 'Discount on Renewal',
        description: 'Not available in this plan',
    },
];

export const hospitalData: tabDetailsSectionType[] = [
    {
        title: 'Chaithanya Eye Hospital And Research Institute',
        description: 'M.C. Road, Perumpaikkapu P.O. Adichira, Kottayam',
    },
    {
        title: 'Holy Ghost Mission Hospital',
        description: 'Muttuchira P.O, Kottayam',
    },
    {
        title: 'Chaithanya Eye Hospital And Research Institute',
        description: 'Azad Lane, Nr.Thirunakkara Temple',
    },
    {
        title: 'I H M Hospita',
        description: 'Sh-32 Bharananganam',
    },
];

export const claimProcessArray: tabDetailsSectionType[] = [
    {
        title: 'Find a cashless hospital',
        description: 'You can view the list of cashless hospitals here',
    },
    {
        title: 'Claim registration',
        description:
            'You can register the reimbursement or supplementary claim on the insurer website (link here). You can use the same link to download KYC /NEFT details & digital claim form link. You can also upload relevant claim related documents.',
    },

    {
        title: 'Discharge',
        description:
            'Hospital will share all the necessary documents with the insurer / TPA for approval. Insurer/ TPA will scrutinize all the received documents. You will receive an update through SMS/ Emails at every stage of the claim on your registered mobile number or E-mail id.',
    },
    {
        title: 'Claim settlement',
        description:
            'Hospital will send the final bill to the insurer for authorization, the insurer will scrutinize the shared documents and give authorization on the final bill amount in case of approved transactions. Any in-admissible expenses, copayments, deductions will have to be paid by you.',
    },
];

export const addOnsDrawerData = [
    {
        sectionTitle: 'Add-ons and Discounts',
        data: [
            {
                title: ' 24x7 Roadside Assistance',
                description:
                    'Get support in case of on-road breakdown such as tyre change, emergency fuel, battery jump start',
            },
            {
                title: ' Consumables',
                description:
                    'Get the cost of consumables replaced such as coolant, nuts & bolts during repair of the damage',
            },
        ],
    },
    {
        sectionTitle: 'Other Addons',
        data: [
            {
                title: ' Zero Dep',
                description:
                    'In case of theft or total damage, the full amount as per vehicle invoice will be paid instead of the declared value in policy (IDV).',
            },
            {
                title: 'Invoice Cover',
                description:
                    'Get full value of replaced parts (while base policy provides depreciated value and you have to pay the balance amount). Tyres and batteries are not covered in this add-on.',
            },
            {
                title: 'Engine Protector',
                description:
                    'Covers damage or ceasing of engine parts in situations of water logging, oil leakage etc',
            },
        ],
    },
    {
        sectionTitle: 'Add-ons and Discounts',
        data: [
            {
                title: ' 24x7 Roadside Assistance',
                description:
                    'Get support in case of on-road breakdown such as tyre change, emergency fuel, battery jump start',
            },
            {
                title: ' Consumables',
                description:
                    'Get the cost of consumables replaced such as coolant, nuts & bolts during repair of the damage',
            },
        ],
    },
    {
        sectionTitle: 'Other Addons',
        data: [
            {
                title: ' Zero Dep',
                description:
                    'In case of theft or total damage, the full amount as per vehicle invoice will be paid instead of the declared value in policy (IDV).',
            },
            {
                title: 'Invoice Cover',
                description:
                    'Get full value of replaced parts (while base policy provides depreciated value and you have to pay the balance amount). Tyres and batteries are not covered in this add-on.',
            },
            {
                title: 'Engine Protector',
                description:
                    'Covers damage or ceasing of engine parts in situations of water logging, oil leakage etc',
            },
        ],
    },
    {
        sectionTitle: 'Add-ons and Discounts',
        data: [
            {
                title: ' 24x7 Roadside Assistance',
                description:
                    'Get support in case of on-road breakdown such as tyre change, emergency fuel, battery jump start',
            },
            {
                title: ' Consumables',
                description:
                    'Get the cost of consumables replaced such as coolant, nuts & bolts during repair of the damage',
            },
        ],
    },
    {
        sectionTitle: 'Other Addons',
        data: [
            {
                title: ' Zero Dep',
                description:
                    'In case of theft or total damage, the full amount as per vehicle invoice will be paid instead of the declared value in policy (IDV).',
            },
            {
                title: 'Invoice Cover',
                description:
                    'Get full value of replaced parts (while base policy provides depreciated value and you have to pay the balance amount). Tyres and batteries are not covered in this add-on.',
            },
            {
                title: 'Engine Protector',
                description:
                    'Covers damage or ceasing of engine parts in situations of water logging, oil leakage etc',
            },
        ],
    },
    {
        sectionTitle: 'Add-ons and Discounts',
        data: [
            {
                title: ' 24x7 Roadside Assistance',
                description:
                    'Get support in case of on-road breakdown such as tyre change, emergency fuel, battery jump start',
            },
            {
                title: ' Consumables',
                description:
                    'Get the cost of consumables replaced such as coolant, nuts & bolts during repair of the damage',
            },
        ],
    },
    {
        sectionTitle: 'Other Addons',
        data: [
            {
                title: ' Zero Dep',
                description:
                    'In case of theft or total damage, the full amount as per vehicle invoice will be paid instead of the declared value in policy (IDV).',
            },
            {
                title: 'Invoice Cover',
                description:
                    'Get full value of replaced parts (while base policy provides depreciated value and you have to pay the balance amount). Tyres and batteries are not covered in this add-on.',
            },
            {
                title: 'Engine Protector',
                description:
                    'Covers damage or ceasing of engine parts in situations of water logging, oil leakage etc',
            },
        ],
    },
];

export const downloadDocumentData = ['Prospectus', 'Brochure', 'Policy Wordings'];
export const amountsForFiltering = ['1', '2', '10', '20'];
