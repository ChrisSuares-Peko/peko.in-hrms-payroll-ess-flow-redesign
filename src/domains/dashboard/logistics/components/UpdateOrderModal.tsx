import { Flex, Form } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useUpdateShipmentApi } from '../hooks/useUpdateShipmentApi';
import { UpdateOrder } from '../types/index';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: UpdateOrder;
    orderId: string;
};

const UpdateOrderModal = ({ open, handleCancel, data, orderId }: ModalProps) => {
   
    const currentTime = dayjs();
    const minDate = currentTime.add(1, 'day');
    const { isLoading, handleUpdateOrder } = useUpdateShipmentApi();

    const dispatch = useAppDispatch();
    return (
        <CustomModalWithForm
            modalTitle="Update Order (Reciever Details)"
            open={open}
            isLoading={isLoading}
            // validationSchema={bannerSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const res = await handleUpdateOrder({ orderId, ...values });
                if (res) {
                    dispatch(
                        showToast({
                            description: `Order updated successfully`,
                            variant: 'success',
                        })
                    );
                } else {
                    dispatch(
                        showToast({
                            description: `Something went wrong`,
                            variant: 'warning',
                        })
                    );
                }

                handleCancel();
            }}
            initialValues={{
                nextDeliveryDate: '',
                customerAddress: data?.customerAddress || '',
                customerMobileNo: data?.customerMobileNo || '',
            }}
        >
            <Flex vertical className="w-full ">
                <Form layout="vertical">
                    <DatePickerInput
                        name="nextDeliveryDate"
                        label="Next Delivery Date"
                        placeholder="Please select next delivery date"
                        classes="rounded-sm w-full"
                        needConfirm={false}
                        minDate={minDate}
                    />
                    <TextInput
                        name="customerAddress"
                        label="Address"
                        type="text"
                        placeholder="Please enter address"
                        classes=" rounded-sm"
                    />
                    <TextInput
                        name="customerMobileNo"
                        type="text"
                        allowNumbersOnly
                        maxLength={10}
                        label="Mobile Number"
                        placeholder="Please enter mobile number"
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default UpdateOrderModal;
