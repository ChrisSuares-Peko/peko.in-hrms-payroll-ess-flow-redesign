import { Flex } from 'antd';

import RatingAndReviewSection from './RatingAndReviewSection';
import StreangthNWeakness from './StreangthNWeakness';

const RatingsTab = () => (
    <Flex vertical className="w-full  min-h-96">
        <RatingAndReviewSection />
        <StreangthNWeakness title="strength" />
        <StreangthNWeakness title="weakness" />
    </Flex>
);

export default RatingsTab;
