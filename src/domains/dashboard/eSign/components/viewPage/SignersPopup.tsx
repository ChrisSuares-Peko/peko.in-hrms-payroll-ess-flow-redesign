import { Modal, Form, Button, Flex } from 'antd';
import { Formik } from 'formik';
import { v4 as uuidv4 } from 'uuid';

import SelectInput from '@components/atomic/inputs/SelectInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { touchedSignersSchema } from '../../schema';
import { addSignerCoordinate } from '../../slices/eSignDocSlice';

type SignersPopupProps = {
    open: boolean;
    handleCancel: () => void;
    coordinates: {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        page: number;
        pageHeight: number;
        pageWidth: number;
    } | null;
};

const SignersPopup = ({ open, handleCancel, coordinates }: SignersPopupProps) => {
    const dispatch = useAppDispatch();
    const signerCount = useAppSelector(state => state.reducer.eSignDoc.signerArray);

    const signerOptions =
        signerCount?.map(signer => ({
            label: `Signer ${Number(signer) + 1}`,
            value: signer,
        })) || [];

    const handleFormSubmit = async (values: any) => {
        const uniqueId = uuidv4();
        dispatch(
            addSignerCoordinate({
                key: values.signer,
                data: {
                    id: uniqueId,
                    x1: coordinates?.x1 ?? 0,
                    x2: coordinates?.x2 ?? 0,
                    y1: coordinates?.y1 ?? 0,
                    y2: coordinates?.y2 ?? 0,
                    page: coordinates?.page ?? 1,
                    pageHeight: coordinates?.pageHeight ?? 0,
                    pageWidth: coordinates?.pageWidth ?? 0,
                },
            })
        );
        handleCancel();
    };

    const initialValues = {
        signer: '',
    };

    return (
        <Modal title="Select Signer" open={open} onCancel={handleCancel} footer={null}>
            <Formik
                initialValues={initialValues}
                validationSchema={touchedSignersSchema}
                onSubmit={values => handleFormSubmit(values)}
            >
                {({ handleSubmit }) => (
                    <Form>
                        <SelectInput
                            name="signer"
                            label="Signer"
                            placeholder="Select signer"
                            isRequired
                            options={signerOptions}
                        />
                        <Flex gap={10} justify="end">
                            <Button style={{ marginTop: '1rem' }} onClick={() => handleCancel()}>
                                Cancel
                            </Button>
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                htmlType="submit"
                                onClick={() => handleSubmit()}
                                style={{ marginTop: '1rem' }}
                            >
                                Confirm
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default SignersPopup;
