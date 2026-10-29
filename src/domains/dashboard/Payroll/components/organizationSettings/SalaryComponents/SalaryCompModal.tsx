import React from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';

import SalaryCompForm from './SalaryCompForm';
import { useSalaryCompActions } from '../../../hooks/OrganizationSettings/useSalaryComponentApi';
import { salaryCompFormSchema } from '../../../schema/organizationSettings';
import { resetState } from '../../../slices/orgSettings';

interface SalaryCompModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    isEmployeeSpecific: boolean;
}

const SalaryCompModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    isEmployeeSpecific,
}: SalaryCompModalProps) => {
    const dispatch = useAppDispatch();
    const {
        addSalaryCompAction,
        updateSalaryCompAction,
        addEmployeeSalaryCompAction,
        updateEmployeeSalaryCompAction,
        isAdding,
        isUpdating,
        isGeneralAdding,
        isGeneralUpdating,
    } = useSalaryCompActions(handleCancel);

    React.useEffect(() => {
        dispatch(resetState());
    }, [dispatch]);

    const modalLoading = React.useMemo(() => {
        if (selectedRecordData) {
            // UPDATE
            return isEmployeeSpecific ? isUpdating : isGeneralUpdating;
        }

        // ADD
        return isEmployeeSpecific ? isAdding : isGeneralAdding;
    }, [
        selectedRecordData,
        isEmployeeSpecific,
        isAdding,
        isUpdating,
        isGeneralAdding,
        isGeneralUpdating,
    ]);

    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            if (isEmployeeSpecific) {
                await updateEmployeeSalaryCompAction(
                    values,
                    selectedRecordData.id,
                    selectedRecordData.isGlobal
                );
            } else {
                
                await updateSalaryCompAction(values, selectedRecordData.id);
            }
        } else if (isEmployeeSpecific) {
            await addEmployeeSalaryCompAction(values);
        } else {
            await addSalaryCompAction(values);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Component' : 'Add New Component'}
            isLoading={modalLoading}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            reinitialise
            initialValues={{
                componentName: selectedRecordData?.componentName || '',
                calculationType: selectedRecordData?.calculationType || '',
                amountPercentage: selectedRecordData?.amountPercentage ?? '',
                calculationBasis: selectedRecordData?.calculationBasis || '',
                calculationBasedOn: selectedRecordData?.calculationBasedOn || '',
                status: selectedRecordData?.status || '',
            }}
            validationSchema={salaryCompFormSchema}
        >
            <Flex vertical className=" w-full">
                <SalaryCompForm selectedRecordData={selectedRecordData} />
            </Flex>
        </CustomModalWithForm>
    );
};

export default SalaryCompModal;
