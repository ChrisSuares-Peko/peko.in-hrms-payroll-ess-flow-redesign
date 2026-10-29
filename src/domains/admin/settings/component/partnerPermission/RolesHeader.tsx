import React, { Suspense, lazy, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

import { refresh } from '../../types/partnerPermission';

const RoleModal = lazy(() => import('./RoleModal'));
const ClonePermissionModal = lazy(() => import('./ClonePermissionModal'));

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDownloadReport: (type: string) => void;
    accessPermission: any;
};

const RolesHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    handleDownloadReport,
    accessPermission,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
    const [openCloneModal, setOpenCloneModal] = useState(false);
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
            {accessPermission && accessPermission.write && (
                <Flex className="flex-col justify-end gap-3 px-0 md:flex-row">
                    {/* <Button danger onClick={() => setOpenCloneModal(true)}>
                        Clone Permission
                    </Button> */}
                    <Button type="primary" className="" danger onClick={() => setOpenModal(true)}>
                        Add New Partner Permission
                    </Button>
                    <Input
                        value={searchText}
                        placeholder="Search For Roles"
                        suffix={<SearchOutlined />}
                        onChange={handleSearch}
                        allowClear
                        type="text"
                        variant="outlined"
                        maxLength={100}
                    />
                </Flex>
            )}
            <Suspense>
                {openModal && (
                    <RoleModal
                        open={openModal}
                        handleCancel={() => setOpenModal(false)}
                        setRefresh={setRefresh}
                    />
                )}
                {openCloneModal && (
                    <ClonePermissionModal
                        open={openCloneModal}
                        handleCancel={() => setOpenCloneModal(false)}
                        setRefresh={setRefresh}
                    />
                )}
            </Suspense>
        </Row>
    );
};
export default RolesHeader;
