import { FormikProps, useFormikContext } from 'formik';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { DropDown } from '@customtypes/general';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import CorporateUserFormFields from './CorporateUserFormFields';
import useGeneralApi from '../hooks/useGeneralApi';
import userSchema from '../schema/index';
import { Data, updateData } from '../types/corporateUserTypes';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Data;
    updateCorporateUserData: (payload: updateData) => Promise<boolean>;
    kycStatus: DropDown | undefined;
    packageData: DropDown | undefined;
    handleRefresh?: (s: boolean) => void;
};

const EditCorporateUserDetails = ({
    open,
    handleCancel,
    data,
    updateCorporateUserData,
    kycStatus,
    packageData,
    handleRefresh,
}: DepartmentModalProps) => {
    const dispatch = useAppDispatch();
    const { stateData } = useGeneralApi();

    const { setFieldError }: FormikProps<any> = useFormikContext() ?? {};

    const initialValues = {
        id: data?.credentialId,
        activity: data?.activity || '',
        city: data?.city || '',
        email: data?.email || '',
        kycStatus: data?.kycStatus || '',
        mobileNo: data?.mobileNo || '',
        state: data?.state ?? undefined,
        name: data?.name || '',
        designation: data?.designation || '',
        username: data?.credential.username || '',
        contactPersonName: data?.contactPersonName || '',
        cinNumber: data?.cinNumber || '',
        gstNumber: data?.gstNumber || '',
        panNumber: data?.panNumber || '',
        gstVerified: !!data?.gstNumber,
        panVerified: !!data?.panNumber,
        cinVerified: !!data?.cinNumber,
        passwordProtection: data?.credential?.passwordProtection !== 0,
    };
    return (
        <CustomModalWithForm
            modalTitle="Corporate User Management"
            open={open}
            handleCancel={handleCancel}
            validationSchema={userSchema}
            handleFormSubmit={async value => {
                // if (!values.tradeLicenseExpiry) delete values.tradeLicenseExpiry;
                // if (!values.trnExpiry) delete values.trnExpiry;
                if (!value.activity) delete value.activity;
                if (!value.gstNumber) delete value.gstNumber;
                if (!value.cinNumber) delete value.cinNumber;
                if (!value.panNumber) delete value.panNumber;
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

                const allIdFieldsEmpty =
                    !value.activity &&
                    !value.cinDoc &&
                    !value.gstDoc &&
                    !value.panDoc &&
                    !value.designation &&
                    !value.state &&
                    !value.city;

                // Don't send OTP if all ID fields are empty and no other change was made
                if (allIdFieldsEmpty) {
                    handleCancel();
                    return;
                }
                const updatedValues = {
                    ...value,
                };

                const res: boolean = await updateCorporateUserData(updatedValues);

                if (res === true) {
                    dispatch(
                        showToast({
                            description: `Corporate user info updated successfully`,
                            variant: 'success',
                        })
                    );
                    handleCancel();
                }
                // on failure the ApiClient interceptor already toasts the server message
            }}
            initialValues={initialValues}
        >
            <CorporateUserFormFields
                data={data}
                stateData={stateData}
                kycStatus={kycStatus}
                handleRefresh={handleRefresh}
                handleCancelModal={handleCancel}
            />
        </CustomModalWithForm>
    );
};

export default EditCorporateUserDetails;
