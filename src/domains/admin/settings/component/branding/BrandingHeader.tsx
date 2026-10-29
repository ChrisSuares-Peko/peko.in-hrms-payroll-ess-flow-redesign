import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

import { refresh } from '../../types/partnerPermission';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    handleDownloadReport: (type: string) => void;
};

const BrandingHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    handleDownloadReport,
}: Props & refresh) => (
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
            <Input
                value={searchText}
                placeholder="Search "
                suffix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                type="text"
                variant="outlined"
                className="xl:w-52"
            />
        </Flex>
    </Row>
);
export default BrandingHeader;
