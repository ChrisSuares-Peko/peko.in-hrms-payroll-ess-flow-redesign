import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { formatNumberWithoutCommas } from '@utils/priceFormat';

import useWorkspaceUpdate from '../../hooks/useWorkspaceUpdate';
import { workspaceSchema } from '../../schema/workspace';
import { WorkspaceBody } from '../../types/workspace';
import WorkspaceForm from '../forms/WorkspaceForm';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: WorkspaceBody;
    handleRefresh: () => void;
};

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const { isLoading, handleWorkspaceCreation, plans, updateWorkspaceDetails } =
        useWorkspaceUpdate();

    return (
        <CustomModalWithForm
            modalTitle="Workspace Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let result;
                if (values.id) {
                    result = await updateWorkspaceDetails(values);
                } else {
                    result = await handleWorkspaceCreation(values);
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            validationSchema={workspaceSchema}
            initialValues={{
                id: data?.id || '',
                name: data?.name || '',
                address: data?.address || '',
                monthlyPrice: formatNumberWithoutCommas(data?.monthlyPrice) || '',
                yearlyPrice: formatNumberWithoutCommas(data?.yearlyPrice) || '',
                latLng: data?.latLng || '',
                planId: data?.plan?.id || '',
                logo: data?.logo || '',
            }}
        >
            <WorkspaceForm plans={plans} record={data} />
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
