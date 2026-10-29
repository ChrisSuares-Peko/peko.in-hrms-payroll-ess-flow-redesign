import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Row } from 'antd';

import { DownloadType } from '@customtypes/general';

import { RolePermissionAccessData } from '../../types/legalTemplates';

type Props = {
    handleSearch: (e: any) => void;
    handleChangeFilters: (e: any) => void;
    setSearchText: (e: any) => void;
    searchText: string;
    setOpenModal: () => void;
    accessPermission: RolePermissionAccessData | undefined;
    downloadReport?: (type: string) => void;
};

const LegalTemplatesHeader = ({
    searchText,
    handleSearch,
    setOpenModal,
    accessPermission,
    downloadReport,
    handleChangeFilters: _handleChangeFilters,
    setSearchText: _setSearchText,
}: Props) => (
    <Row justify="space-between" className="w-full gap-5">
        <Flex className="flex justify-start gap-3">
            <Button danger onClick={() => downloadReport?.(DownloadType.Excel)}>
                Excel
            </Button>
            <Button danger onClick={() => downloadReport?.(DownloadType.Csv)}>
                CSV
            </Button>
            <Button danger onClick={() => downloadReport?.(DownloadType.Pdf)}>
                PDF
            </Button>
        </Flex>
        <Flex className="flex-col justify-end w-full gap-3 px-0 md:flex-row md:w-auto">
            {accessPermission && accessPermission.write && (
                <Button type="primary" danger className="w-full sm:w-fit" onClick={setOpenModal}>
                    Add Template
                </Button>
            )}
            <Input
                value={searchText}
                placeholder="Search Templates"
                suffix={<SearchOutlined />}
                onChange={handleSearch}
                allowClear
                type="text"
                variant="outlined"
                maxLength={100}
            />
        </Flex>
    </Row>
);

export default LegalTemplatesHeader;
