import React from 'react';

import { Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import TDSForm from './TDSForm';
import { useAddLeave } from '../../hooks/leaveHooks/useAddLeaveApi';
import { useUpdateLeave } from '../../hooks/leaveHooks/useUpdateLeaveApi';
// import { leaveSchema } from '../../schema/employeeLeaveSchema';
import { LeaveRequestFormType, LeaveTableRow } from '../../types/leaveSection';

interface TDSModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: LeaveTableRow | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
}

const TDSModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: TDSModalProps) => {
    const { addLeaveData } = useAddLeave(handleCancel);
    const { updateLeavebyId } = useUpdateLeave(handleCancel);

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit TDS Deduction' : 'Add TDS Deduction'}
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
                year: '',
                month: '',
                employeeName: '',
                tdsAmount: '',
            }}
            //  validationSchema={leaveSchema}
        >
            <Flex vertical className=" w-full">
                <TDSForm
                    selectedRecordData={selectedRecordData}
                    employeeIdFromProfile={employeeIdFromProfile}
                    month={month}
                    year={year}
                />
            </Flex>
        </CustomModalWithForm>
    );
};

export default TDSModal;
