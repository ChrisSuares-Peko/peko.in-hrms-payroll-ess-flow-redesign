import { useMemo, useState } from 'react';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import OtpModal from '@components/molecular/modals/OtpModal';
import { Scope } from '@src/enums/enums';
import { useAppSelector } from '@src/hooks/store';

import BasicInfoForm from './forms/BasicInfoForm';
import MobileOtpModal from './MobileOtpModal';
import { getOtp, getOtpSms } from '../api/general';
import useGeneralApi from '../hooks/useGeneralApi';
import useManageBasicInfo from '../hooks/useManageBasicInfo';
import { basicInfoSchema } from '../schema/index';
import { UpdateBasicInfoRequestPayload } from '../types/index';

interface BasicInfoModalProps {
    open: boolean;
    handleCancel: () => void;
}

const BasicInfoModal = ({ open, handleCancel }: BasicInfoModalProps) => {
    const { data } = useAppSelector(state => state.reducer.basicInfo);
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { companySizesList, statesList } = useGeneralApi();
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [changingPhoneNumber, setChangingPhoneNumber] = useState(false);
    const [loading, setLoading] = useState(false);

    const { handleUpdateBasicInfo, isEditLoading } = useManageBasicInfo({
        handleCancel,
        handleOtpClose: () => setIsOpen(false),
    });
    const [formValues, setFormValues] = useState<UpdateBasicInfoRequestPayload>();
    const [isOpen, setIsOpen] = useState(false);

    const initialValues = useMemo(
        () => ({
            name: data?.name ?? '',
            mobileNo: data?.mobileNo ?? '',
            email: data?.email ?? '',
            designation: data?.designation ?? '',
            contactPersonName: data?.contactPersonName ?? '',
            accountNumber: data?.credential?.username ?? '',
            city: data?.city ?? '',
            state: data?.state ?? undefined,
            companySize: data?.companySize ?? undefined,
            landlineNo: data?.landlineNo ?? '',
            profileImageBase: data?.logo ?? '',
        }),
        [data]
    );
    const handleFormSubmit = async (values: any) => {
        setLoading(true);
        setFormValues(values);
        if (JSON.stringify(initialValues) === JSON.stringify(values)) {
            handleCancel();
            return;
        }
        let resp;
        if (data?.mobileNo !== values.mobileNo) {
            setChangingPhoneNumber(true);
            resp = await getOtpSms({ userId: id, userType: role, newMobileNo: values.mobileNo });
        } else {
            setChangingPhoneNumber(false);
            resp = await getOtp({ userId: id, userType: role });
        }

        if (resp) {
            setIsOpen(true);
        }
        setLoading(false);
    };
    return (
        <>
            <CustomModalWithForm
                modalTitle="Basic Information"
                open={open}
                isLoading={loading}
                handleCancel={() => {
                    setLoading(false);
                    handleCancel();
                }}
                validationSchema={basicInfoSchema}
                handleFormSubmit={handleFormSubmit}
                initialValues={initialValues}
                reinitialise
                maskClosable
            >
                <BasicInfoForm companySizesList={companySizesList!} statesList={statesList!} />
            </CustomModalWithForm>
            {changingPhoneNumber ? (
                <MobileOtpModal
                    isOpen={isOpen}
                    isLoading={isEditLoading!}
                    handleCancel={() => setIsOpen(false)}
                    isOtpSending={isOtpSending}
                    onResend={async () => {
                        setIsOtpSending(true);
                        await getOtp({
                            userId: id,
                            userType: role,
                        });
                        setIsOtpSending(false);
                    }}
                    handleSubmit={otp => {
                        handleUpdateBasicInfo({
                            ...formValues!,
                            otp,
                            scope: Scope.MOBILE,
                            userId: id,
                            userType: role,
                        });
                    }}
                    title="Confirmation"
                />
            ) : (
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
                        handleUpdateBasicInfo({
                            ...formValues!,
                            otp,
                            scope: Scope.EMAIL,
                            userId: id,
                            userType: role,
                        });
                    }}
                    title="Confirmation"
                />
            )}
        </>
    );
};

export default BasicInfoModal;
