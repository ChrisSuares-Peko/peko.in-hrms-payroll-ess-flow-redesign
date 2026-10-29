import { Form, Button } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import { docSchema } from '../../schema';

const RegisterStepFiveForm = () => {

    const handleValidateDoc = async () => {};

    return (
        <Formik
            initialValues={{
                gstNumber: '',
                panNumber: '',
            }}
            validationSchema={docSchema}
            onSubmit={values => {
                handleValidateDoc();
            }}
        >
            {({ handleSubmit }) => (
                <Form onFinish={handleSubmit} className="w-full mt-5">
                    <TextInput
                        name="panNumber"
                        label=""
                        placeholder="Enter PAN number (optional)"
                        type="text"
                    />
                    <TextInput
                        name="gstNumber"
                        label=""
                        placeholder="Enter GSTIN number (optional)"
                        type="text"
                    />

                    <Button
                        htmlType="submit"
                        type="primary"
                        danger
                        className="w-full font-semibold h-10"
                    >
                        Add & Verify
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default RegisterStepFiveForm;
