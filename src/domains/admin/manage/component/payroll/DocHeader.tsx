import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import CategoryModal from './CategoryModal';
import DocModal from './DocModal';
import { refresh } from '../../types/edocTypes';
import { DownloadType } from '../../types/payrollDocTypes';

type Props = {
    handleSearch: (e: any) => void;
    searchText: string;
    downloadReport: (type: DownloadType) => void;
    bufferLoading: DownloadType | null;
};

const DocHeader = ({
    searchText,
    handleSearch,
    setRefresh,
    downloadReport,
    bufferLoading,
}: Props & refresh) => {
    const [openModal, setOpenModal] = useState(false);
    const [openCatModal, setCatOpenModal] = useState(false);

    return (
        <Row justify="space-between" className="w-full gap-5">
            <Flex className="flex justify-start gap-3">
                <Button
                    loading={bufferLoading === DownloadType.Excel}
                    danger
                    onClick={() => downloadReport(DownloadType.Excel)}
                >
                    Excel
                </Button>
                <Button
                    danger
                    loading={bufferLoading === DownloadType.Csv}
                    onClick={() => downloadReport(DownloadType.Csv)}
                >
                    CSV
                </Button>
                <Button
                    danger
                    loading={bufferLoading === DownloadType.Pdf}
                    onClick={() => downloadReport(DownloadType.Pdf)}
                >
                    PDF
                </Button>
            </Flex>
            <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
                <Button
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    onClick={() => setCatOpenModal(true)}
                >
                    Add New Category
                </Button>
                <Button
                    type="primary"
                    className="w-full sm:w-fit"
                    danger
                    onClick={() => setOpenModal(true)}
                >
                    Add New Document
                </Button>

                <Input
                    value={searchText}
                    placeholder="Search by document name"
                    suffix={<SearchOutlined />}
                    onChange={handleSearch}
                    allowClear
                    type="text"
                    variant="outlined"
                    maxLength={100}
                />
            </Flex>
            {openModal && (
                <DocModal
                    open={openModal}
                    handleCancel={() => setOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
            {openCatModal && (
                <CategoryModal
                    open={openCatModal}
                    handleCancel={() => setCatOpenModal(false)}
                    setRefresh={setRefresh}
                />
            )}
        </Row>
    );
};
export default DocHeader;
