import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { RolePermissionAccessData } from '../../types/internalAccountsTypes';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    setOpenModal: (open: boolean) => void;
    accessPermission?: RolePermissionAccessData;
};

const InternalAccountsHeader = ({ searchText, handleSearch, setOpenModal, accessPermission }: Props) => (
    <Row justify="end" className="w-full gap-5">
        <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
            {accessPermission && accessPermission.write && (
                <Button
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    onClick={() => setOpenModal(true)}
                >
                    Add Account
                </Button>
            )}
            <Input
                value={searchText}
                placeholder="Search For Accounts"
                suffix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                type="text"
                variant="outlined"
                className="w-full md:w-auto min-w-52"
                size="small"
                maxLength={100}
            />
        </Flex>
    </Row>
);

export default InternalAccountsHeader;
