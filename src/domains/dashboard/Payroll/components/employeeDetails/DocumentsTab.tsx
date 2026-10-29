import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Row, Button, Col, Input } from 'antd';
import { useDispatch } from 'react-redux';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import { useDeleteDocumentApi } from '../../hooks/docAndAssetsHooks/useDocDeleteApi';
import useGetEmployeeDocument from '../../hooks/docAndAssetsHooks/useGetEmployeeDocument';
import { EmployeeDocument } from '../../types/type';
import { Documentcolumns } from '../../utils/employeeDetails/data';
import EmployeeDocumentModal from '../modals/EmployeeDocumentModal';




type Props = {
    isLoading: boolean;
    employeeData: any;
};

const DocumentsTab = ({
    isLoading,
    employeeData,
}: Props) => {
    const [selectedRowData, setSelectedRowData] = useState<EmployeeDocument | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [filter, setFilter] = useState({
        search: '',
    });
    const [openDocumentModal, setOpenDocumentModal] = useState(false);
    const [page, setPage] = useState(1)
    const dispatch = useDispatch()
    const { searchText, updateSearchText } = useDebounceSearch(setFilter)
    const { employeeDocs, docCount: count, getEmployeeDocuments,isLoading:isDocumentLoading } = useGetEmployeeDocument(employeeData.id, page, searchText)
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);





    const [eName, setEName] = useState<string | undefined>(undefined);
    const { deleteDocumentData, deleteLoader } = useDeleteDocumentApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const empId = employeeData && typeof employeeData !== 'boolean' ? employeeData.id : undefined;

    const HandleDelete = (selectedRow: any) => {
        setOpenConfirmationModal(true);

        setSelectedRowData(selectedRow);
    };

    const HandleEdit = (selectedRow: any) => {
        const name = employeeData.fullName;
        setEName(name);
        setOpenDocumentModal(true);
        setSelectedRowData(selectedRow);
    };


    const handleDeleteDoc = async () => {
        const documentId = selectedRowData?._id;
        const employeeId = employeeData.id;
        await deleteDocumentData(documentId, employeeId);
        await getEmployeeDocuments();
        dispatch(
            showToast({
                description: 'Document deleted successfully',
                variant: 'success',
            })
        );
        setOpenConfirmationModal(false);
        setSelectedRowData(null);
    };

    return (
        <>
            <Flex className="w-full px-10 gap-5" justify="end">
                <Input
                    placeholder="Search by name"
                    prefix={<SearchOutlined />}
                    allowClear
                    value={searchText}
                    onChange={updateSearchText}
                />
                <Button
                    type="default"
                    danger
                    onClick={() => {
                        setSelectedRowData(null);
                        setOpenDocumentModal(true);
                    }}
                >
                    Add Document
                </Button>
            </Flex>

            <Row className="ml-10">
                <Col className="pr-10" span={24}>
                    <GenericTable
                        scroll={{ x: 568 }}
                        className="mt-4"
                        columns={Documentcolumns(HandleDelete, HandleEdit, false)}
                        dataSource={employeeDocs}
                        loading={isDocumentLoading}
                        size="small"
                        rowKey="id"
                        pagination={{
                            total: count,
                            pageSize: 10,
                            current: page,
                            onChange: setPage,
                        }}
                    />
                </Col>
                {/* <Flex className="w-full pr-5" justify="end" align="end">
                    <Pagination
                        defaultPageSize={10}
                        total={count}
                        className="mt-4"
                        onChange={setCurrentPage}
                    />
                </Flex> */}
            </Row>
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="Are you sure you want to delete this document?"
                handleSubmit={handleDeleteDoc}
                isLoading={deleteLoader}
            />

            {openDocumentModal && (
                <EmployeeDocumentModal
                    open={openDocumentModal}
                    handleCancel={() => setOpenDocumentModal(false)}
                    setRefresh={() => { getEmployeeDocuments() }}
                    selectedRowData={selectedRowData}
                    employeeIdFromProfile={empId}
                    EmpName={eName}
                    employeeData={employeeData}
                />
            )}
        </>
    );
};

export default DocumentsTab;
