import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row, Select } from 'antd';

import { DownloadType } from '@customtypes/general';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';

import HikeModal from './HikeModal';

interface modalProps {
    searchText: string;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    handleSearch: any;
    handlePartnerChange: (e: string) => void;
    accessPermission: any;
    downloadReport: (type: 'excel' | 'csv' | 'pdf') => void;
}
const HikeHeader = ({
    searchText,
    setRefresh,
    handleSearch,
    handlePartnerChange,
    accessPermission,
    downloadReport,
}: modalProps) => {
    const [openModal, setOpenModal] = useState(false);
    const { partnerData } = usePartnersForCorporate('');
    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3 ">
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
            </Flex>
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                {accessPermission && accessPermission.write && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setOpenModal(true)}
                    >
                        Add Hike
                    </Button>
                )}
                <Select
                    placeholder="Select Partner"
                    className="min-w-52"
                    options={partnerData}
                    allowClear
                    onChange={e => handlePartnerChange(e)}
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
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
                <HikeModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
        </Row>
    );
};

export default HikeHeader;
