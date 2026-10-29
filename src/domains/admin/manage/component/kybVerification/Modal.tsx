import { Flex, Form, Typography } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import GSTFields from './GSTFields';
import ListItem from './ListItem';
import PanFields from './PanFields';

type UpdateModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    updateStatusKyb: (
        id: number,
        updatedStatus: { gstVerified?: boolean; panVerified?: boolean }
    ) => Promise<void>;
};

const verifications = [
    { label: 'Verified', value: true },
    { label: 'Not Verified', value: false },
];

const UpdateModal = ({ open, handleCancel, data, updateStatusKyb }: UpdateModalProps) => {
    const verifiedField = data?.documentType === 'gst' ? 'gstVerified' : 'panVerified';
    const verifiedStatus = data?.[verifiedField];

    const getVerificationStatus = () => {
        const type = data?.documentType;
        if (type === 'gst') return data.gstVerified;
        return data.panVerified;
    };
    return (
        <CustomModalWithForm
            modalTitle="KYB Verification Details"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                if (values.id) {
                    await updateStatusKyb({ ...values }, data.id);
                }
                handleCancel();
            }}
            // hideFooter
            initialValues={{
                id: data?.id || '',
                // documentType: data?.documentType || '',
                // documentNumber: data?.documentNumber || '',
                // legalNameOfBusiness: data?.legalNameOfBusiness || '',
                // gstin: data?.verificationResponse?.GSTIN || 'N/A',
                // verificationStatus: data?.gstVerified || data?.panVerified ? 'Verified' : 'Not Verified',
                // tradeName: data?.verificationResponse?.trade_name_of_business || 'N/A',
                // referenceId: data?.verificationResponse?.reference_id || 'N/A',
                [verifiedField]: verifiedStatus ?? false,
            }}
        >
            <Flex vertical className="w-full p-4">
                <Form layout="vertical">
                    <ListItem property="Document Type" value={data?.documentType?.toUpperCase()} />
                    <ListItem
                        property={data?.documentType === 'gst' ? 'GSTIN' : 'Pan Number'}
                        value={data?.documentNumber}
                    />

                    {data?.documentType === 'pan' && <PanFields data={data} />}
                    {data?.documentType === 'gst' && <GSTFields data={data} />}

                    <ListItem
                        property="Verification Status"
                        value={
                            <Typography.Paragraph
                                className={
                                    getVerificationStatus() ? 'text-green-500' : 'text-red-500'
                                }
                            >
                                {getVerificationStatus() ? 'Verified' : 'Not Verified'}
                            </Typography.Paragraph>
                        }
                    />

                    <Flex justify="space-between" className="mt-4">
                        <SelectInput
                            label="Verification Status"
                            name={verifiedField}
                            placeholder="Select Verification Status"
                            options={verifications}
                        />
                    </Flex>
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default UpdateModal;
