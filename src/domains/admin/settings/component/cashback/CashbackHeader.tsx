import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row, Select } from 'antd';

import { DownloadType } from '@customtypes/general';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import CashbackModal from './CashbackModal';
import { refresh } from '../../types/cashback';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    downloadReport: (type: string) => void;
    handlePartnerChange: (e: string) => void;
    handleModalPartnerChange: (e: string) => void;
    partnerId: string;
    CategoryData: any;
    accessPermission: any;
};

const CashbackHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    packageData,
    CategoryData,
    serviceData,
    downloadReport,
    handlePartnerChange,
    partnerId,
    handleModalPartnerChange,
    accessPermission,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
    const { partnerData } = usePartnersForCorporate('');
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
                {accessPermission && accessPermission.write && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => {
                            handleModalPartnerChange('default');
                            setOpenModal(true);
                        }}
                    >
                        Add New Cashback
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
                    placeholder="Search "
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
            {openModal && (
                <CashbackModal
                    serviceData={serviceData}
                    packageData={packageData}
                    CategoryData={CategoryData}
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                    handlePartnerChange={handleModalPartnerChange}
                    partnerId={partnerId}
                />
            )}
        </Row>
    );
};
export default CashbackHeader;
