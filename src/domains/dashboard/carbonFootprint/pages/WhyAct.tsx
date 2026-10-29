import { Button, Flex, Image, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { whyAct } from '@domains/dashboard/carbonFootprint/assets/images/whyAct/index';
import { paths } from '@src/routes/paths';

import CardRow from '../components/CardRow';
import { whyActData } from '../utils/data';

const { Text } = Typography;

type Props = {};

const WhyAct = (props: Props) => {
    const navigate = useNavigate();
    return (
        <Flex gap={30} vertical align="center" className="px-0 sm:px-6 mb-16">
            <Text className="text-center w-full sm:w-9/12 text-[1.5rem] sm:text-[2.65rem] font-light ">
                We are all aware that climate change is impacting our everyday lives
            </Text>

            <Text className="text-center text-red-500 text-[1rem] sm:text-[1.3rem] font-normal leading-10">
                Why act now? Because
            </Text>

            <CardRow data={whyActData} />

            <Image preview={false} className="mt-10" width={350} src={whyAct} />
            <Button
                className="w-full sm:w-3/12  h-10 mt-3"
                type="primary"
                danger
                onClick={() =>
                    navigate(
                        `${paths.dashboard.moreServices}/${paths.zeroCarbon.index}/${paths.zeroCarbon.projectListing}`
                    )
                }
            >
                Neutralise Now
            </Button>
        </Flex>
    );
};

export default WhyAct;
