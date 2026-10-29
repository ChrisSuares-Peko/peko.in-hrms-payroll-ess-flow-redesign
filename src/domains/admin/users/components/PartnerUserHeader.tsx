import React, { Suspense, lazy, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

import { refresh } from '../../officeSupplies/types/products';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDownloadReport: (type: string) => void;
    accessPermission: any;
};
// const EditPartnerUserModal = lazy(() => import('./EditPartnerUserModal'));
const EditPartnerRoleModal = lazy(() => import('./EditPartnerRoleModal'));
const ClonePartnerModal = lazy(
    () => import('../../settings/component/partnerPermission/CloneModal')
);
const CashbackCopyModal = lazy(() => import('./cashbackCopy/CashbackCopyModal'));
const Header = ({
    searchText,
    handleSearch,
    setRefresh,
    handleDownloadReport,
    accessPermission,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
    const [openCloneModal, setCloneOpenModal] = useState(false);
    const [openCashbackCopyModal, setCashbackCopyModal] = useState(false);
    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3">
                <Button danger onClick={() => handleDownloadReport(DownloadType.Excel)}>
                    Excel
                </Button>
                <Button danger onClick={() => handleDownloadReport(DownloadType.Csv)}>
                    CSV
                </Button>
                <Button danger onClick={() => handleDownloadReport(DownloadType.Pdf)}>
                    PDF
                </Button>
            </Flex>
            <Flex className="flex-col justify-end gap-3 px-0 md:flex-row">
            {accessPermission && accessPermission.write && (
                <>
                <Button
                    type="primary"
                    className=""
                    danger
                    onClick={() => setCashbackCopyModal(true)}
                >
                    Clone Packages &amp; Cashbacks
                </Button>
                <Button type="primary" className="" danger onClick={() => setCloneOpenModal(true)}>
                    Clone Partner
                </Button>
                <Button type="primary" className="" danger onClick={() => setOpenModal(true)}>
                    Add New Partner
                </Button>
                </>
            )}
                <Input
                    value={searchText}
                    placeholder="Search For Users"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
            {/* <Suspense>
                {openModal && (
                    <EditPartnerUserModal
                        handleCancel={() => setOpenModal(false)}
                        open={openModal}
                        setRefresh={setRefresh}
                    />
                )}
            </Suspense> */}
            <Suspense>
                {openModal && (
                    <EditPartnerRoleModal
                        handleCancel={() => setOpenModal(false)}
                        open={openModal}
                        setRefresh={setRefresh}
                    />
                )}
            </Suspense>
            <Suspense>
                {openCloneModal && (
                    <ClonePartnerModal
                        handleCancel={() => setCloneOpenModal(false)}
                        open={openCloneModal}
                        setRefresh={setRefresh}
                    />
                )}
            </Suspense>
            <Suspense>
                {openCashbackCopyModal && (
                    <CashbackCopyModal
                        handleCancel={() => setCashbackCopyModal(false)}
                        open={openCashbackCopyModal}
                        setRefresh={setRefresh}
                    />
                )}
            </Suspense>
        </Row>
    );
};

export default Header;
