import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row, Typography } from 'antd';

import { ENV } from '@src/config-global';

import PekoCreditsModal from './PekoCreditsModal';
import { refresh } from '../../types/accessCode';
import { PekoCreditStatus } from '../../types/pekoCredits';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    accessPermission: any;
    onBulkStatusChange: (status: PekoCreditStatus) => void;
};
const PekoCreditsHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    accessPermission,
    onBulkStatusChange,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
    // Bulk switch is a staging test aid only — the backend 403s it elsewhere.
    const showBulkStatusActions = ENV === 'staging' && accessPermission?.update;
    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex>
                <Typography.Text />
            </Flex>
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                {showBulkStatusActions && (
                    <>
                        <Button
                            className="w-full sm:w-fit"
                            onClick={() => onBulkStatusChange('DISABLED')}
                        >
                            Disable All
                        </Button>
                        <Button
                            className="w-full sm:w-fit"
                            onClick={() => onBulkStatusChange('ACTIVE')}
                        >
                            Enable All
                        </Button>
                    </>
                )}

                {accessPermission && accessPermission.write && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setOpenModal(true)}
                    >
                        Add Coupon
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
                <PekoCreditsModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
        </Row>
    );
};

export default PekoCreditsHeader;
