import { CloseOutlined, DownloadOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex, Typography } from 'antd';

import { transactionCategoryOptions } from '../../utils/transactionsData';

const { Text } = Typography;

const CATEGORY_MENU = transactionCategoryOptions.map(option => ({
    key: option.label,
    label: option.label,
}));

const RECURRING_MENU = [
    { key: 'recurring', label: 'Mark Recurring' },
    { key: 'not-recurring', label: 'Mark Not Recurring' },
];

interface BulkActionsBarProps {
    count: number;

    onCategorize: (category: string) => void;

    onMarkRecurring: (isRecurring: boolean) => void;

    hideLabel?: string;
    onHide: () => void;

    exporting?: boolean;
    onExport: () => void;
    onClear: () => void;
}

const ACTION_BTN =
    '!h-auto !rounded-lg !border-0 !bg-white/10 !px-3 !py-2 !text-sm !font-medium !text-white hover:!bg-white/20';

const BulkActionsBar = ({
    count,
    onCategorize,
    onMarkRecurring,
    hideLabel = 'Hide',
    onHide,
    exporting,
    onExport,
    onClear,
}: BulkActionsBarProps) => (
    <div className="sticky bottom-4 z-20">
        <Flex
            align="center"
            wrap="wrap"
            className="w-full gap-2 rounded-2xl bg-ink px-4 py-3 shadow-lg sm:gap-3 sm:px-5"
        >
            <Text className="!font-semibold !text-white">{count} selected</Text>
            <Dropdown
                trigger={['click']}
                menu={{ items: CATEGORY_MENU, onClick: ({ key }) => onCategorize(key) }}
            >
                <Button className={ACTION_BTN}>
                    Categorize <DownOutlined className="!text-xs" />
                </Button>
            </Dropdown>
            <Dropdown
                trigger={['click']}
                menu={{
                    items: RECURRING_MENU,
                    onClick: ({ key }) => onMarkRecurring(key === 'recurring'),
                }}
            >
                <Button className={ACTION_BTN}>
                    Recurring <DownOutlined className="!text-xs" />
                </Button>
            </Dropdown>
            <Button onClick={onHide} className={ACTION_BTN}>
                {hideLabel}
            </Button>
            <Button
                icon={<DownloadOutlined />}
                onClick={() => onExport()}
                loading={exporting}
                className={ACTION_BTN}
            >
                Export
            </Button>

            <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={onClear}
                className="!ml-auto !h-auto !px-2 !py-1.5 !text-sm !font-medium !text-white/70 hover:!text-white"
            >
                Clear
            </Button>
        </Flex>
    </div>
);

export default BulkActionsBar;
