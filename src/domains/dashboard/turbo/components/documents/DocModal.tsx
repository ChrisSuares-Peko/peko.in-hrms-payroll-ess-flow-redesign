
import { Flex, Form } from 'antd';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { showToast } from '@src/slices/apiSlice';

import docSchema from '../../schema';

const DocModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
    vehicleId,
    createDoc,
    existingDocs = [],
}: any) => {
    //    const {count,createDoc}=useCreateDocApi()
    const dispatch = useDispatch();

    const allTypeOptions = [
        { label: 'Fitness', value: 'Fitness' },
        { label: 'Road Tax', value: 'RoadTax' },
        { label: 'Other Vehicle Related Docs', value: 'Other' },
    ];

    const usedTypes = existingDocs.map((doc: any) => doc.type);
    const typeOptions = allTypeOptions.filter(option => !usedTypes.includes(option.value));

    return (
        <CustomModalWithForm
            //    isLoading={isLoading}
            modalTitle="Document Management"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const res: any = await createDoc({
                    ...values,
                });

                if (res.status === true) {
                    dispatch(
                        showToast({
                            description: `${res.message} `,
                            variant: 'success',
                        })
                    );
                    // The modal wrapper only closes on an explicit cancel, so close it here on success
                    // (a failure keeps the panel open so the user can correct and retry).
                    handleCancel();
                }
                if (res.status === false) {
                    dispatch(
                        showToast({
                            description: `${res.message}`,
                            variant: 'error',
                        })
                    );
                }
            }}
            initialValues={{
                vehicleId,
                type: '',
                expiryDate: null,
                documentBase: '',
                documentFormat: '',
            }}
            validationSchema={docSchema}
        >
            <Flex vertical className="w-full ">
                <Form layout="vertical">
                    <SelectInput
                        isRequired
                        name="type"
                        options={typeOptions}
                        placeholder="Select document type"
                        label="Document Type"
                    />

                    <DatePickerInput
                        isRequired
                        name="expiryDate"
                        placeholder="Select Date"
                        label="Expiry Date"
                        classes="w-full"
                        needConfirm={false}
                        minDate={dayjs().add(1, 'day').startOf('day')}
                    />
                    <FileUploadInput
                        name="documentBase"
                        format="documentFormat"
                        label="Upload Document"
                        subLabel="(Formats Supported: JPEG, PNG, PDF. Max size: 5 MB)"
                        maxFileSize={5120}
                        allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                        showFileName
                        isRequired
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default DocModal;
