import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useConnectUpdate from '../../hooks/useConnectUpdate';
import { connectSchema } from '../../schema/connect';
import { ConnectBody } from '../../types/connect';
import ConnectForm from '../forms/ConnectForm';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: ConnectBody;
    handleRefresh: () => void;
};

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const { isLoading, handleConnectCreation, updateConnectDetails, categories } =
        useConnectUpdate();

    return (
        <CustomModalWithForm
            modalTitle="Connect Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let result;
                if (values.id) {
                    result = await updateConnectDetails(values);
                } else {
                    result = await handleConnectCreation(values);
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            // validationSchema={connectSchema}
            initialValues={{
                id: data?.id || '',
                serviceProvider: data?.serviceProvider || '',
                tagline: data?.tagline || '',
                mobileNo: data?.mobileNo || '',
                email: data?.email || '',
                website: data?.website || '',
                address: data?.address || '',
                category: data?.category || '',
                description: data?.description || '',
                offerings: data?.offerings || '',
                rewards: data?.rewards || '',
            }}
            validationSchema={connectSchema}
        >
            <ConnectForm categories={categories} />
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
