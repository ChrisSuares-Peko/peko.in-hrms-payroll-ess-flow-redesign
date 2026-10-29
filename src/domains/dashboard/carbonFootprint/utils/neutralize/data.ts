import {
    ProjectImage1,
    ProjectImage2,
    ProjectImage3,
    ProjectImage4,
} from '../../assets/images/neutralize';

interface IData {
    img: string;
    title: string;
    description: string;
    price: string;
}

export const data: IData[] = [
    {
        img: ProjectImage1,
        title: 'Single Metric Tonne Offset',
        description: 'Buy 500 Credits with 15 tons CO2',
        price: 'USD 5',
    },
    {
        img: ProjectImage2,
        title: 'Single Metric Tonne Offset',
        description: 'Buy 500 Credits with 15 tons CO2',
        price: 'USD 5',
    },
    {
        img: ProjectImage3,
        title: 'Single Metric Tonne Offset',
        description: 'Buy 500 Credits with 15 tons CO2',
        price: 'USD 5',
    },
    {
        img: ProjectImage4,
        title: 'Single Metric Tonne Offset',
        description: 'Buy 500 Credits with 15 tons CO2',
        price: 'USD 5',
    },
];
