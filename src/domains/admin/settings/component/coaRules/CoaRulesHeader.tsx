import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row, Typography } from 'antd';

import CoaRulesModal from './CoaRulesModal';
import { refresh } from '../../types/accessCode';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    accessPermission: any;
};
const CoaRulesHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    accessPermission,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
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
                        Add COA Rules
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
                <CoaRulesModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
        </Row>
    );
};

export default CoaRulesHeader;
