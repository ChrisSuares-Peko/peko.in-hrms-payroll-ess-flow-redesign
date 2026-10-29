import { RightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { ReportItem } from '../../utils/financialStatementsData';

const { Text } = Typography;

interface ReportCardProps {
    report: ReportItem;
    onOpen?: () => void;
}

const ReportCard = ({ report, onOpen }: ReportCardProps) => (
    <Flex
        align="center"
        justify="space-between"
        gap={16}
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen?.();
            }
        }}
        className="group w-full cursor-pointer rounded-[22px] border border-borderStrong bg-surfaceGray px-6 py-5 text-left transition-colors hover:border-danger hover:bg-danger-surface focus-visible:border-danger focus-visible:bg-danger-surface focus-visible:outline-none"
    >
        <Flex align="center" gap={14} className="min-w-0">
            <ReactSVG
                src={report.icon}
                className="shrink-0 text-danger transition-colors group-hover:text-danger group-focus-visible:text-danger [&_svg]:size-8"
            />
            <Flex vertical gap={4} className="min-w-0">
                <Text className="text-base font-medium text-bodyText [overflow-wrap:anywhere]">
                    {report.title}
                </Text>
                <Text className="text-sm text-slate-400 [overflow-wrap:anywhere]">
                    {report.description}
                </Text>
            </Flex>
        </Flex>
        <RightOutlined className="shrink-0 text-base text-slate-400 transition-colors group-hover:text-danger group-focus-visible:text-danger" />
    </Flex>
);

export default ReportCard;
