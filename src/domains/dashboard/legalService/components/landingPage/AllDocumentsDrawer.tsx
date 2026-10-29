import React, { useState } from 'react';

import { CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Pagination, Spin, Typography } from 'antd';

import DrawerModal from '@components/atomic/DrawerModal';
import TypographyText from '@components/atomic/typography/typographyText';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import useDocuments from '../../hooks/useDocuments';
import type { RecentDocument } from '../../types';
import DocListItem from '../shared/DocListItem';
import DocTabFilter from '../shared/DocTabFilter';

const ITEMS_PER_PAGE = 12;

interface AllDocumentsDrawerProps {
    open: boolean;
    onClose: () => void;
    onDocumentClick?: (doc: RecentDocument) => void;
}

const AllDocumentsDrawer = ({ open, onClose, onDocumentClick }: AllDocumentsDrawerProps) => {
    const [activeTab, setActiveTab] = useState<string>('All');
    const [filters, setFilters] = useState({ searchText: '' });
    const [page, setPage] = useState(1);
    const { updateSearchText, searchText: searchInputText } = useDebounceSearch(setFilters);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setPage(1);
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSearchText(e);
        setPage(1);
    };
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text');
        if (
            /\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier}/gu.test(
                text
            )
        ) {
            e.preventDefault();
        }
    };

    const { documents, total, isLoading } = useDocuments({
        searchText: filters.searchText,
        status: activeTab !== 'All' ? activeTab : undefined,
        limit: ITEMS_PER_PAGE,
        page,
    });

    const footer =
        total > ITEMS_PER_PAGE ? (
            <Flex justify="center">
                <Pagination
                    current={page}
                    total={total}
                    pageSize={ITEMS_PER_PAGE}
                    onChange={setPage}
                    showSizeChanger={false}
                />
            </Flex>
        ) : (
            <Typography.Text className="text-gray-500 text-sm block text-center">
                Showing {total} document{total !== 1 ? 's' : ''}
            </Typography.Text>
        );

    return (
        <DrawerModal
            open={open}
            handleCancel={onClose}
            modalTitle=""
            width={
                typeof window !== 'undefined' && window.innerWidth < 640 ? window.innerWidth : 480
            }
            footer={footer}
        >
            <Flex vertical gap={16} className="h-full">
                {/* Header */}
                <Flex justify="space-between" align="flex-start">
                    <Flex vertical gap={4}>
                        <TypographyText className="text-2xl font-semibold font-['Roboto'] text-gray-900 block">
                            All Documents
                        </TypographyText>
                        <TypographyText className="text-sm font-normal font-['Roboto'] text-gray-400 block">
                            {total} total
                        </TypographyText>
                    </Flex>
                    <CloseCircleOutlined
                        onClick={onClose}
                        className="text-gray-900 text-xl hover:text-black cursor-pointer transition-colors"
                    />
                </Flex>

                {/* Tab filter */}
                <DocTabFilter activeTab={activeTab} onChange={handleTabChange} />

                {/* Search */}
                <Input
                    prefix={<SearchOutlined className="text-gray-400" />}
                    placeholder="Search documents by name"
                    value={searchInputText}
                    onChange={handleSearch}
                    onPaste={handlePaste}
                    allowClear
                    className="h-11 rounded-lg"
                />

                {/* Document list */}
                <Flex vertical gap={12} className="flex-1 overflow-y-auto">
                    {isLoading && (
                        <Flex justify="center" className="py-8">
                            <Spin />
                        </Flex>
                    )}
                    {!isLoading && documents.length === 0 && (
                        <TypographyText className="text-gray-400 text-sm text-center py-8 block">
                            No documents found
                        </TypographyText>
                    )}
                    {!isLoading &&
                        documents.length > 0 &&
                        documents.map(doc => (
                            <DocListItem
                                key={doc.id}
                                iconSrc={doc.iconSrc}
                                title={doc.title}
                                subTitle={doc.subTitle}
                                status={doc.status}
                                showChevron
                                iconBg="bg-pink-50"
                                rowBg="bg-gray-50"
                                onClick={() => onDocumentClick?.(doc)}
                            />
                        ))}
                </Flex>
            </Flex>
        </DrawerModal>
    );
};

export default AllDocumentsDrawer;
