import { Button, Typography } from 'antd';

import { TransactionsVariant } from './TransactionsTable';
import exportIcon from '../../../assets/icons/export.svg';
import { MY_TRANSACTIONS_COPY } from '../../../utils/myTransactionsData';
import { TRANSACTIONS_COPY } from '../../../utils/transactionsData';

const { Title, Text } = Typography;

interface TransactionsHeaderProps {
    variant?: TransactionsVariant;
    onExport: () => void;
    isExporting?: boolean;
}

/** Transactions page header: title + subtitle on the left, CSV export on the right. */
const TransactionsHeader = ({
    variant = 'admin',
    onExport,
    isExporting = false,
}: TransactionsHeaderProps) => {
    const copy = variant === 'user' ? MY_TRANSACTIONS_COPY : TRANSACTIONS_COPY;

    return (
        <div className="flex mt-3 flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-1">
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        {copy.title}
                    </Title>
                    <Text className="text-sm text-textBody">{copy.subtitle}</Text>
                </div>

                <Button
                    danger
                    loading={isExporting}
                    icon={<img src={exportIcon} alt="export" className="h-4 w-4" />}
                    onClick={onExport}
                >
                    {copy.exportCsv}
                </Button>
            </div>
        </div>
    );
};

export default TransactionsHeader;
