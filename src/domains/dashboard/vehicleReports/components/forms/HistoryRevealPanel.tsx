import { Flex, Typography } from 'antd';

import { historyRevealItems } from '../../utils/data';
import FeatureList from '../shared/FeatureList';

// Inset panel under the registration-number field on the history form, listing what
// the purchased report will contain.
const HistoryRevealPanel = () => (
    <Flex vertical gap={14} className="rounded-xl bg-[#F7F8FA] p-5">
        <Typography.Text className="text-base font-medium text-[#0A0A0A]">
            What this report can reveal
        </Typography.Text>
        <FeatureList items={historyRevealItems} variant="outlined" gap={10} />
    </Flex>
);

export default HistoryRevealPanel;
