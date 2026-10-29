import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    updatePersonalInfo,
    updateEmployeeInfo,
    updateSalaryInfo,
    updateDocumentInfo,
    updateBankInfo,
    createEmployeeInfo,
} from '../../api/employeeOnboarding/index';
import { setEmployeeId, setRefresh } from '../../slices/employeeSettings';

export default function useEmployeeInfoApi() {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const {
        refresh,
        id: employeeId,
        profileImage: existingProfileImage,
    } = useAppSelector(state => state.reducer.employeeSettings);
    const profileImage = useAppSelector(state => state.reducer.employee.imageDetails);
    const { progress, isSkippedDasboard, hasSalaryRolloutSetup } = useAppSelector(
        state => state.reducer.payrollAuth
    );
    // hasSalaryRolloutSetup reflects the NUPAY vendor's status independently of the wizard,
    // so it must not by itself route a still-onboarding user out of the wizard. Only an
    // explicit isSkippedDasboard (set by a real action inside the wizard) or a pre-existing
    // account (null = predates this field) should skip back to the normal employees list.
    const isLegacyExemptAccount = hasSalaryRolloutSetup === null;
    const isOnboardingInProgress = !isSkippedDasboard && !(progress === '100%' && isLegacyExemptAccount);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    // Method to update personal information
    const updatePersonalInformation = async (personalInfoPayload: any) => {
        const payload = {
            profileImage: profileImage?.profileImage?.base64
                ? {
                      base64: profileImage.profileImage.base64,
                      format: profileImage.profileImage.format,
                  }
                : existingProfileImage,
            personalInformation: {
                ...personalInfoPayload,
            },
            userId,
            userType,
            employeeId,
        };

        const res = await updatePersonalInfo(payload);

        if (res) {
            dispatch(
                showToast({
                    description: 'Personal information updated successfully',
                    variant: 'success',
                })
            );
            console.log(res, 'response here');

            dispatch(setEmployeeId(res.id));
            dispatch(setRefresh(!refresh));
        }
    };

    // Method to update employee information
    const updateEmployeeInformation = async (employeeInfoPayload: any) => {
        const payload = {
            profileImage: profileImage?.profileImage?.base64
                ? {
                      base64: profileImage.profileImage.base64,
                      format: profileImage.profileImage.format,
                  }
                : existingProfileImage,
            employeeInformation: {
                ...employeeInfoPayload,
            },
            userId,
            userType,
            employeeId,
        };
        const res = await updateEmployeeInfo(payload);

        if (res) {
            dispatch(
                showToast({
                    description: 'Employee information updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefresh(!refresh));
        }
    };

    // Method to update salary information
    const updateSalaryInformation = async (salaryInfoPayload: any) => {
        const payload = {
            profileImage: profileImage?.profileImage?.base64
                ? {
                      base64: profileImage.profileImage.base64,
                      format: profileImage.profileImage.format,
                  }
                : existingProfileImage,
            ...salaryInfoPayload,
            userId,
            userType,
            employeeId,
        };
        const res = await updateSalaryInfo(payload);

        if (res) {
            dispatch(
                showToast({
                    description: 'Salary information updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefresh(!refresh));
        }
    };

    // Method to update document information
    const updateDocumentInformation = async (docInfoPayload: any[]) => {
        const payload = {
            profileImage: profileImage?.profileImage?.base64
                ? {
                      base64: profileImage.profileImage.base64,
                      format: profileImage.profileImage.format,
                  }
                : existingProfileImage,
            employeeDocuments: docInfoPayload, // Ensure this is an array of documents
            userId,
            userType,
            employeeId,
        };

        const res = await updateDocumentInfo(payload);

        if (res) {
            dispatch(
                showToast({
                    description: 'Document information updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefresh(!refresh));
        }
    };

    // Method to update bank information
    const updateBankInformation = async (bankInfoPayload: any) => {
        const payload = {
            profileImage: profileImage?.profileImage?.base64
                ? {
                      base64: profileImage.profileImage.base64,
                      format: profileImage.profileImage.format,
                  }
                : existingProfileImage,
            bankDetails: {
                ...bankInfoPayload,
            },
            userId,
            userType,
            employeeId,
        };
        const res = await updateBankInfo(payload);

        if (res) {
            dispatch(
                showToast({
                    description: 'Bank information updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefresh(!refresh));
            navigate(
                `/${paths.payroll.index}/${paths.payroll.employees}/${paths.payroll.employeeAdded}`
            );
        }
    };
    // Success feedback (toast/navigate/cache invalidation) is deliberately NOT done here —
    // this only creates the Employee document itself; SalaryInfo.tsx's caller still has to
    // persist earnings/deductions and commit the initial CTC (revise-salary) afterward, and
    // that revise-salary call can legitimately fail (e.g. the entered CTC doesn't fit the
    // org's configured fixed/percentage components). Declaring success here — before any of
    // that has actually happened — is what let a rejected CTC look like "Employee added
    // successfully" while the employee was left with no real committed salary structure.
    // The caller now owns showing success/failure (and, via isOnboardingInProgress below,
    // where to redirect to) once the WHOLE sequence is known to have worked or not.
    const createEmployee = async (employeeDetails: any) => {
        const payload = {
            ...employeeDetails,
            userId,
            userType,
            employeeId,
        };

        return createEmployeeInfo(payload);
    };

    return {
        updatePersonalInformation,
        updateEmployeeInformation,
        updateSalaryInformation,
        updateDocumentInformation,
        updateBankInformation,
        createEmployee,
        isOnboardingInProgress,
    };
}
