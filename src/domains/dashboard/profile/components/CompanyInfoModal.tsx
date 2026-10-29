import { useMemo, useState } from 'react';

import OtpModal from '@components/molecular/modals/OtpModal';
import { Scope } from '@src/enums/enums';
import { useAppSelector } from '@src/hooks/store';

import CompanyInfoModalWithForm from './modals/CompanyInfoModalWithForm';
import { getOtp } from '../api/general';
import useCompanyInfoApi from '../hooks/useCompanyInfoApi';
import { companyInfoSchema } from '../schema/index';
import { UpdateCompanyInfoRequestPayload } from '../types/index';

interface CompanyInfoModalProps {
    open: boolean;
    handleCancel: () => void;
}

const CompanyInfoModal = ({ open, handleCancel }: CompanyInfoModalProps) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { data } = useAppSelector(state => state.reducer.companyInfo);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const { handleUpdateCompanyInfo, isEditLoading } = useCompanyInfoApi({
        handleCancel,
        handleOtpClose: () => setIsOpen(false),
    });
    const [formValues, setFormValues] = useState<UpdateCompanyInfoRequestPayload>();
    const [isOpen, setIsOpen] = useState(false);

    const initialValues = useMemo(
        () => ({
            activity: data?.activity ?? '',
            cinNumber: data?.cinNumber ?? '',
            gstNumber: data?.gstNumber ?? '',
            panNumber: data?.panNumber ?? '',
            cinDoc: data?.cinDoc ?? '',
            gstDoc: data?.gstDoc ?? '',
            panDoc: data?.panDoc ?? '',
            gstVerified: !!data?.gstNumber,
            panVerified: !!data?.panNumber,
            cinVerified: !!data?.cinNumber,
        }),
        [data]
    );
    return (
        <>
            <CompanyInfoModalWithForm
                modalTitle="Company Information"
                open={open}
                handleCancel={handleCancel}
                validationSchema={companyInfoSchema}
                isLoading={isOtpSending}
                handleFormSubmit={async (value, { setFieldError }) => {
                    // Block unverified ID fields
                    let hasError = false;

                    if (value.gstNumber?.trim() && !value.gstVerified) {
                        setFieldError('gstNumber', 'GST number must be verified');
                        hasError = true;
                    }

                    if (value.panNumber?.trim() && !value.panVerified) {
                        setFieldError('panNumber', 'PAN must be verified');
                        hasError = true;
                    }

                    if (value.cinNumber?.trim() && !value.cinVerified) {
                        setFieldError('cinNumber', 'CIN must be verified');
                        hasError = true;
                    }

                    if (hasError) return;
                    const fieldsToCheck = ['activity', 'cinDoc', 'gstDoc', 'panDoc'] as const;
                    type FieldKey = (typeof fieldsToCheck)[number];

                    const hasRelevantChanges = fieldsToCheck.some(
                        (key: FieldKey) => initialValues[key] !== value[key]
                    );

                    const allIdFieldsEmpty =
                        !value.activity && !value.cinDoc && !value.gstDoc && !value.panDoc;

                    // Don't send OTP if all ID fields are empty and no other change was made
                    if (allIdFieldsEmpty || !hasRelevantChanges) {
                        handleCancel();
                        return;
                    }

                    // Send OTP
                    setFormValues(value);
                    setIsOtpSending(true);
                    const resp = await getOtp({
                        userId: id,
                        userType: role,
                    });
                    setIsOtpSending(false);
                    if (resp) {
                        setIsOpen(true);
                    }
                }}
                initialValues={initialValues}
                reinitialise
                maskClosable
                // isDisabled={!values.gstVerified || !values.panVerified} // ✅ Dynamically disable buttons based on real-time verification status
            />
            <OtpModal
                isOpen={isOpen}
                isLoading={isEditLoading!}
                handleCancel={() => setIsOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    const res = await getOtp({
                        userId: id,
                        userType: role,
                    });
                    if (res) setIsOtpSending(false);
                    else setIsOtpSending(false);
                }}
                handleSubmit={otp => {
                    handleUpdateCompanyInfo({
                        ...formValues!,
                        otp,
                        scope: Scope.EMAIL,
                        userId: id,
                        userType: role,
                    });
                }}
                title="Confirmation"
            />
        </>
    );
};

export default CompanyInfoModal;
