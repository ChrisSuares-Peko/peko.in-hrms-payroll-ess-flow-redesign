import { Form, Modal, Select } from 'antd';
import { FormikContextType, FormikProvider } from 'formik';

import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { GST_OPTIONS } from '../../constants/settings';
import { CatalogItemApiData } from '../../types/catalog';

interface CatalogFormModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    editingItem: CatalogItemApiData | null;
    formik: FormikContextType<any>;
}

const CatalogFormModal = ({
    open,
    onClose,
    onSubmit,
    isSubmitting,
    editingItem,
    formik,
}: CatalogFormModalProps) => (
    <FormikProvider value={formik}>
        <Modal
            open={open}
            onCancel={onClose}
            onOk={onSubmit}
            okText={editingItem ? 'Save changes' : 'Add item'}
            okButtonProps={{ danger: true, loading: isSubmitting }}
            cancelButtonProps={{ disabled: isSubmitting }}
            title={editingItem ? 'Edit catalog item' : 'Add catalog item'}
            width={540}
            destroyOnHidden
        >
            <Form layout="vertical" component="div" className="space-y-3 pt-2">
                <TextInput
                    name="name"
                    label="Name"
                    placeholder="Enter product or service name"
                    type="text"
                    isRequired
                />

                <div className="grid grid-cols-2 gap-3">
                    <TextInput
                        name="unitPrice"
                        label="Unit Price (₹)"
                        placeholder="0.00"
                        type="text"
                        isRequired
                        allowTwoDecimalsOnly
                    />
                    <Form.Item label={<span>GST</span>} colon={false}>
                        <Select
                            value={formik.values.gstRate || undefined}
                            placeholder="Select GST"
                            options={GST_OPTIONS}
                            onChange={val => formik.setFieldValue('gstRate', val)}
                        />
                    </Form.Item>
                </div>

                <TextAreaInput
                    name="description"
                    label="Description"
                    placeholder="Brief description of this item"
                    minRows={2}
                />

                <TextInput
                    name="hsnCode"
                    label="HSN/SAC Code"
                    placeholder="e.g. 1234 or 99041010"
                    type="text"
                />
            </Form>
        </Modal>
    </FormikProvider>
);

export default CatalogFormModal;
