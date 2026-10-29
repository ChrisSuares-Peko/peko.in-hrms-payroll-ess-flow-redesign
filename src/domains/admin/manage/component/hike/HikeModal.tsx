import React, { useState } from 'react';

import { Flex, Form } from 'antd';
import { useDispatch } from 'react-redux';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import hikeCodeSchema from '@src/domains/admin/manage/schema/hikeSchema';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import { showToast } from '@src/slices/apiSlice';
import { amountBeforeCommission } from '@utils/priceFormat';

import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import UseCreateHike from '../../hooks/hike/useCreateHike';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}
const HikeModal = ({ handleCancel, open, setRefresh, data }: modalProps) => {
    const { createNewHike, isLoading, updateCurrentHike } = UseCreateHike();
    const [, setFile] = useState<any>('');
    const dispatch = useDispatch();
    const { partnerData } = usePartnersForCorporate('');
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Document Management"
            open={open}
            validationSchema={hikeCodeSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: any;
                const { partnerId, ...restValues } = values;
                const payload = {
                    ...restValues,
                    credentialId: partnerId,
                };
                if (data) {
                    res = await updateCurrentHike(payload);
                } else {
                    res = await createNewHike(payload);
                }

                if (res.status === true) {
                    dispatch(
                        showToast({
                            description: `${res.message} `,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                    handleCancel();
                }
                if (res.status === false) {
                    dispatch(
                        showToast({
                            description: `${res.message} `,
                            variant: 'error',
                        })
                    );
                }
            }}
            initialValues={{
                id: data?.id,
                name: data?.name || '',
                features: data?.features || '',
                logoBase: data?.logo || '',
                logoFormat: data?.logoFormat || '',
                partnersBase: data?.partners || '',
                partnersFormat: data?.partnersFormat || '',
                planType: data?.planType || '',
                amount: data?.amount
                    ? amountBeforeCommission(data.amount, data.totalCommission).toFixed(2)
                    : '0',
                salaryAmount: data?.salaryAmount || '',
                salaryValidation: data?.salaryValidation || '',
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: data?.commission || 0,
                fixedCommissionPerTransaction: data?.fixedCommissionPerTransaction || 0,
                isCommissionInclGST: data?.isCommissionInclGST ?? true,
                partnerId: Number(data?.credentialId) || '',
            }}
        >
            {() => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        {partnerData && (
                            <SelectInput
                                name="partnerId"
                                options={partnerData}
                                placeholder="Please select a partner"
                                label="Select Partner"
                                isRequired
                            />
                        )}
                        <TextInput
                            name="name"
                            label="Name"
                            type="text"
                            placeholder="Please enter name "
                            isRequired
                            classes=" rounded-sm"
                        />
                        <TextAreaInput
                            name="features"
                            label="Features"
                            placeholder="please enter features"
                            isRequired
                        />
                        <SelectInput
                            name="planType"
                            isRequired
                            options={[
                                { value: 'YEARLY', label: 'Yearly' },
                                { value: 'MONTHLY', label: 'Monthly' },
                            ]}
                            placeholder="Please select a plan type"
                            label="Plan Type"
                        />
                        <SelectInput
                            name="salaryValidation"
                            isRequired
                            options={[
                                { value: 'LESS_THAN', label: 'Less than' },
                                { value: 'GREATER_THAN', label: 'Greater than' },
                            ]}
                            placeholder="Please select a salary validation"
                            label="Salary Validation"
                        />
                        <TextInput
                            name="amount"
                            label="Amount"
                            type="text"
                            placeholder="Please enter amount "
                            isRequired
                            classes=" rounded-sm"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <TextInput
                            name="salaryAmount"
                            label="Salary Amount"
                            type="text"
                            placeholder="Please enter salary amount "
                            isRequired
                            classes=" rounded-sm"
                        />
                        <SelectInput
                            name="commissionMode"
                            isRequired
                            options={[
                                { value: 'MARGIN', label: 'Margin' },
                                { value: 'AGENT_MARKUP', label: 'Agent Markup' },
                                { value: 'PRINCIPAL_MARKUP', label: 'Principal Markup' },
                            ]}
                            placeholder="Please select commission mode"
                            label="Commission Mode"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <SelectInput
                            name="commissionType"
                            isRequired
                            options={[
                                { value: 'PERCENTAGE', label: 'Percentage' },
                                { value: 'FLAT', label: 'Flat' },
                            ]}
                            placeholder="Please select commission type"
                            label="Commission Type"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <TextInput
                            name="commission"
                            label="Commission"
                            type="text"
                            placeholder="Please enter commission"
                            isRequired
                            classes="rounded-sm"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <TextInput
                            name="fixedCommissionPerTransaction"
                            label="Fixed Commission Per Transaction"
                            type="text"
                            placeholder="Please enter fixed commission per transaction"
                            classes="rounded-sm"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <SwitchInput
                            name="isCommissionInclGST"
                            label="Commission Includes GST"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <CustomFileUploadInput
                            isRequired
                            name="logoBase"
                            label="Logo"
                            classes="rounded-sm"
                            format="logoFormat"
                            existingFileUrl={data?.logo}
                            showFileName
                            showNotification
                            setFile={setFile}
                        />

                        <CustomFileUploadInput
                            isRequired
                            name="partnersBase"
                            label="Partners Logo"
                            classes="rounded-sm"
                            existingFileUrl={data?.partners}
                            format="partnersFormat"
                            setFile={setFile}
                            showFileName
                            showNotification
                        />
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default HikeModal;
