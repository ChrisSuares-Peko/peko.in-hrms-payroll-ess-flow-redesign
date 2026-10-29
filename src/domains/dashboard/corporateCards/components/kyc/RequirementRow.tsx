import { Typography } from 'antd';

import { KycRequirement } from '../../utils/types';

const { Text } = Typography;

/** One "keep ready" document row: thumbnail + label. */
const RequirementRow = ({ item }: { item: KycRequirement }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-borderGray bg-white px-5 py-3.5">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            <img src={item.image} alt="" className="max-h-full max-w-full object-contain" />
        </span>
        <Text className="flex-1 text-base font-semibold text-textHeadings">{item.label}</Text>
    </div>
);

export default RequirementRow;
