import { PrinterOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, DatePicker, Typography } from 'antd';
import dayjs from 'dayjs';

import { STATEMENT_COPY } from '../../../utils/statementData';

const { Title, Text } = Typography;

interface StatementHeaderProps {
    /** Selected month as 'YYYY-MM'. */
    month: string;
    onMonthChange: (month: string) => void;
    onExport: () => void;
    exporting?: boolean;
    onPrint: () => void;
    printing?: boolean;
}

/** "Account Statement" page header: title + subtitle on the left, month picker + print/export on the right. */
const StatementHeader = ({
    month,
    onMonthChange,
    onExport,
    exporting,
    onPrint,
    printing,
}: StatementHeaderProps) => (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
            <Title level={3} className="!mb-0 !text-textHeadings">
                {STATEMENT_COPY.title}
            </Title>
            <Text className="text-sm text-textBody">{STATEMENT_COPY.subtitle}</Text>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <DatePicker
                picker="month"
                allowClear={false}
                value={dayjs(month)}
                disabledDate={current => current.isAfter(dayjs(), 'month')}
                onChange={value => value && onMonthChange(value.format('YYYY-MM'))}
                className="w-full sm:w-44"
            />
            <Button danger icon={<PrinterOutlined />} loading={printing} onClick={onPrint}>
                {STATEMENT_COPY.print}
            </Button>
            <Button danger icon={<UploadOutlined />} loading={exporting} onClick={onExport}>
                {STATEMENT_COPY.exportCsv}
            </Button>
        </div>
    </div>
);

export default StatementHeader;
