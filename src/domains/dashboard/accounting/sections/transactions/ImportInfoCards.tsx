import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';

import { importTransactionsModal } from '../../utils/transactionsData';

const { Text } = Typography;

const CARD_CLASS = 'w-full rounded-2xl border border-borderStrong bg-surfaceGray p-5 sm:p-6';

interface ImportInfoCardsProps {
    onDownloadTemplate: () => void;
}

const ImportInfoCards = ({ onDownloadTemplate }: ImportInfoCardsProps) => (
    <Flex vertical gap={16} className="w-full">
        <Flex vertical gap={6} className={CARD_CLASS}>
            <Text className="text-sm font-semibold text-bodyText">
                {importTransactionsModal.expectedColumnsTitle}
            </Text>
            <Flex vertical>
                {importTransactionsModal.expectedColumns.map(column => (
                    <Text key={column} className="text-sm leading-6 text-muted">
                        {column}
                    </Text>
                ))}
            </Flex>
        </Flex>

        <Flex align="center" gap={16} className={CARD_CLASS}>
            <DownloadOutlined className="shrink-0 text-2xl text-bodyText" />
            <Flex vertical gap={2} className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-ink">
                    {importTransactionsModal.templateTitle}
                </Text>
                <Text className="text-xs text-muted">
                    {importTransactionsModal.templateSubtitle}
                </Text>
            </Flex>
            <Button
                type="primary"
                size="large"
                onClick={onDownloadTemplate}
                className="shrink-0 !rounded-lg"
            >
                {importTransactionsModal.templateCta}
            </Button>
        </Flex>
    </Flex>
);

export default ImportInfoCards;
