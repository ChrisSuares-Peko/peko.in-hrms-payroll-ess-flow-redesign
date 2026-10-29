import React, { useEffect, useMemo, useRef } from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { useFormikContext } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { accessKeys } from '@utils/accessKeys';

import { useGetEmployee } from '../hooks/useGetEmployeeApi';
import { setUpdateQuantity } from '../slices/checkoutSlice';
import { GiftCardOrderTypes } from '../types/employee';

interface SelectedEmployee {
    receiverFirstName: string;
    receiverEmail: string;
    label: string;
}
type Props = {
    setSelectedEmployees: React.Dispatch<React.SetStateAction<SelectedEmployee[]>>;
    setSelectAllChecked: React.Dispatch<React.SetStateAction<boolean>>;
    selectAllChecked: boolean;
    hideHeading?: boolean;
    stackFields?: boolean;
};
const CheckoutForm = ({
    setSelectedEmployees,
    setSelectAllChecked,
    selectAllChecked,
    hideHeading,
    stackFields,
}: Props) => {
    const fieldColSpan = stackFields ? { xs: 24 } : { xs: 24, xl: 12 };
    const { formDetails,addressDetails } = useAppSelector(state => state.reducer.giftcardCheckout);
    const isPurchasedPayroll = useServiceAccess(accessKeys.payroll);
    const { data, generateEmployeesDropdown, isLoading } = useGetEmployee(true);
    const { setFieldValue } = useFormikContext();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.reducer.user);
    const isInitialMount = useRef(true);
    const hasPreFilled = useRef(false);

    useEffect(() => {
        if (formDetails.orderType === GiftCardOrderTypes.BUYFORSELF) {
            setFieldValue('receiverFirstName', user?.contactPersonName || '');
            setFieldValue('receiverEmail', user?.email || '');
            setFieldValue('senderName', user?.contactPersonName || '');
        } else if (!isInitialMount.current) {
            setFieldValue('receiverFirstName', '');
            setFieldValue('receiverEmail', '');
            setFieldValue('senderName', '');
        }
        isInitialMount.current = false;
    }, [formDetails.orderType, user, setFieldValue]);


    const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([]);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const employeesOptions = useMemo(() => generateEmployeesDropdown(data) || [], [data]);

    useEffect(() => {
        if (
            !hasPreFilled.current &&
            formDetails.orderType === GiftCardOrderTypes.BUYFOREMPLOYEE &&
            employeesOptions.length > 0 &&
            addressDetails.employee?.length > 0 &&
            selectedEmployeeIds.length === 0
        ) {
            const normalizeEmail = (email?: string) => email?.trim().toLowerCase() ?? '';
            const matchedIds = addressDetails.employee
                .map(
                    emp =>
                        employeesOptions.find(
                            opt =>
                                normalizeEmail(opt.personalEmail) ===
                                normalizeEmail(emp.receiverEmail)
                        )?.value
                )
                .filter(Boolean) as string[];

            if (matchedIds.length > 0) {
                hasPreFilled.current = true;
                setSelectedEmployeeIds(matchedIds);
                const matched = matchedIds.map(empId => {
                    const employeeData = employeesOptions.find(opt => opt.value === empId);
                    return {
                        receiverFirstName: employeeData?.fullName ?? '',
                        receiverEmail: employeeData?.personalEmail ?? '',
                        label: employeeData?.label ?? '',
                    };
                });
                setSelectedEmployees(matched);
                dispatch(setUpdateQuantity({ quantity: matched.length.toString() }));
                setFieldValue('employee', matchedIds);
            }
        }
    
    }, [employeesOptions, formDetails.orderType, addressDetails.employee, selectedEmployeeIds.length, dispatch, setFieldValue, setSelectedEmployees]);

    const handleSelectChange = async (selectedIds: string | string[]) => {
        let ids = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
        // Limit to a maximum of 10 selections
        if (ids.length > 10) {
            ids = ids.slice(0, 10);
        }

        setSelectedEmployeeIds(ids);
        const selectedEmployees = ids.map(employeeId => {
            const employeeData = employeesOptions.find(emp => emp.value === employeeId);
            return {
                receiverFirstName: employeeData?.fullName ?? '',
                receiverEmail: employeeData?.personalEmail ?? '',
                label: employeeData?.label ?? '',
            };
        });

        setSelectedEmployees(selectedEmployees);
        dispatch(setUpdateQuantity({ quantity: Math.max(selectedEmployees.length, 1).toString() }));
        setFieldValue('receiverFirstName', '');
        setFieldValue('receiverEmail', '');
        setFieldValue('label', '');

        if (ids.length < 10) {
            if (ids.length === employeesOptions.length) {
                setSelectAllChecked(true);
            } else {
                setSelectAllChecked(false);
            }
        }
    };

    // Handler for Select All Checkbox
   
    return (
        <>
            {!hideHeading && (
                <Flex className="my-5 md:mt-10">
                    <Typography.Text className="text-sm font-medium sm:text-xl">
                        Receiver & Sender Details
                    </Typography.Text>
                </Flex>
            )}
            {formDetails.orderType === GiftCardOrderTypes.BUYFOREMPLOYEE ? (
                <>
                    {isPurchasedPayroll && (
                        <SelectInputWithSearch
                            mode="multiple"
                            name="employee"
                            options={employeesOptions}
                            placeholder="Select employees"
                            isRequired // ={!selectAllChecked} // Condition for isRequired
                            label="Select Employees"
                            handleChange={handleSelectChange}
                            maxCount={10}
                            loading={isLoading}
                        />
                    )}
                    {/* <Checkbox
                        onChange={handleSelectAllChange}
                        checked={selectAllChecked}
                        className="mb-5"
                    >
                        Select all employees
                    </Checkbox> */}
                </>
            ) : (
                <Flex className={stackFields ? 'flex-col w-full' : 'flex-col xl:flex-row w-full'}>
                    <Row className="w-full">
                        <Col {...fieldColSpan} className={stackFields ? '' : 'px-0'}>
                            <TextInput
                                name="receiverFirstName"
                                label="Receiver Name"
                                placeholder="Receiver Name"
                                type="text"
                                isRequired
                                maxLength={50}
                                allowAlphabetsAndSpaceOnly
                            />
                        </Col>
                        <Col {...fieldColSpan} className={stackFields ? '' : 'xl:pl-2'}>
                            <TextInput
                                name="receiverEmail"
                                label="Receiver Email Address"
                                placeholder="Receiver Email Address"
                                type="text"
                                maxLength={50}
                                allowLowerCaseOnly
                                isRequired
                            />
                        </Col>
                    </Row>
                </Flex>
            )}
            <Flex className={stackFields ? 'flex-col w-full' : 'flex-col md:flex-row'}>
                <Row className="w-full">
                    <Col {...fieldColSpan}>
                        <TextInput
                            name="senderName"
                            label="Sender Name"
                            placeholder="Sender Name"
                            type="text"
                            isRequired
                            maxLength={50}
                            allowAlphabetsAndSpaceOnly
                        />
                    </Col>
                    <Col xs={24}>
                        <InputTextArea
                            name="message"
                            maxLength={250}
                            showCount
                            placeholder="Message"
                            label="Your Message"
                        />
                    </Col>
                </Row>
            </Flex>
            {formDetails.orderType === GiftCardOrderTypes.BUYFOREMPLOYEE ? (
                <Typography.Text className="text-xs font-normal sm:text-sm">
                    Upon successful completion of the purchase, the gift card details will be sent
                    to the employees via email
                </Typography.Text>
            ) : null}
        </>
    );
};

export default CheckoutForm;
