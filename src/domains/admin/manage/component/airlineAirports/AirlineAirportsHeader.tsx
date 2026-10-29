import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Row } from 'antd';

import AirlineAirportModal from './AirlineAirportModal';

interface Props {
    searchText: string;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    onAdd: (values: any) => void;
    isLoading: boolean;
    accessPermission: any;
}

const AirlineAirportsHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    onAdd,
    isLoading,
    accessPermission,
}: Props) => {
    const [openModal, setOpenModal] = useState(false);

    return (
        <Row justify="end" className="w-full gap-5">
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                {/* {accessPermission?.write && (
                    <Button
                        type="primary"
                        danger
                        className="w-full sm:w-fit"
                        onClick={() => setOpenModal(true)}
                    >
                        Add Airport
                    </Button>
                )} */}
                <Input
                    value={searchText}
                    placeholder="Search airports"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
            {openModal && (
                <AirlineAirportModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    mode="add"
                    onSave={values => {
                        onAdd(values);
                        setOpenModal(false);
                    }}
                    isLoading={isLoading}
                />
            )}
        </Row>
    );
};

export default AirlineAirportsHeader;
