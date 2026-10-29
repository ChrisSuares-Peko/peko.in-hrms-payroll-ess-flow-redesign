import { Form } from 'antd';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

export type CashbackFormValues = { cashbackType: string; cashback: string };

type ConfigureCashbackDrawerProps = {
    open: boolean;
    title: string;
    initialValues: CashbackFormValues;
    onCancel: () => void;
    onSubmit: (values: CashbackFormValues) => void;
};

const cashbackSchema = Yup.object({
    cashbackType: Yup.string().required('Cashback type is required'),
    cashback: Yup.number()
        .typeError('Enter a valid amount')
        .min(0, 'Cannot be negative')
        .required('Cashback is required'),
});

const ConfigureCashbackDrawer = ({
    open,
    title,
    initialValues,
    onCancel,
    onSubmit,
}: ConfigureCashbackDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={cashbackSchema}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as CashbackFormValues)}
        firstBtnTxt="Save"
        reinitialise
    >
        <Form layout="vertical">
            <SelectInput
                name="cashbackType"
                label="Cashback Type"
                placeholder="Please select cashback type"
                options={[
                    { value: 'PERCENTAGE', label: 'Percentage' },
                    { value: 'FLAT', label: 'Flat' },
                ]}
                isRequired
            />
            <TextInput
                name="cashback"
                label="Cashback"
                placeholder="e.g. 0.5"
                type="text"
                allowDecimalsOnly
                isRequired
            />
        </Form>
    </CustomModalWithForm>
);

export default ConfigureCashbackDrawer;
