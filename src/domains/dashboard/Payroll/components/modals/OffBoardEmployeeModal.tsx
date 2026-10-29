import { useState } from 'react';

import { Flex, Form, Typography } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';


import { useOffBoardEmployeeApi } from '../../hooks/employeeHooks/useOffBoardEmployeeApi';
import { offBoardEmployeeSchema } from '../../schema/offBoardSchema';
import { formatLabel, formatText } from '../../utils/employeeDetails/utils';


type OffboardModalProps = {
    open: boolean;
    handleCancel: () => void;
    employeeData: any;
    setOffboardReload: React.Dispatch<React.SetStateAction<boolean | number>>;
    data?:any
};

const OffBoardEmployeeModal = ({
    open,
    handleCancel,
    employeeData,
    setOffboardReload,
    data
}: OffboardModalProps) => {
    
    const { offBoardEmployee, isLoading } = useOffBoardEmployeeApi();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [offboardPayload, setOffboardPayload] = useState<any>(null);
    const formattedDate = moment(employeeData.employeeInformation.dateOfJoin).format('YYYY-MM-DD ');

    const resignationTypes = [
        { key: 1, id: 1, value: 'RESIGNATION', label: 'Resignation', name: 'resignation' },
        { key: 2, id: 2, value: 'SUSPENSION', label: 'Suspension', name: 'suspension' },
    ];
    const calculateAndSetLastWorkingDay = (
        offBoardingDate: any,
        noticePeriod: any,
        setFieldValue: any,
        formikProps: any
    ) => {
        if (offBoardingDate == null || noticePeriod == null) return;

        const noticePeriodInt = parseInt(noticePeriod, 10);
        if (Number.isNaN(noticePeriod)) {
            console.error('Notice period is not a valid number');
            return;
        }
        const offBoardingMoment = moment.isMoment(offBoardingDate)
            ? offBoardingDate
            : moment(offBoardingDate);

        // Add notice period days to offBoardingDate
        const lastWorkingDay = offBoardingMoment.add(noticePeriodInt, 'days').format('YYYY-MM-DD');

        // Set the formatted lastWorkingDay in formik's state
        setFieldValue('lastWorkingDay', lastWorkingDay);

        // Assuming you want the date in 'YYYY-MM-DD' format
    };

    return (
        <CustomModalWithForm
            modalTitle={
                <Flex vertical>
                    <Typography.Text className="text-xl">{employeeData.personalInformation.fullName}</Typography.Text>
                    <Typography.Text className="text-md font-normal mb-5 mt-2">
                        {employeeData.employeeInformation.employeeId}
                    </Typography.Text>
                </Flex>
            }
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const payload = { ...values };
                 if(!payload?.resignationLetter?.startsWith("http")){
                     payload.resignationLetter = payload.resignationLetter
                         ? {
                               base64: payload.resignationLetter,
                               format: payload.resignationLetterFormat,
                           }
                         : '';
                 }

                   
                setOffboardPayload(payload);
                if(!data?.offBoardingDate){    
                    setOpenConfirmationModal(true);
                }else{
                    await offBoardEmployee(employeeData.id, payload);
                    handleCancel();

                    if (setOffboardReload) setOffboardReload(p => !p);
                }
            }}
            initialValues={{
                lastWorkingDay: data?.lastWorkingDay || "",
                noticePeriod: data?.noticePeriod || 0,
                offBoardingType: data?.offBoardingType || "",
                reasonForOffBoarding: data?.reasonForOffBoarding || "",
                resignationLetter: data?.resignationLetter || "",
                offBoardingDate: data?.offBoardingDate || "",
            }}
            validationSchema={offBoardEmployeeSchema}
        >
            {formikProps => (
                <>
                    <Flex vertical className=" w-full">
                        <Typography.Text className="text-md mt-2" style={{ color: '#42526D' }}>
                            {formattedDate}
                           
                        </Typography.Text>
                        <Typography.Text
                            className="text-sm font-medium "
                            style={{ color: '#42526D' }}
                        >
                            Joining Date
                        </Typography.Text>

                        <Typography.Text className="text-md mt-3 " style={{ color: '#42526D' }}>
                            {employeeData?.employeeInformation?.designation}
                        </Typography.Text>
                        <Typography.Text
                            className="text-sm font-medium"
                            style={{ color: '#42526D' }}
                        >
                            Designation
                        </Typography.Text>
                        <Typography.Text className="text-sm mt-3 " style={{ color: '#42526D' }}>
                            
                                {formatText(employeeData?.employeeInformation?.contractType)
                             || 'N/A'}
                        </Typography.Text>
                        <Typography.Text
                            className="text-sm font-medium"
                            style={{ color: '#42526D' }}
                        >
                            Job Type
                        </Typography.Text>

                        <Typography.Text className="text-md mt-3" style={{ color: '#42526D' }}>
                            {employeeData?.employeeInformation?.timeSchedule || 'N/A'}
                        </Typography.Text>

                        <Typography.Text
                            className="text-sm font-medium "
                            style={{ color: '#42526D' }}
                        >
                            Work Shift
                        </Typography.Text>

                        <Form layout="vertical" className="mt-5">
                            <DatePickerInput
                                label="Date of Offboarding"
                                isRequired
                                name="offBoardingDate"
                                placeholder="Select Date"
                                classes="  w-full"
                                minDate={dayjs().subtract(3, 'month')}
                                maxDate={dayjs()}
                                handleChange={date => {
                                    formikProps.setFieldValue('offBoardingDate', date);
                                    calculateAndSetLastWorkingDay(
                                        date,
                                        formikProps.values.noticePeriod,
                                        formikProps.setFieldValue,
                                        formikProps
                                    );
                                    setTimeout(() => {
                                        formikProps.validateField('offBoardingDate');
                                    }, 0);
                                }}
                            />

                            <TextInput
                                name="noticePeriod"
                                isRequired
                                label="Notice Period (in days)"
                                type="text"
                                placeholder="Notice Period"
                                maxLength={2}
                                allowNumbersOnly
                                handleChange={rawValue => {
                                    // 1) Strip out anything that's not a digit (0-9).
                                    const cleanedValue = rawValue.replace(/[^\d]/g, '');

                                    // 2) If the user cleared the field completely:
                                    if (cleanedValue === '') {
                                        formikProps.setFieldValue('noticePeriod', '');
                                        // Re-validate the field after clearing
                                        setTimeout(() => {
                                            formikProps.validateField('noticePeriod');
                                        }, 0);
                                        return;
                                    }

                                    // 3) Parse the cleaned string into an integer.
                                    const parsed = parseInt(cleanedValue, 10);

                                    // 4) If parsed is a valid integer, set it in Formik
                                    if (!Number.isNaN(parsed)) {
                                        formikProps.setFieldValue('noticePeriod', parsed);

                                        // Optionally recalc the lastWorkingDay if offBoardingDate is set
                                        if (formikProps.values.offBoardingDate && parsed >= 0) {
                                            const lastWorkingDay = moment(
                                                formikProps.values.offBoardingDate
                                            )
                                                .add(parsed, 'days')
                                                .format('YYYY-MM-DD');
                                            formikProps.setFieldValue(
                                                'lastWorkingDay',
                                                lastWorkingDay
                                            );
                                        }

                                        // Re-validate the field after setting the new value
                                        setTimeout(() => {
                                            formikProps.validateField('noticePeriod');
                                        }, 0);
                                    } else {
                                        // If parseInt gave NaN, we treat it as invalid and clear the field
                                        console.error('Notice period is not a valid number');
                                        formikProps.setFieldValue('noticePeriod', '');
                                        setTimeout(() => {
                                            formikProps.validateField('noticePeriod');
                                        }, 0);
                                    }
                                }}
                            />

                            {formikProps.values.offBoardingDate &&
                            formikProps.values.noticePeriod ? (
                                <DatePickerInput
                                    label="Last Working Day of Employee"
                                    name="lastWorkingDay"
                                    placeholder="Select Date"
                                    classes=" w-full"
                                    maxDate={dayjs()}
                                    isDisabled
                                    isRequired
                                />
                            ) : null}

                            <SelectInput
                                isRequired
                                name="offBoardingType"
                                label="Type of Exit"
                                placeholder="Type of Exit"
                                options={resignationTypes}
                            />

                            <FileUploadInput
                                name="resignationLetter"
                                label="Exit Document"
                                format="resignationLetterFormat"
                                showFileName
                                maxFileSize={5 * 1024}
                                allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                                subLabel="(Formats Supported: JPEG, PNG, PDF. Max size: 5 MB)"
                                allowFileDelete
                            />
                            <InputTextArea
                                name="reasonForOffBoarding"
                                placeholder={`Reason for ${formatLabel(formikProps.values.offBoardingType)}`}
                                label={`Reason for ${formatLabel(formikProps.values.offBoardingType)}`}
                            />
                        </Form>
                    </Flex>
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={() => setOpenConfirmationModal(false)}
                        title="Confirm Employee Offboarding "
                        customBody={
                            <div className="text-sm font-medium">
                                <p>
                                    You are about to take offboard{' '}
                                    <strong>{employeeData.fullName}</strong>. On the employee’s last
                                    working day:
                                </p>
                                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                                    <li>
                                        The employee record will be moved to the Past Employees tab.
                                    </li>
                                    <li>The Employee ID cannot be reused.</li>
                                    <li>
                                        Please ensure that all relevant payroll and exit details are
                                        accurate before proceeding.
                                    </li>
                                </ul>
                            </div>
                        }
                        handleSubmit={async () => {
                            await offBoardEmployee(employeeData.id, offboardPayload);
                            setOpenConfirmationModal(false);
                            handleCancel();

                            if (setOffboardReload) setOffboardReload(p => !p);
                        }}
                        isLoading={isLoading}
                    />
                </>
            )}
        </CustomModalWithForm>
    );
};

export default OffBoardEmployeeModal;
