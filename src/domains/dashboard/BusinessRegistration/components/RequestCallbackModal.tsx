import { useEffect, useState } from 'react';

import { Button, Form as AntForm, Modal, Typography } from 'antd';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createLead, getCatalog } from '../api';
import { catalogSelectOptions, parseCatalogList } from '../utils/catalog';

const { Text } = Typography;

const schema = Yup.object().shape({
    name: Yup.string()
        .required('Please enter your full name')
        .matches(/^[a-zA-Z\s.'-]+$/, 'Please enter a valid full name')
        .test('no-leading-space', 'Full name cannot start with a blank space', v => !v || !v.startsWith(' '))
        .test('no-trailing-space', 'Full name cannot end with a blank space', v => !v || !v.endsWith(' '))
        .test('not-only-whitespace', 'Full name cannot be only whitespace', v => !v || v.trim().length > 0),
    email: Yup.string()
        .required('Please enter your email address')
        .email('Please enter a valid email address'),
    mobile: Yup.string()
        .required('Please enter your mobile number')
        .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
    catalogId: Yup.string(),
});

const INITIAL_VALUES = { name: '', email: '', mobile: '', catalogId: '' };

interface RequestCallbackModalProps {
    open: boolean;
    onClose: () => void;
}

// "Request a callback" (vendor-recommended flow, 23-07): creates an IndiaFilings
// CRM lead so a startup expert calls the customer back. The service select
// (admin-activated catalog rows) rides along as the lead's catalog_id.
const RequestCallbackModal = ({ open, onClose }: RequestCallbackModalProps) => {
    const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open || options.length) return;
        getCatalog({ userId: Number(userId), userType: userType ?? '' }).then(res => {
            if (res) setOptions(catalogSelectOptions(parseCatalogList(res)));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleSubmit = async (values: typeof INITIAL_VALUES) => {
        setSubmitting(true);
        const created = await createLead({
            userId: Number(userId),
            userType: userType ?? '',
            name: values.name.trim(),
            email: values.email.trim(),
            mobile: values.mobile,
            catalogId: values.catalogId || undefined,
        });
        setSubmitting(false);
        if (!created) {
            dispatch(
                showToast({
                    description: 'Could not submit your request. Please try again.',
                    variant: 'error',
                })
            );
            return;
        }
        dispatch(
            showToast({
                description: 'Request received — our startup expert will call you back shortly.',
                variant: 'success',
            })
        );
        onClose();
    };

    return (
        <Modal open={open} onCancel={onClose} footer={null} destroyOnClose width={520}>
            <div className="flex flex-col gap-1 pr-6">
                <Text className="!text-[20px] !font-semibold !text-[#1e293b]">
                    Request a callback
                </Text>
                <Text className="!text-[14px] !text-[#6a7282] !leading-[22px]">
                    Share your details and a startup expert will reach out to help you choose the
                    right business structure.
                </Text>
            </div>
            <Formik initialValues={INITIAL_VALUES} validationSchema={schema} onSubmit={handleSubmit}>
                <Form className="mt-4">
                    <AntForm layout="vertical" component={false}>
                        <TextInput label="Full name" name="name" type="text" placeholder="Enter your full name" isRequired size="large" />
                        <TextInput label="Email address" name="email" type="text" placeholder="Enter your email" isRequired size="large" />
                        <TextInput label="Mobile number" name="mobile" type="text" placeholder="10-digit mobile number" addonBefore="+91" maxLength={10} allowNumbersOnly isRequired size="large" />
                        <SelectInput
                            label="Which service are you interested in? (optional)"
                            name="catalogId"
                            options={options}
                            placeholder="Select a service"
                            size="large"
                        />
                    </AntForm>
                    <div className="flex justify-end gap-3 mt-2">
                        <Button onClick={onClose} className="!h-[40px] !px-5 !rounded-[8px]">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            className="!h-[40px] !px-5 !rounded-[8px] !bg-[#ff4f4f] hover:!bg-[#e64444]"
                        >
                            Request callback
                        </Button>
                    </div>
                </Form>
            </Formik>
        </Modal>
    );
};

export default RequestCallbackModal;
