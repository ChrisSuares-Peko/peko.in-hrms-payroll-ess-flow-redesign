import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row, Typography } from 'antd';

import ChartOfAccountModal from './ChartOfAccountModal';
import { refresh } from '../../types/accessCode';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    accessPermission: any;
    addAccountName?: string | null;
};

const ChartOfAccountHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    accessPermission,
    addAccountName = null,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(Boolean(addAccountName));
    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex>
                <Typography.Text />
            </Flex>
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                {accessPermission && accessPermission.write && (
                    <Button
                        type="primary"
                        className="w-full sm:w-fit"
                        danger
                        onClick={() => setOpenModal(true)}
                    >
                        Add Chart of Account
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
            {openModal && accessPermission?.write && (
                <ChartOfAccountModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                    initialName={addAccountName ?? ''}
                />
            )}
        </Row>
    );
};

export default ChartOfAccountHeader;
