import { Flex, Form } from 'antd';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { commonSelectType } from '@customtypes/general';

import useGiftCardsAutoUpdate from '../../hooks/useGiftCardAuto';
import { actionTypes } from '../../utils/giftCards';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    handleRefresh: () => void;
    vendorData: commonSelectType[];
};

const AutoUpdateModal = ({
    open,
    handleCancel,
    handleRefresh,
    vendorData,
}: DepartmentModalProps) => {
    const { isLoading, handleGiftCardsAutoUpdate, handleGiftCardsAutoUpdateStatus } =
        useGiftCardsAutoUpdate();
    return (
        <CustomModalWithForm
            modalTitle="Gift Card Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let result;
                if (values.status === 'update') {
                    result = await handleGiftCardsAutoUpdate(values);
                } else {
                    result = await handleGiftCardsAutoUpdateStatus(values);
                }
                if (result !== false) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            initialValues={{
                serviceOperatorId: '',
                status: '',
            }}
        >
            {formikBag => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        <CustomSelectSearch
                            name="serviceOperatorId"
                            label="Vendor"
                            placeholder="Select Vendor"
                            isRequired
                            classes="rounded-sm"
                            options={vendorData}
                            onChange={() => formikBag.setFieldValue('status', '')}
                        />

                        <CustomSelectSearch
                            name="status"
                            label="Action"
                            placeholder="Select Action"
                            isRequired
                            classes="rounded-sm"
                            options={actionTypes}
                        />
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default AutoUpdateModal;
