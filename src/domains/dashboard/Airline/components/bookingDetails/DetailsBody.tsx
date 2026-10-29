import { Flex } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import CompactItineraryCard from '../CompactItineraryCard';
import CompactItineraryCardMobile from '../CompactItineraryCardMobile';

function DetailsBody() {
    const { md } = useScreenSize();
    return (
        <Flex className="w-full" vertical>
            {md ? <CompactItineraryCard /> : <CompactItineraryCardMobile />}
        </Flex>
    );
}

export default DetailsBody;
