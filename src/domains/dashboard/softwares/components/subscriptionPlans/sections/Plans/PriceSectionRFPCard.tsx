import { Typography, Button, Flex } from 'antd';

import useGetAssistance from '@src/domains/dashboard/softwares/hooks/general/useGetAssistance';

const { Text } = Typography;

type Props = {
    planName: string;
    weburl: string;
    amountInConvertedCurrency: string;
    period: string;
    isPlanFree:boolean
};

const PriceSectionRFPCard = ({
    planName,
    weburl,
    period,
    amountInConvertedCurrency,
    isPlanFree
}: Props) => {
    const { isLoading, requestAssistance } = useGetAssistance();

    return (
        <Flex vertical className="gap-4">
            <Flex className="justify-between">
                <Text className="font-semibold text-lg text-navTextColor">{planName}</Text>
            </Flex>
            <Flex className="items-baseline gap-5 flex-wrap mt-5">
                <Text className="font-semibold text-4xl text-black">
                    ₹  {amountInConvertedCurrency}
                    <span className="font-regular text-sm text-navTextColor"> /{period}</span>
                </Text>
            </Flex>
            <Button
                type="primary"
                danger
                block
                size="large"
                disabled={isPlanFree}
                className="mt-5 rounded-xl h-11 font-medium"
                loading={isLoading}
                onClick={() => {
                    requestAssistance(weburl);
                }}
            >
                {isPlanFree ? 'Free Plan' : 'Request for Quote'}
            </Button>
        </Flex>
    );
};

export default PriceSectionRFPCard;
