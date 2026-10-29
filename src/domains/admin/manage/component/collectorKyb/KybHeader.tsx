import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Row, Button } from 'antd';

import { DownloadType } from '@customtypes/general';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    downloadReport: (type: string) => void;
};
const KybHeader = ({ searchText, handleSearch, setRefresh, downloadReport }: Props) => (
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
        {/* {openModal && (
            <Edocmodal
                open={openModal}
                handleCancel={() => setOpenModal(false)}
                setRefresh={setRefresh}
            />
        )} */}
    </Row>
);

export default KybHeader;
