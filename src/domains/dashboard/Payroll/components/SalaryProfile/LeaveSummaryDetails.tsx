import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

type Props = {
    title: string;
    icon: string;
    value: string | number;
};

export const LeaveSummaryDetails = ({ title, icon, value }: Props) => (
    <Flex className="mt-5">
        <Flex align="center" justify="center" className="bg-iconBgRed w-10 h-10 rounded-md">
            <ReactSVG
                src={icon}
                beforeInjection={svg => {
                    svg.setAttribute('style', 'width: 19px; height: 19px;');
                }}
            />
        </Flex>
        <Flex className="ms-4 w-full mx-5" justify="space-between" align="center">
            <Typography.Text className="text-valueText font-medium text-md">
                {title}
            </Typography.Text>
            <Typography.Text className="text-valueText font-medium text-md">
                {value}
            </Typography.Text>
        </Flex>
    </Flex>
);
