import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row, Select } from 'antd';

import { DownloadType } from '@customtypes/general';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import { PACKAGE_SYNC_TYPE } from '../../types/packageSync';
import PackageSyncDrawer from '../packageSync/PackageSyncDrawer';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    setOpenModal: (e: any) => void;
    downloadReport: (type: string) => void;
    handlePartnerChange: (e: string) => void;
    accessPermission: any;
    handleRefresh: () => void;
    partnerId?: string;
};

const OperatorHeader = ({
    searchText,
    handleSearch,
    setOpenModal,
    downloadReport,
    handlePartnerChange,
    accessPermission,
    handleRefresh,
    partnerId,
}: Props) => {
    const { partnerData } = usePartnersForCorporate('');
    const [syncOpen, setSyncOpen] = useState(false);
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
                {accessPermission && accessPermission.update && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setSyncOpen(true)}
                    >
                        Auto Update
                    </Button>
                )}
                {accessPermission && accessPermission.write && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setOpenModal(true)}
                    >
                        Add Package
                    </Button>
                )}
                <Select
                    placeholder="Select Partner"
                    className="min-w-52"
                    options={partnerData}
                    allowClear
                    onChange={e => handlePartnerChange(e)}
                />
                <Input
                    value={searchText}
                    placeholder="Search For Package"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
            {syncOpen && (
                <PackageSyncDrawer
                    open
                    type={PACKAGE_SYNC_TYPE.servicePackages}
                    partnerOptions={partnerData}
                    initialPartnerIds={[partnerId ? String(partnerId) : 'default']}
                    onClose={() => setSyncOpen(false)}
                    handleRefresh={handleRefresh}
                />
            )}
        </Row>
    );
};
export default OperatorHeader;
