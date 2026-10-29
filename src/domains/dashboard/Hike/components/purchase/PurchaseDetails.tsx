import React, { useState, useEffect } from 'react';

import { DownOutlined, UpOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Checkbox,
    Col,
    Divider,
    Flex,
    Form,
    Grid,
    Image,
    Input,
    InputNumber,
    Row,
    Typography,
} from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import useServiceAccess from '@src/hooks/useSubscriptionCheck';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

const { useBreakpoint } = Grid;
const PurchaseDetails = ({
    logo,
    onUpdateItem,
    id,
    data,
    price,
    hikeName,
    salaryValidation,
    salaryAmt,
}: any) => {
    const dispatch = useDispatch();
    const screens = useBreakpoint();
    salaryValidation = salaryValidation === 'GREATER_THAN' ? 'greater than' : 'less than';
    const isPurchased = useServiceAccess(accessKeys.payroll);
    const [voucherCount, setVoucherCount] = useState<number>(0);
    const [amount, setAmount] = useState<number>(0);
    const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
    const [selectAllChecked, setSelectAllChecked] = useState<boolean>(false);
    const [isDropdownDisabled, setIsDropdownDisabled] = useState<boolean>(false);
    const [isCheckboxDisabled, setIsCheckboxDisabled] = useState<boolean>(false);
    const voucherPrice = price;

    const calculateAmount = (count: number) => {
        const newAmount = count * voucherPrice;
        setAmount(newAmount);

        onUpdateItem(id, count, price, hikeName, newAmount, selectedEmployees, logo);
    };

    useEffect(() => {
        if (isPurchased && selectedEmployees.length > 0) {
            const employeeCount = selectedEmployees.length;
            setVoucherCount(employeeCount);
            calculateAmount(employeeCount);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmployees, isPurchased]);

    const handleVoucherCountChange = (value: number | null) => {
        const count = value ?? 0;
        setVoucherCount(count);
        const newAmount = count * voucherPrice;
        setAmount(newAmount);

        onUpdateItem(id, count, price, hikeName, newAmount, selectedEmployees, logo);
    };

    const handleEmployeeSelection = (value: any) => {
        const selected = data
            .filter((employee: any) => value.includes(employee.value))
            .map((employee: any) => ({
                name: employee.fullName,
                employeeId: employee.id,
            }));

        setSelectedEmployees(selected);
        setIsCheckboxDisabled(true);

        if (!isPurchased) {
            const employeeCount = selected.length;
            setVoucherCount(employeeCount);
            calculateAmount(employeeCount);
        }
        if (selected.length === 0) {
            setVoucherCount(0);
            calculateAmount(0);
            setIsCheckboxDisabled(false);
        }
    };

    const handleSelectAllEmployees = (e: any) => {
        setSelectAllChecked(e.target.checked);

        if (e.target.checked) {
            const filteredEmployees = data.filter((employee: any) => {
                if (salaryValidation === 'greater than') {
                    return employee.netSalary > salaryAmt;
                }
                return employee.netSalary < salaryAmt;
            });

            if (filteredEmployees.length === 0) {
                dispatch(
                    showToast({
                        description: `There are no employees who meet the criteria of a salary ${salaryValidation} ₹ ${salaryAmt}.`,
                        variant: 'error',
                    })
                );
                setSelectedEmployees([]);
                setVoucherCount(0);
                setAmount(0);
                calculateAmount(0);
                return;
            }

            const selected = filteredEmployees.map((employee: any) => ({
                name: employee.fullName,
                employeeId: employee.id,
            }));

            setSelectedEmployees(selected);
            setVoucherCount(selected.length);
            calculateAmount(selected.length);
            setIsDropdownDisabled(true);
        } else {
            // Uncheck, to clear selection
            setSelectedEmployees([]);
            setVoucherCount(0);
            calculateAmount(0);
            setIsDropdownDisabled(false);
        }
    };
    return (
        <>
            <Row className="mt-5 w-full" gutter={20}>
                <Col xs={24} md={7}>
                    <Card className="rounded-2xl h-36 xxl:w-80 ">
                        <Flex vertical justify="center" align="center">
                            <Image
                                src={logo}
                                preview={false}
                                style={{ width: '100%', height: '100%', maxHeight: '9rem' }}
                                className="mt-5"
                            />
                            {/* <Typography.Text className="text-lg font-medium mt-4">
                                ₹ {price}
                            </Typography.Text> */}
                        </Flex>
                    </Card>
                </Col>
                <Col xs={24} md={8} xxl={8}>
                    <Formik
                        initialValues={{ employee: '' }}
                        onSubmit={values => {
                            console.log('Selected Employees:', values);
                        }}
                    >
                        {({ handleSubmit }) => (
                            <Flex vertical className="mt-4 ">
                                <Typography.Text className="text-medium">
                                    Select employee
                                </Typography.Text>
                                <Form onFinish={handleSubmit}>
                                    <SelectInputWithSearch
                                        name="employee"
                                        options={data}
                                        classes="mt-1"
                                        placeholder="Select employees"
                                        // label="Select employees"
                                        mode="multiple"
                                        handleChange={handleEmployeeSelection}
                                        isDisabled={!isPurchased || isDropdownDisabled}
                                    />
                                </Form>
                                <Checkbox
                                    disabled={!isPurchased || isCheckboxDisabled}
                                    className=""
                                    name="selfDeclaration"
                                    onChange={handleSelectAllEmployees}
                                >
                                    <Typography.Text className="text-sm xxl:text-[0.85rem] md:text-[0.76rem] xs:text-[0.54rem]">
                                        Select all employees with salary {salaryValidation} ₹{' '}
                                        {salaryAmt}
                                    </Typography.Text>
                                </Checkbox>
                            </Flex>
                        )}
                    </Formik>
                </Col>
                <Col xs={16} md={5} xxl={5}>
                    <Flex vertical className="mt-4 ml-0 xl:ml-10">
                        <Typography.Text className="text-medium line-clamp-1">
                            Number of Vouchers
                        </Typography.Text>
                        {(isPurchased && selectedEmployees.length > 0) || selectAllChecked ? (
                            <Flex vertical className="mt-1">
                                <Input
                                    value={selectedEmployees.length}
                                    readOnly
                                    className="w-24 border rounded-sm"
                                />
                            </Flex>
                        ) : (
                            <Flex vertical className="mt-1">
                                {/* <InputNumber
                                    min={0}
                                    value={voucherCount}
                                    onChange={handleVoucherCountChange}
                                    className="border rounded-sm"
                                    type="number"
                                    formatter={value => (value ? `${value}`.replace(/[^\d]/g, '') : '')} // Convert non-numeric characters to spaces
                    parser={value => parseInt(value?.replace(/[^\d]/g, '') || '', 10)} //
                                /> */}
                                {screens.md ? (
                                    <InputNumber
                                        min={0}
                                        type="number"
                                        value={voucherCount}
                                        formatter={value =>
                                            value ? `${value}`.replace(/[^\d]/g, '') : ''
                                        } // Convert non-numeric characters to spaces
                                        parser={value =>
                                            parseInt(value?.replace(/[^\d]/g, '') || '', 10)
                                        } //
                                        onChange={handleVoucherCountChange}
                                        onKeyDown={e => {
                                            const { key } = e;
                                            // Prevent non-numeric input
                                            if (
                                                !/^\d$/.test(key) &&
                                                key !== 'Backspace' &&
                                                key !== 'Delete' &&
                                                key !== 'ArrowLeft' &&
                                                key !== 'ArrowRight'
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: '100px' /* Adjust width as needed */,
                                        }}
                                    >
                                        <Input
                                            value={voucherCount}
                                            onChange={e => {
                                                const value = e.target.value.replace(/[^\d]/g, ''); // Remove non-numeric characters
                                                setVoucherCount(value ? parseInt(value, 10) : 0); // Update state
                                                handleVoucherCountChange(
                                                    value ? parseInt(value, 10) : 0
                                                );
                                            }}
                                            style={{
                                                width: '100%',
                                                textAlign: 'center',
                                                paddingRight: '32px', // Space for arrows

                                                height: '38px',
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'absolute',
                                                right: '0',
                                                top: '0',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderLeft: '1px solid #d9d9d9', // Add border to the left of the arrows
                                                padding: '0',
                                            }}
                                        >
                                            <Button
                                                style={{
                                                    width: '20px',
                                                    height: '16px',
                                                    padding: '0',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    fontSize: '10px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    lineHeight: '1',
                                                    cursor: 'pointer',
                                                }}
                                                type="text"
                                                onClick={() => {
                                                    const newValue = voucherCount + 1;
                                                    setVoucherCount(newValue);
                                                    handleVoucherCountChange(newValue);
                                                }}
                                            >
                                                <UpOutlined
                                                    style={{ fontSize: '10px', color: '#d9d9d9' }}
                                                />
                                            </Button>
                                            <div
                                                style={{
                                                    width: '28px', // Ensure divider spans the full width
                                                    height: '1px', // Thin divider
                                                    backgroundColor: '#d9d9d9', // Divider color
                                                    margin: '0', // Remove extra space
                                                }}
                                            />
                                            <Button
                                                style={{
                                                    width: '20px',
                                                    height: '16px',
                                                    padding: '0',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    fontSize: '10px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    lineHeight: '1',
                                                    cursor: 'pointer',
                                                }}
                                                type="text"
                                                onClick={() => {
                                                    const newValue =
                                                        voucherCount - 1 >= 0
                                                            ? voucherCount - 1
                                                            : 0;
                                                    setVoucherCount(newValue);
                                                    handleVoucherCountChange(newValue);
                                                }}
                                            >
                                                <DownOutlined
                                                    style={{ fontSize: '10px', color: '#d9d9d9' }}
                                                />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Flex>
                        )}
                    </Flex>
                </Col>
                <Col xs={8} md={3} xxl={3}>
                    <Flex vertical className="mt-4 ml-0 xxl:ml-10">
                        <Typography.Text className="">Sub total</Typography.Text>
                        <Typography.Text className="mt-3  xs:text-[.64rem] sm:text-sm">
                            ₹ {formatNumberWithLocalString(amount)}
                        </Typography.Text>
                    </Flex>
                </Col>
            </Row>
            <Divider className="mt-10" />
        </>
    );
};

export default PurchaseDetails;
