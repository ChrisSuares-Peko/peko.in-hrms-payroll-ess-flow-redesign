import { Flex, Typography } from 'antd';

import likeShapes from '../../assets/svg/like-shapes.svg';

interface Props {
    text: string;
}

// Tinted "Best for : …" note that opens the What's-included block on each
// report-type card.
const BestForNote = ({ text }: Props) => (
    <Flex align="center" gap={8} className="rounded-xl bg-[#FFF4FF] p-3">
        <img src={likeShapes} alt="" className="h-6 w-6 shrink-0" />
        <Typography.Text className="text-xs leading-[16px] text-[#676767]">
            {text}
        </Typography.Text>
    </Flex>
);

export default BestForNote;
