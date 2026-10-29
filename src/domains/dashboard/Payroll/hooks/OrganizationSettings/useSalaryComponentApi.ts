import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createSalaryComponent,
    updateSalaryComponent,
    deleteSalaryComponent,
    createEmployeeSalaryComponent,
    updateEmployeeSalaryComponent,
} from '../../api/organizationSettings/index';
import { setRefreshBasicSalary, setRefreshSalaryComp } from '../../slices/orgSettings';
import {
    createSalaryComponentPayload,
    updateSalaryCompoentPayload,
} from '../../types/organizationSettings';

export function useSalaryCompActions(handleCancel?: () => void) {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const { personalInformation } = useAppSelector(state => state.reducer.employeeSettings);
    const { refreshBasicSalary, refreshSalaryComp } = useAppSelector(
        state => state.reducer.orgSettings
    );
    const dispatch = useAppDispatch();
    const [salaryCompDetails, setSalaryCompDetails] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isGeneralAdding, setIsGeneralAdding] = useState(false);
    const [isGeneralUpdating, setIsGeneralUpdating] = useState(false);

    const email = personalInformation?.email;

    // Helper function to build the payload based on calculation type
    const buildPayload = (values: any) => {
        const { calculationType, amountPercentage, calculationBasis, calculationBasedOn, ...rest } = values;
        if (calculationType === 'FIXED') {
            return {
                ...rest,
                calculationType,
                amountPercentage,
            };
        }
        if (calculationType === 'PERCENTAGE') {
            return {
                ...rest,
                calculationType,
                amountPercentage,
                calculationBasis,
                ...(calculationBasis === 'COMPONENT' ? { calculationBasedOn } : {}),
            };
        }
        if (calculationType === 'BALANCING') {
            // Balancing components have nothing to configure beyond name/status —
            // amountPercentage/calculationBasis/calculationBasedOn don't apply, and an
            // empty string would fail the backend's calculationBasis enum validation.
            return {
                ...rest,
                calculationType,
            };
        }
        return { ...values };
    };
    const createPayload = (
        values: updateSalaryCompoentPayload,
        compId: string,
        isGlobal: boolean
    ) => {
        const finalPayload = buildPayload(values);
        const conditionalPayload = isGlobal ? { globalComponentId: compId } : { id: compId };

        return {
            ...finalPayload,
            ...conditionalPayload,
            employeeEmail: email,
            userType: role,
            userId,
        };
    };
    // Add salary component action
    const addSalaryCompAction = async (payload: createSalaryComponentPayload) => {
        const finalPayload = buildPayload(payload);
        setIsGeneralAdding(true);
        const data = await createSalaryComponent({
            ...finalPayload,
            userId,
            userType: role,
        });

        if (data) {
            dispatch(
                showToast({
                    description: 'Salary component added successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefreshBasicSalary(!refreshBasicSalary));
            dispatch(setRefreshSalaryComp(!refreshSalaryComp));
            if (handleCancel) handleCancel();
        }
        setIsGeneralAdding(false);
        return data;
    };

    // Update salary component action
    const updateSalaryCompAction = async (values: updateSalaryCompoentPayload, compId: string) => {
        const payload = {
            ...buildPayload(values),
            id: compId,
            userId,
            userType: role,
        };
        setIsGeneralUpdating(true);
        const data = await updateSalaryComponent(payload);

        if (data) {
            handleCancel?.();
            dispatch(
                showToast({
                    description: 'Salary component updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefreshBasicSalary(!refreshBasicSalary));
            dispatch(setRefreshSalaryComp(!refreshSalaryComp));
        }
        setIsGeneralUpdating(false);
        return data;
    };
    const addEmployeeSalaryCompAction = async (
        payload: createSalaryComponentPayload,
        employeeId?: string
    ) => {
        const finalPayload = buildPayload(payload);
        setIsAdding(true);
        console.log("create calledd")
        const data = await createEmployeeSalaryComponent({
            ...finalPayload,
            employeeEmail: email,
            employee: employeeId,
            userId,
            userType: role,
        });

        if (data) {
            dispatch(
                showToast({
                    description: 'Salary component added successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefreshBasicSalary(!refreshBasicSalary));
            dispatch(setRefreshSalaryComp(!refreshSalaryComp));
            if (handleCancel) handleCancel();
        }
        setIsAdding(false);
        return data;
    };

    // Update salary component action
    const updateEmployeeSalaryCompAction = async (
        values: updateSalaryCompoentPayload,
        compId: string,
        isGlobal: boolean,
        employeeId?: string
    ) => {
        const payload = createPayload(values, compId, isGlobal);
        setIsUpdating(true);
        const data = await updateEmployeeSalaryComponent({ employee: employeeId, ...payload });

        if (data) {
            handleCancel?.();
            dispatch(
                showToast({
                    description: 'Salary component updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefreshBasicSalary(!refreshBasicSalary));
            dispatch(setRefreshSalaryComp(!refreshSalaryComp));
        }
        setIsUpdating(false);
        return data;
    };
    // Delete salary component action
    const deleteSalaryCompAction = async (salaryCompId: string) => {
        setIsLoading(true);

        // Include the employeeId in the deletion payload if available
        const data = await deleteSalaryComponent({
            userId,
            userType: role,
            id: salaryCompId,
        });

        if (data) {
            setSalaryCompDetails(data);
            dispatch(
                showToast({
                    description: 'Salary component deleted successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefreshBasicSalary(!refreshBasicSalary));
            dispatch(setRefreshSalaryComp(!refreshSalaryComp));
            if (handleCancel) handleCancel();
        }

        setIsLoading(false);
        return data;
    };

    return {
        addSalaryCompAction,
        updateSalaryCompAction,
        addEmployeeSalaryCompAction,
        updateEmployeeSalaryCompAction,
        deleteSalaryCompAction,
        salaryCompDetails,
        isLoading,
        isAdding,
        isUpdating,
        isGeneralAdding,
        isGeneralUpdating,
    };
}
