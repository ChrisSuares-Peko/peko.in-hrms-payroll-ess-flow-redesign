import React, { useState } from 'react';

import { CloudDownloadOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

import DomainHostingAutoImport from './DomainHostingAutoImport';
import DomainHostingPlansModal from './DomainHostingPlansModal';

interface HeaderProps {
    searchText: string;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    handleSearch: any;
    downloadReport: (type: string) => void;
    accessPermission: any;
    onRefetchPricing: () => void;
    refetchPricingLoading: boolean;
}

const DomainHostingPlansHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    downloadReport,
    accessPermission,
    onRefetchPricing,
    refetchPricingLoading,
}: HeaderProps) => {
    const [openModal, setOpenModal] = useState(false);
    const [autoImportOpen, setAutoImportOpen] = useState(false);

    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3">
                <Button danger onClick={() => downloadReport(DownloadType.Excel)}>
                    Excel
                </Button>
                <Button danger onClick={() => downloadReport(DownloadType.Csv)}>
                    CSV
                </Button>
                <Button danger onClick={() => downloadReport(DownloadType.Pdf)}>
                    PDF
                </Button>
            </Flex>
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                <Button
                    icon={<SyncOutlined />}
                    loading={refetchPricingLoading}
                    onClick={onRefetchPricing}
                    className="w-full sm:w-fit"
                >
                    Refetch Pricing
                </Button>
                {accessPermission?.write && (
                    <Button
                        icon={<CloudDownloadOutlined />}
                        className="w-full sm:w-fit"
                        onClick={() => setAutoImportOpen(true)}
                    >
                        Auto Import
                    </Button>
                )}
                {accessPermission?.write && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setOpenModal(true)}
                    >
                        Add Domain & Hosting Plan
                    </Button>
                )}
                <Input
                    value={searchText}
                    placeholder="Search"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
            {openModal && (
                <DomainHostingPlansModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                    mode="add"
                />
            )}
            {autoImportOpen && (
                <DomainHostingAutoImport
                    open={autoImportOpen}
                    onClose={() => setAutoImportOpen(false)}
                    setRefresh={setRefresh}
                />
            )}
        </Row>
    );
};

export default DomainHostingPlansHeader;
