import { Button, Flex, Typography } from 'antd';

import {
    LinkDocumentTabKey,
    linkDocumentCopy,
    linkDocumentTabs,
} from '../../utils/linkDocumentData';

const { Title, Text } = Typography;

interface LinkDocumentHeaderProps {
    description?: string;
    activeTab: LinkDocumentTabKey;
    activeTabLabel: string;
    switchTab: (key: LinkDocumentTabKey) => void;
}

const LinkDocumentHeader = ({
    description,
    activeTab,
    activeTabLabel,
    switchTab,
}: LinkDocumentHeaderProps) => (
    <>
        <Flex vertical gap={2}>
            <Title level={3} className="!mb-0 !text-xl !font-semibold !text-ink md:!text-2xl">
                {linkDocumentCopy.title}
            </Title>
            <Text className="text-sm text-muted md:text-base">{description}</Text>
        </Flex>

        <Flex vertical gap={12}>
            <Flex vertical gap={2}>
                <Text className="text-lg font-semibold text-ink">{activeTabLabel}</Text>
                <Text className="text-sm text-muted">{linkDocumentCopy.description}</Text>
            </Flex>
            <Flex wrap="wrap" gap={8}>
                {linkDocumentTabs.map(tab => {
                    const isActive = tab.key === activeTab;
                    return (
                        <Button
                            key={tab.key}
                            shape="round"
                            type={isActive ? 'primary' : 'text'}
                            danger={isActive}
                            onClick={() => switchTab(tab.key)}
                            className={
                                isActive
                                    ? '!font-medium'
                                    : '!font-medium !text-muted hover:!bg-slate-100 hover:!text-bodyText'
                            }
                        >
                            {tab.label}
                        </Button>
                    );
                })}
            </Flex>
        </Flex>
    </>
);

export default LinkDocumentHeader;
