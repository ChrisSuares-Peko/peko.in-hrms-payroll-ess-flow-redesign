import { useEffect, useState } from 'react';

import { Flex, Steps, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import '../../assets/style.css';

type PROPS = {
    current: number;
};
const KYBSteps = ({ current }: PROPS) => {
    const navigate = useNavigate();
    const {
        collectorKyb: { kybStatus },
    } = useAppSelector(state => state.reducer.invoices);

    const [screenWidth, setScreenWidth] = useState<number | null>(null);
    useEffect(() => {
        const handleResize = () => {
            const windowWidth = window.innerWidth;
            setScreenWidth(windowWidth);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const kybSteps = [
        {
            key: 'eSign Agreement',
            title: (
                <Flex
                    className="h-full items-center cursor-pointer"
                    onClick={() => {
                        navigate(`/${paths.invoice.index}/${paths.invoice.kyb}`);
                    }}
                >
                    <Typography.Text className="text-sm ml-2">eSign Agreement</Typography.Text>
                </Flex>
            ),
        },
        {
            key: 'Upload Documents',
            title: (
                <Flex
                    className="h-full items-center cursor-pointer"
                    onClick={() => {
                        if (kybStatus !== 'PENDING') {
                            console.log('status pending');
                        }
                    }}
                >
                    <Typography.Text className="text-sm ml-2">Upload Documents</Typography.Text>
                </Flex>
            ),
        },
    ];
    return (
        <Flex
            className={`${screenWidth && screenWidth >= 600 ? 'w-full my-5' : ''} md:w-3/4 lg:w-full xl:w-1/3 justify-center invoice_kyb_step`}
        >
            <Steps
                className="text-green-400"
                direction={screenWidth && screenWidth < 600 ? 'vertical' : 'horizontal'}
                responsive={false}
                size="small"
                current={current}
                items={kybSteps}
            />
        </Flex>
    );
};

export default KYBSteps;
