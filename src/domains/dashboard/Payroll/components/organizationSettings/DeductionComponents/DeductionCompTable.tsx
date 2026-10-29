import React, { useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import DeductionCompModal from './DeductionCompModal';
import { useDeductionActions } from '../../../hooks/OrganizationSettings/useDeductionComponentApi';
import { useGetAllDeductions } from '../../../hooks/OrganizationSettings/useGetDeductionComponentApi';
import { deductionCompColumn } from '../../../utils/orgSettings/data';

const DeductionCompTable: React.FC = () => {
    const [openDeductionCompModal, setOpenDeductionCompModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);
    const [reloadTable, setReloadTable] = useState(false);

    // A company only ever has a handful of deduction components, so there's no
    // pagination/search here — fetch everything in one page, same pattern already used by
    // CtcCalculatorPage/SalaryInfo/NewHireSteps/BulkUploadCreateModal. Provident Fund stays
    // hidden here (includePf=false) since it's driven by Compliance Settings, not this tab.
    const { data, tableLoading } = useGetAllDeductions(1, 100, '', reloadTable, false);

    const { deleteDeductionAction, isLoading: deleteLoader } = useDeductionActions(() =>
        setOpenConfirmationModal(false)
    );

    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenDeductionCompModal(true);
    };

    const handleDelete = (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };

    const handleDeleteDeductionComp = async () => {
        await deleteDeductionAction(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };

    return (
        <Row>
            <Col span={24}>
                <Flex justify="space-between" align="center" className="mb-4">
                    <Typography.Text className="font-medium text-[1.25rem]">Deductions</Typography.Text>
                    <Button
                        type="primary"
                        danger
                        onClick={() => {
                            setOpenDeductionCompModal(true);
                            setSelectedRecordData(null);
                        }}
                    >
                        Add Deduction
                    </Button>
                </Flex>
                <GenericTable
                    rowKey={record => record.id}
                    columns={deductionCompColumn(handleEdit, handleDelete)?.map(x => {
                        if (x.key === 'action') {
                            x.width = '';
                        }
                        return x;
                    })}
                    dataSource={data || []}
                    loading={tableLoading}
                    pagination={false}
                />
                {openDeductionCompModal && (
                    <DeductionCompModal
                        open={openDeductionCompModal}
                        handleCancel={() => setOpenDeductionCompModal(false)}
                        selectedRecordData={selectedRecordData}
                        reloadTable={setReloadTable}
                        isEmployeeSpecific={false}
                    />
                )}
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this deduction component?"
                    handleSubmit={handleDeleteDeductionComp}
                    isLoading={deleteLoader}
                />
            </Col>
        </Row>
    );
};

export default DeductionCompTable;
