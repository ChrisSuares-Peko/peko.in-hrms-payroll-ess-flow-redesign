import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Input, Row } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { useDeleteLeaveApi } from '../../hooks/leaveHooks/useLeaveDeleteApi';
import { LeaveTableRow } from '../../types/leaveSection';
import { LeaveSummaryRow } from '../../types/leaveSection/leaveprofiletypes';
import { getLeaveSummaryColumns } from '../../utils/leaveSummary/leaveSummaryColumns';
import LeaveModal from '../Leaves/LeaveModal';

interface LeaveSummaryTableProps {
    data: LeaveSummaryRow[];
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    eId?: string;
    setReloadTable: React.Dispatch<React.SetStateAction<boolean>>;
    searchText?:string
    isloading?:boolean
}

const LeaveSummaryTable: React.FC<LeaveSummaryTableProps> = ({
    data,
    handleSearch,
    eId,
    setReloadTable,
    searchText,
    isloading
}) => {
    const [selectedRecordData, setSelectedRecordData] = useState<LeaveTableRow | null>(null);
    const [openLeaveModal, setOpenLeaveModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const { deleteLeaveData, isLoading: deleteLoader } = useDeleteLeaveApi({
        handleCancel: () => setOpenConfirmationModal(false),
    });

    const handleEdit = async (selectedRowData: LeaveTableRow) => {
        console.log('handle edit worked', selectedRowData);
        setSelectedRecordData(selectedRowData);
        setOpenLeaveModal(true);
    };
const handleDelete = (selectedRowData: LeaveTableRow) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };
    const handleDeleteLeave = async () => {
         console.log('handle delete worked', selectedRecordData);
       
       
        const res = await deleteLeaveData(selectedRecordData?.id!);
        if (res) {
            setSelectedRecordData(null);
        }
        setReloadTable(p => !p);
    };

    return (
        <>
            <Row gutter={[10, 20]} className="">
                <Col md={24} xs={24} sm={24} className="md:mb-5 md:mt-5 w-full">
                    <Input
                        placeholder="Search by leave type"
                        suffix={<SearchOutlined />}
                        allowClear
                        onChange={e => {
                            const value = e.target.value.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
                            handleSearch({ ...e, target: { ...e.target, value } });
                        }}
                        value={searchText}
                        // onChange={handleSearch}
                    />
                </Col>
                {/* <Col md={2} xs={24} sm={24} className="md:mt-5 mb-5 w-full">
                    <Button
                        onClick={() => {
                            setSelectedRecordData(null);
                            setOpenLeaveModal(true);
                        }}
                        danger
                        type="primary"
                    >
                        Add Leave
                    </Button>
                </Col> */}
            </Row>
            {/* <Row className="mb-4 mt-2">
                <Col md={24}>
                    <Tag
                        style={{
                            width: '100%',
                            backgroundColor: '#F6FFED',
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            paddingInline: 12,
                            gap: 20,
                        }}
                    >
                        <ReactSVG
                            src={calendarCheckIcon}
                            style={{ height: 14, width: 14 }}
                            className="-mt-2"
                        />
                        <Typography.Text style={{ color: '#000' }}>
                            Leave Balance: <BoldText text="8 Days" />
                        </Typography.Text>
                    </Tag>
                </Col>
            </Row> */}
            <GenericTable
                columns={getLeaveSummaryColumns(
                    handleDelete,
                    handleEdit,
                   
                )}
                dataSource={data}
                loading={isloading}
            />
            {openLeaveModal && (
                <LeaveModal
                    open={openLeaveModal}
                    handleCancel={() => setOpenLeaveModal(false)}
                    selectedRecordData={{...selectedRecordData,employeeId:eId as string} as any}
                    reloadTable={setReloadTable}
                    employeeIdFromProfile={eId}
                />
            )}
            {openConfirmationModal && (
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this Leave?"
                    handleSubmit={handleDeleteLeave}
                    isLoading={deleteLoader}
                />
            )}
        </>
    );
};

export default LeaveSummaryTable;
