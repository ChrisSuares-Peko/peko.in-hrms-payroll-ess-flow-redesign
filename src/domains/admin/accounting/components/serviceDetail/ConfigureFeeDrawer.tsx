import { Form } from 'antd';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

export type FeeFormValues = { surchargeType: string; surcharge: string };

type ConfigureFeeDrawerProps = {
    open: boolean;
    title: string;
    initialValues: FeeFormValues;
    onCancel: () => void;
    onSubmit: (values: FeeFormValues) => void;
};

const feeSchema = Yup.object({
    surchargeType: Yup.string().required('Surcharge type is required'),
    surcharge: Yup.number()
        .typeError('Enter a valid amount')
        .min(0, 'Cannot be negative')
        .required('Surcharge is required'),
});

const ConfigureFeeDrawer = ({
    open,
    title,
    initialValues,
    onCancel,
    onSubmit,
}: ConfigureFeeDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={feeSchema}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as FeeFormValues)}
        firstBtnTxt="Save"
        reinitialise
    >
        <Form layout="vertical">
            <SelectInput
                name="surchargeType"
                label="Surcharge Type"
                placeholder="Please select surcharge type"
                options={[
                    { value: 'PERCENTAGE', label: 'Percentage' },
                    { value: 'FLAT', label: 'Flat' },
                ]}
                isRequired
            />
            <TextInput
                name="surcharge"
                label="Surcharge"
                placeholder="e.g. 20.00"
                type="text"
                allowDecimalsOnly
                isRequired
            />
        </Form>
    </CustomModalWithForm>
);

export default ConfigureFeeDrawer;
