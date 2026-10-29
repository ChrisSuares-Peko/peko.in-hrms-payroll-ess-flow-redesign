import { Flex, Typography } from 'antd';

import ReportCard from './ReportCard';
import { ReportGroup as ReportGroupType } from '../../utils/financialStatementsData';

const { Text } = Typography;

interface ReportGroupProps {
    group: ReportGroupType;
    onOpen?: (key: string) => void;
}

const ReportGroup = ({ group, onOpen }: ReportGroupProps) => (
    <Flex vertical gap={12} className="w-full">
        <Text className="text-base font-medium text-slate-400 md:text-lg">{group.heading}</Text>
        {group.items.map(report => (
            <ReportCard key={report.key} report={report} onOpen={() => onOpen?.(report.key)} />
        ))}
    </Flex>
);

export default ReportGroup;
