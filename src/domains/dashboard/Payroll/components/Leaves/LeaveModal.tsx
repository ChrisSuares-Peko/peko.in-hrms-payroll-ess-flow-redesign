/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';

import { Flex } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import LeaveForm from './LeaveForm';
import { useAddLeave } from '../../hooks/leaveHooks/useAddLeaveApi';
import { useUpdateLeave } from '../../hooks/leaveHooks/useUpdateLeaveApi';
import { useAvailableLeavePoliciesApi } from '../../hooks/leavesAndAttendanceHooks/useAvailableLeavePoliciesApi';
import { leaveSchema } from '../../schema/employeeLeaveSchema';
import { LeaveRequestFormType, LeaveTableRow } from '../../types/leaveSection';


interface LeaveModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: LeaveTableRow | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    month?: number;
    year?: number;
}

const LeaveModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeIdFromProfile,
    month,
    year,
}: LeaveModalProps) => {
    // console.log("selectedRecordData?.typeOfLeave?.leaveType",selectedRecordData)
    const { addLeaveData ,isAddLoading} = useAddLeave(handleCancel);
    const { updateLeavebyId , isUpdateLoading } = useUpdateLeave(handleCancel);
    const [isModalOpen,setIsModalOpen] = useState(false)
    const [openConfirmationModal, setOpenConfirmationModal] = useState<any>(false);

    const { getLeave, leaves } = useAvailableLeavePoliciesApi(Boolean(selectedRecordData?.employeeId));

    useEffect(() => {
        if (selectedRecordData) {
            getLeave(selectedRecordData.employeeId)
        }
    }, [selectedRecordData]);

    useEffect(() => {
        console.log("leaves",selectedRecordData)
        if(leaves.length>0 && selectedRecordData){
            setIsModalOpen(open)
        }else if( !selectedRecordData){
            setIsModalOpen(open)
        }
    }, [open,leaves,selectedRecordData]);

    const handleFormSubmit = async () => {
                 if (selectedRecordData) {
                    await updateLeavebyId(openConfirmationModal, selectedRecordData);
                } else {
                    await addLeaveData(openConfirmationModal);
                }
            }

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Leave' : 'Add Leave'}
            open={isModalOpen}
            isLoading={selectedRecordData ? isUpdateLoading : isAddLoading}
            handleCancel={handleCancel}
            validateOnChange
            handleFormSubmit={async (values: LeaveRequestFormType & {undefined:any,typeOfLeaveValue:any}) => {
                const payload = {...values}
                if(values.undefined){
                    delete payload.undefined
                }
                if(values.typeOfLeaveValue){
                    delete payload.typeOfLeaveValue
                }
                const duration = parseFloat(payload.leaveCount);
                const startDate = new Date(payload.start);
                const endDate = new Date(payload.end);
                const diffMs = endDate.getTime() - startDate.getTime();
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
                if (days !== Math.ceil(duration)) {
                    setOpenConfirmationModal(values)
                    return;
                }
                if (selectedRecordData) {
                    await updateLeavebyId(payload, selectedRecordData);
                } else {
                    await addLeaveData(payload);
                }
                if (reloadTable) reloadTable(p => !p);
            }}
            initialValues={{
                employeeId: selectedRecordData?.employeeId || employeeIdFromProfile || '',
                typeOfLeave: selectedRecordData?.leaveType?._id|| '',
                leaveCount: selectedRecordData?.totalDays || 1,
                halfDaySelection:selectedRecordData?.halfDaySelection || "",
                start: selectedRecordData?.from || '',
                end: selectedRecordData?.to || '',
                leaveSupportingDocs: '',
                supportingDocFormat: '',
                typeOfLeaveValue:selectedRecordData?.leaveType?.typeOfLeave || '',
            }}
            validationSchema={leaveSchema}
            
            >
            <Flex vertical className=" w-full">
                <LeaveForm
                    selectedRecordData={selectedRecordData}
                    employeeIdFromProfile={employeeIdFromProfile}
                    month={month}
                    year={year}
                    getLeave={getLeave}
                    leaves={leaves}
                    />
            </Flex>
            <ConfirmationModal
                isOpen={openConfirmationModal}
                handleCancel={() => setOpenConfirmationModal(false)}
                title="The duration does not match the start and end date. Are you sure you want  to add the leave?"
                handleSubmit={handleFormSubmit}
                isLoading={isUpdateLoading || isAddLoading}
                />
        </CustomModalWithForm>
    );
};

export default LeaveModal;
