import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

import RefferalCodeModal from './RefferalCodeModal';
import RefferalRewardModal from './RefferalRewardModal';
import RefferralDownloadModal from './RefferralDownloadModal';
import { refresh } from '../../types/refferalCode';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    downloadReport: (type: string) => void;
    accessPermission: any;
    fetchGeneralReferralReports: ({
        fromDate,
        toDate,
        PartnerId,
    }: {
        fromDate: string;
        toDate: string;
        PartnerId?: number | undefined;
    }) => Promise<void>;
};

const RefferalCodeHeaders = ({
    searchText,
    handleSearch,
    setRefresh,
    downloadReport,
    fetchGeneralReferralReports,
    accessPermission,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
    const [openReportModal, setOpenReportModal] = useState(false);
    const [openRewardModal, setOpenRewardModal] = useState(false);
    const handleOpenReportModal = () => setOpenReportModal(true);
    const handleCloseReportModal = () => setOpenReportModal(false);
    const handleOpenRewardModal = () => setOpenRewardModal(true);
    const handleCloseRewardModal = () => setOpenRewardModal(false);
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
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    onClick={handleOpenRewardModal}
                >
                    Refferal Reward
                </Button>
                <Button
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    onClick={handleOpenReportModal}
                >
                    Download Referral Report
                </Button>
                {accessPermission && accessPermission.write && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setOpenModal(true)}
                    >
                        Add New Referral Code
                    </Button>
                )}

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
                <RefferalCodeModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
            {openRewardModal && (
                <RefferalRewardModal open={openRewardModal} handleCancel={handleCloseRewardModal} />
            )}
            {openReportModal && (
                <RefferralDownloadModal
                    open={openReportModal}
                    handleCancel={handleCloseReportModal}
                    setRefresh={setRefresh}
                    fetchGeneralReferralReports={fetchGeneralReferralReports}
                />
            )}
        </Row>
    );
};
export default RefferalCodeHeaders;
