import React, { useState } from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import SalaryCompModal from './SalaryCompModal';
import { useGetSalaryComponent } from '../../../hooks/OrganizationSettings/useGetCurrentSalaryCompApi';
import { useSalaryCompActions } from '../../../hooks/OrganizationSettings/useSalaryComponentApi';
import { salaryCompColumn } from '../../../utils/orgSettings/data';

interface Props {
    onHasBalancingComponentChange?: (hasBalancingComponent: boolean) => void;
}

const SalaryCompTable: React.FC<Props> = ({ onHasBalancingComponentChange }) => {
    const [openSalaryCompModal, setOpenSalaryCompModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [selectedRecordData, setSelectedRecordData] = useState<any | null>(null);
    const [reloadTable, setReloadTable] = useState(false);

    // The org's full, unpaginated component list — a company only ever has a handful of
    // earning components, so there's no pagination/search here, and this single call also
    // feeds the Balancing check and the "specific component" dropdown map below.
    const { data } = useGetSalaryComponent(reloadTable);

    const calculationBasedOnMap = data?.reduce(
        (acc, comp) => {
            acc[comp.id] = comp.componentName;
            return acc;
        },
        {} as Record<string, string>
    );
    const { deleteSalaryCompAction, isLoading: deleteLoader } = useSalaryCompActions(() =>
        setOpenConfirmationModal(false)
    );
    const handleEdit = async (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenSalaryCompModal(true);
    };
    const handleDelete = (selectedRowData: any) => {
        setSelectedRecordData(selectedRowData);
        setOpenConfirmationModal(true);
    };

    const handleDeleteSalaryComp = async () => {
        await deleteSalaryCompAction(selectedRecordData?.id!);
        setSelectedRecordData(null);
        setReloadTable(p => !p);
    };

    // A Balancing component (e.g. Special Allowances) is what absorbs the remainder of
    // Gross after Basic/HRA/fixed allowances — without one, an employee's earnings can
    // never be guaranteed to add up to their actual salary. Reported up to the parent panel
    // so the onboarding wizard's single "Next" button can gate on it.
    const hasBalancingComponent = Boolean(data?.some(component => component.calculationType === 'BALANCING'));
    React.useEffect(() => {
        onHasBalancingComponentChange?.(hasBalancingComponent);
    }, [hasBalancingComponent, onHasBalancingComponentChange]);

    const isEmployeeSpecific = false;
    return (
        <Row>
            <Col span={24}>
                <Flex justify="space-between" align="center" className="mb-4">
                    <Typography.Text className="font-medium text-[1.25rem]">Earnings</Typography.Text>
                    <Button
                        type="primary"
                        danger
                        onClick={() => {
                            setOpenSalaryCompModal(true);
                            setSelectedRecordData(null);
                        }}
                    >
                        Add Earning
                    </Button>
                </Flex>

                <GenericTable
                    rowKey={record => record.id}
                    columns={salaryCompColumn(handleEdit, handleDelete, calculationBasedOnMap)?.map((x)=>{
                        if(x.key==="action"){
                            x.width = ""
                        }
                        return x
                    })}
                    dataSource={data || []}
                    pagination={false}
                />
                {openSalaryCompModal && (
                    <SalaryCompModal
                        isEmployeeSpecific={isEmployeeSpecific}
                        open={openSalaryCompModal}
                        handleCancel={() => setOpenSalaryCompModal(false)}
                        selectedRecordData={selectedRecordData}
                        reloadTable={setReloadTable}
                    />
                )}
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this salary Component?"
                    handleSubmit={handleDeleteSalaryComp}
                    isLoading={deleteLoader}
                />
            </Col>
        </Row>
    );
};

export default SalaryCompTable;
