import { Modal, Button, Form } from 'antd';
import { Formik, useFormikContext } from 'formik';

import indianFlag from '@assets/flagIndia.png';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { addShareholderSchema } from '../schema/addShareholder';

export interface ShareholderFormData {
    name: string;
    nationality: string;
    email: string;
    mobile: string;
    panNumber: string;
    passportNumber?: string;
}

interface AddShareholderDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: ShareholderFormData) => void;
    isLLP?: boolean;
    editData?: ShareholderFormData;
}

const nationalities = [
    { label: 'Indian', value: 'Indian' },
    { label: 'American', value: 'American' },
    { label: 'British', value: 'British' },
    { label: 'Canadian', value: 'Canadian' },
    { label: 'Australian', value: 'Australian' },
    { label: 'Other', value: 'Other' },
];

const emptyValues: ShareholderFormData = {
    name: '',
    nationality: '',
    email: '',
    mobile: '',
    panNumber: '',
    passportNumber: '',
};

const mobileAddon = (
    <span className="flex items-center gap-1.5 min-w-[68px] pr-1 whitespace-nowrap cursor-default">
        <img src={indianFlag} alt="India" className="w-5 h-auto shrink-0" />
        <span className="text-sm font-semibold text-[#333]">+91</span>
    </span>
);

const PanOrPassportField: React.FC = () => {
    const { values } = useFormikContext<ShareholderFormData>();

    if (values.nationality === 'Indian') {
        return (
            <div className="mb-5">
                <TextInput
                    name="panNumber"
                    label="PAN"
                    type="text"
                    placeholder="Enter PAN"
                    convertToUppercase
                    allowAlphabetsAndNumbersOnly
                    isRequired
                    size="large"
                    formItemClass="!mb-0"
                />
            </div>
        );
    }

    if (values.nationality) {
        return (
            <div className="mb-5">
                <TextInput
                    name="passportNumber"
                    label="Passport Number"
                    type="text"
                    placeholder="Enter passport number"
                    convertToUppercase
                    allowAlphabetsAndNumbersOnly
                    maxLength={20}
                    isRequired
                    size="large"
                    formItemClass="!mb-0"
                />
            </div>
        );
    }

    return null;
};

const AddShareholderDrawer = ({ open, onClose, onSubmit, isLLP, editData }: AddShareholderDrawerProps) => {
    const isEditMode = Boolean(editData);
    const entityLabel = isLLP ? 'partner' : 'shareholder';

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={700}
            centered
            destroyOnClose
            title={
                <span className="text-[24px] font-medium text-[rgba(0,0,0,0.8)]">
                    {isEditMode ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
                </span>
            }
            styles={{ body: { paddingTop: 32 } }}
        >
            <Formik
                initialValues={editData ?? emptyValues}
                validationSchema={addShareholderSchema}
                enableReinitialize
                onSubmit={(values, { resetForm }) => {
                    onSubmit(values);
                    resetForm();
                    onClose();
                }}
            >
                {({ handleSubmit }) => (
                    <Form layout="vertical" onFinish={handleSubmit}>
                        <div className="mb-5">
                            <TextInput
                                name="name"
                                label="Name"
                                type="text"
                                placeholder="Enter Name"
                                isRequired
                                size="large"
                                formItemClass="!mb-0"
                            />
                        </div>

                        <div className="mb-5">
                            <SelectInput
                                name="nationality"
                                label="Nationality"
                                placeholder="Select Nationality"
                                options={nationalities}
                                isRequired
                                size="large"
                                formItemClass="!mb-0"
                            />
                        </div>

                        <div className="mb-5">
                            <TextInput
                                name="email"
                                label="Email address"
                                type="text"
                                placeholder="Enter email address"
                                isRequired
                                size="large"
                                formItemClass="!mb-0"
                            />
                        </div>

                        <div className="mb-5">
                            <TextInput
                                name="mobile"
                                label="Mobile Number"
                                type="text"
                                placeholder="Mobile Number"
                                addonBefore={mobileAddon}
                                allowNumbersOnly
                                maxLength={10}
                                isRequired
                                size="large"
                                formItemClass="!mb-0 static-phone-addon"
                            />
                        </div>

                        <PanOrPassportField />

                        <div className="flex gap-3 mt-10">
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="!flex-1 !h-14 !bg-lightRed hover:!bg-lightRedHover !text-white !font-semibold !rounded-[8px] transition-colors"
                            >
                                {isEditMode ? 'Update' : 'Add'}
                            </Button>
                            <Button
                                onClick={onClose}
                                className="!flex-1 !h-14 !border-[#d0d5dd] !text-[#344054] hover:!bg-gray-50 !font-semibold !rounded-[8px] transition-colors"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default AddShareholderDrawer;
