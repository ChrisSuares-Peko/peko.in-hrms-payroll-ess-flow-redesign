import { Flex, Button } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';

import AdditionalDetailsForm from '../forms/AdditionalDetailsForm';
import InvoiceDetailsForm from '../forms/InvoiceDetailsForm';
import { invoiceDetailsSchema } from '../schema/index';
import { nextStep, previousStep, setInvoiceDetails } from '../slices/InvoiceSlices';

const InvoicesDetails = () => {
    const dispatch = useDispatch();
    const { invoiceDetails, comments, termsConditions } = useAppSelector(
        state => state.reducer.invoices
    );

    return (
        <Formik
            initialValues={{
                invoiceNo: invoiceDetails.invoiceNo,
                invoiceDate: invoiceDetails?.invoiceDate,
                dueDate: invoiceDetails?.dueDate,
                comments,
                termsConditions,
            }}
            validationSchema={invoiceDetailsSchema}
            onSubmit={(values, { resetForm }) => {
                dispatch(setInvoiceDetails(values));
                resetForm();
                dispatch(nextStep());
            }}
        >
            {({ handleSubmit }) => (
                <form onSubmit={handleSubmit} className="mt-8">
                    <Flex className="flex-col md:flex-row gap-0 md:gap-14">
                        <InvoiceDetailsForm startdate="" />
                        <AdditionalDetailsForm />
                    </Flex>
                    <Flex gap={10} className="hidden md:flex">
                        <Button type="default" onClick={() => dispatch(previousStep())}>
                            Back
                        </Button>
                        <Button type="primary" danger htmlType="submit">
                            Next
                        </Button>
                    </Flex>
                    <Button type="primary" danger htmlType="submit" className="flex md:hidden">
                        Submit
                    </Button>
                </form>
            )}
        </Formik>
    );
};

export default InvoicesDetails;
