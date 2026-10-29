import React from 'react';

import { Flex, Form } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import ProfessionalTaxForm from './ProfessionalTaxForm';
import { useAddLeave } from '../../hooks/leaveHooks/useAddLeaveApi';
import { useUpdateLeave } from '../../hooks/leaveHooks/useUpdateLeaveApi';
import { LeaveRequestFormType, LeaveTableRow } from '../../types/leaveSection';

interface ProfessionalTaxModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: LeaveTableRow | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
}

const ProfessionalTaxModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: ProfessionalTaxModalProps) => {
    const { addLeaveData } = useAddLeave(handleCancel);
    const { updateLeavebyId } = useUpdateLeave(handleCancel);

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Professional Tax' : 'Professional Tax'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async (values: LeaveRequestFormType) => {
                if (selectedRecordData) {
                    await updateLeavebyId(values, selectedRecordData);
                } else {
                    await addLeaveData(values);
                }
                if (reloadTable) reloadTable(p => !p);
            }}
            initialValues={{
                additionalSlab: [
                    {
                        startRange: '',
                        endRange: '',
                        taxAmount: '',
                    },
                ],
            }}
            // validationSchema={leaveSchema}
        >
            {({ values }) => (
                <Form layout="vertical">
                    <Flex vertical className="w-full">
                        <ProfessionalTaxForm additionalSlab={values.additionalSlab} />
                    </Flex>
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default ProfessionalTaxModal;
