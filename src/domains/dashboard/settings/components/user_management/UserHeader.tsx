import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Row } from 'antd';

import UserModal from './UserModal';
import { SubCorporateQueryParams } from '../../types/userManagement';

interface UserHeaderProps {
    filters: SubCorporateQueryParams;
    reloadTable: () => void;
    handleSearch: (searchText: string) => void;
}

const UserHeader = ({ filters, handleSearch, reloadTable }: UserHeaderProps) => {
    const [openModal, setOpenModal] = useState(false);
    const [searchInput, setSearchInput] = useState(filters.searchText);
    const removeEmojis = (str: any) =>
        str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = removeEmojis(e.target.value);
        setSearchInput(value);
        handleSearch(value); // debounced search function
    };
    return (
        <Row gutter={[20, 20]} justify="end">
            <Col xs={24} sm={12} md={10}>
                <Flex gap={30}>
                    <Input
                        value={searchInput}
                        placeholder="Search user"
                        suffix={<SearchOutlined />}
                        onChange={handleInputChange}
                        allowClear
                        type="text"
                        variant="outlined"
                        maxLength={50}
                        aria-label="Search for a user"
                    />
                    <Button
                        type="primary"
                        className="w-1/2"
                        danger
                        onClick={() => setOpenModal(true)}
                        aria-label="Invite a new user"
                    >
                        Invite User
                    </Button>
                </Flex>
            </Col>

            {openModal && (
                <UserModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    reloadTable={reloadTable}
                />
            )}
        </Row>
    );
};

export default UserHeader;
