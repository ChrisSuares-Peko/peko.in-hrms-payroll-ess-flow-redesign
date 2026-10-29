import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Pagination, Flex, Button, Row, Col, Input, Select } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import { useDeleteAssetApi } from '../../hooks/docAndAssetsHooks/useAssetDeleteApi';
import { useGetAssetListingType } from '../../hooks/docAndAssetsHooks/useGetAssetTypesApi';
import GetEmployeeDocuments from '../../hooks/employeeHooks/useGetDocAndAssetApi';
import { assetTable } from '../../types/docAndAssetsTypes';
import { statusType } from '../../utils/docAndAssets/data';
import { Assetcolumns } from '../../utils/employeeDetails/data';
import useAssetFilter from '../../utils/general/useAssetFilter';
import AssetsModal from '../modals/AssetsModal';

type Props = {
    isLoading: boolean;

    employeeData: any;
};

const AssetsTab = ({ isLoading, employeeData }: Props) => {
    console.log(employeeData, 'employeeData');
    const [selectedRowData, setSelectedRowData] = useState<assetTable | null>(null);
    const [openAssetModal, setOpenAssetModal] = useState(false);
    // const [currentPage, setCurrentPage] = useState<number>(1);
    const [showEmployeeName] = useState(true);

    // const [assetType, setAssetTypeState] = useState('');
    // const [assetStatus, setAssetStatusState] = useState('');
    const [filter, setFilter] = useState({
        searchText: '',
        assetType: '',
        assetStatus: '',
        page: 1,
        limit: 10,
    });
    const { setRefresh, assetCount, assetData,isLoading:isAssetLoading } = GetEmployeeDocuments(
        employeeData?.id,
        filter.page,
        filter.searchText,
        filter.assetType,
        filter.assetStatus
    );
    const { handleAssetTypeChange, handleStatusChange, handlePagination } =
        useAssetFilter({ setFilter });
    const { searchText, updateSearchText } = useDebounceSearch(setFilter);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [eId, setEId] = useState<string | undefined>(undefined);
    const [eName, setEName] = useState<string | undefined>(undefined);
    const { assetTypes } = useGetAssetListingType();
    const { deleteAssetData, deleteLoader } = useDeleteAssetApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });
    const HandleDelete = (selectedRow: assetTable) => {
        setOpenConfirmationModal(true);
        setSelectedRowData(selectedRow);
    };

    const HandleEdit = (selectedRow: assetTable) => {
        setOpenAssetModal(true);
        setSelectedRowData(selectedRow);
        const employeeId = employeeData._id;
        setEId(employeeId);

        setEName(employeeData.fullName);
    };
    const handleDeleteAsset = async () => {
        await deleteAssetData(selectedRowData?.id);
        setSelectedRowData(null);
        setRefresh((p: any) => !p);
    };

    return (
        <>
            <Row gutter={[10, 10]}>
                <Col md={6} sm={12} xs={12}>
                    <Select
                        size="middle"
                        onChange={handleAssetTypeChange}
                        value={filter.assetType}
                        defaultValue="All"
                        className="w-full md:text-base sm:text-sm"
                        options={[
                            {
                                value: '',
                                label: 'All',
                            },
                            ...assetTypes,
                        ]}
                    />
                </Col>
                <Col md={6} sm={12} xs={12}>
                    <Select
                        size="middle"
                        onChange={handleStatusChange}
                        value={filter.assetStatus}
                        defaultValue="All"
                        className="w-full md:text-base sm:text-sm"
                        options={[
                            {
                                value: '',
                                label: 'All',
                            },
                            ...statusType,
                        ]}
                    />
                </Col>
                <Col md={8} sm={12} xs={12}>
                    <Input
                        placeholder="Search Assets"
                        className="w-full"
                        value={searchText}
                        onChange={updateSearchText}
                        addonAfter={<SearchOutlined className="text-gray-500" />}
                    />
                </Col>
                <Col md={3} sm={12} xs={12}>
                    <Button
                        type="default"
                        danger
                        onClick={() => {
                            setSelectedRowData(null);
                            setOpenAssetModal(true);
                        }}
                        className='w-full'
                    >
                        Add Asset
                    </Button>
                </Col>
            </Row>
                <Col className="pr-10" span={24}>
                    <GenericTable
                        className="mt-4"
                        columns={Assetcolumns(HandleDelete, HandleEdit)}
                        dataSource={assetData}
                        loading={isAssetLoading}
                        size="small"
                        pagination={false}
                    />
                </Col>
                <Flex className="w-full pr-5" justify="end" align="end">
                    <Pagination
                        defaultPageSize={10}
                        current={filter.page}
                        total={assetCount}
                        className="mt-4"
                        onChange={handlePagination}
                    />
                </Flex>
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this asset?"
                handleSubmit={handleDeleteAsset}
                isLoading={deleteLoader}
            />

            {openAssetModal && (
                <AssetsModal
                    open={openAssetModal}
                    handleCancel={() => setOpenAssetModal(false)}
                    setRefresh={setRefresh}
                    selectedRowData={selectedRowData}
                    employeeIdFromProfile={eId}
                    EmpName={eName}
                    hideEmployeeDropdown={showEmployeeName}
                    employeeData={employeeData}
                />
            )}
        </>
    );
};

export default AssetsTab;
