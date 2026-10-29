import { useState } from 'react';

import { Button, Card, Flex } from 'antd';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';

import ArrowRedIcon from '../../assets/icons/line-arrow-right.svg';
import type { RecentDocument } from '../../types';
import DocListItem from '../shared/DocListItem';
import DocTabFilter from '../shared/DocTabFilter';

interface RecentDocumentsProps {
    documents: RecentDocument[];
    onViewAll?: () => void;
    onDocumentClick?: (doc: RecentDocument) => void;
    onSend?: (doc: RecentDocument) => void;
    onTabChange?: (tab: string) => void;
}

const RecentDocuments = ({
    documents,
    onViewAll,
    onDocumentClick,
    onSend,
    onTabChange,
}: RecentDocumentsProps) => {
    const [activeTab, setActiveTab] = useState<string>('All');

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    return (
        <Card
            variant="borderless"
            className="w-full bg-gray-50 rounded-3xl outline outline-[0.5px] outline-stone-300"
            styles={{ body: { padding: 24 } }}
        >
            <Flex vertical gap={20}>
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <TypographyText className="text-lg font-semibold font-['Roboto'] block">
                        Recent Documents
                    </TypographyText>
                    <Button
                        type="text"
                        onClick={onViewAll}
                        className="p-0 !h-auto !text-[#FF3A3A] text-base font-normal font-['Roboto'] hover:!text-[#e02020] hover:!bg-transparent flex items-center gap-1"
                    >
                        View all
                        <ReactSVG
                            src={ArrowRedIcon}
                            beforeInjection={svg =>
                                svg.setAttribute('style', 'width: 16px; height: 16px;')
                            }
                        />
                    </Button>
                </Flex>

                {/* Tab filter */}
                <DocTabFilter activeTab={activeTab} onChange={handleTabChange} />

                {/* Document list */}
                <Flex vertical gap={12}>
                    {documents.length === 0 ? (
                        <TypographyText className="text-gray-400 text-sm text-center py-4 block">
                            No documents found
                        </TypographyText>
                    ) : (
                        documents.map(doc => (
                            <DocListItem
                                key={doc.id}
                                iconSrc={doc.iconSrc}
                                title={doc.title}
                                subTitle={doc.subTitle}
                                status={doc.status}
                                onClick={() => onDocumentClick?.(doc)}
                                onActionClick={() => onSend?.(doc)}
                            />
                        ))
                    )}
                </Flex>
            </Flex>
        </Card>
    );
};

export default RecentDocuments;
