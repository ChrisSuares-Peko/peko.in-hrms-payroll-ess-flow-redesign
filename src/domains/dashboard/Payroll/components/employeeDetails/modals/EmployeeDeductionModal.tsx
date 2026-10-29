import React from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useDeductionActions } from '../../../hooks/employeeProfileHooks/useEmployeeDeductionApi';
import { deductionCompFormSchema } from '../../../schema/organizationSettings';
import DeductionCompForm from '../forms/DeductionComponentForm';

interface DeductionCompModalProps {
    open: boolean;
    employeeId: string;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
}

const EmployeeDeductionCompModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeId,
}: DeductionCompModalProps) => {
    const { addDeductionAction, updateDeductionAction,isAdding,isUpdating } = useDeductionActions(handleCancel);

    const handleFormSubmit = async (values: any) => {
        if(values?.calculationType==="FIXED"){
            delete values?.salaryDeductionType
        }
        if (selectedRecordData) {
            if (selectedRecordData.isGlobal) {
                await addDeductionAction({
                    ...values,
                    eId: employeeId,
                    globalComponentId: selectedRecordData.id,
                });
            } else {
                await updateDeductionAction(values, selectedRecordData.id);
            }
        } else {
            await addDeductionAction({
                ...values,
                eId:employeeId,
            });
        }

        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Deduction' : 'Add New Deduction'}
            open={open}
            isLoading={selectedRecordData ? isUpdating : isAdding}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                deductionName: selectedRecordData?.deductionName || '',
                deductionType: selectedRecordData?.deductionType || '',
                calculationType: selectedRecordData?.calculationType || '',
                amountPercentage: selectedRecordData?.amountPercentage || '',
                calculationBasis: selectedRecordData?.calculationBasis || '',
                status: selectedRecordData?.status || '',
                applicabilityCriteria: selectedRecordData?.applicabilityCriteria || '',
                isGlobal:false,
                salaryDeductionType: selectedRecordData?.salaryDeductionType || '',
            }}
            validationSchema={deductionCompFormSchema}
        >
            <Flex vertical className="w-full">
                <DeductionCompForm selectedRecordData={selectedRecordData} />
            </Flex>
        </CustomModalWithForm>
    );
};

export default EmployeeDeductionCompModal;
