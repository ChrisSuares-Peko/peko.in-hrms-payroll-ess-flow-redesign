import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { formatNumberWithoutCommas } from '@utils/priceFormat';

import OperatorForm from '../../forms/OperatorForm';
import { useOperatorDropdowns } from '../../hooks/useOperatorDropdowns';
import useServiceOperatorUpdate from '../../hooks/useServiceOperatorUpdate';
import { serviceOperatorSchema } from '../../schema/serviceOperator';
import { OperatorWithoutID, serviceOperator } from '../../types/serviceOperator';
import { balanceMethods, commissionTypes, serviceTypes } from '../../utils/serviceOperator';

/** Omit payment credentials from the API body when empty so we don't send "" */
function omitEmptyPaymentCredentials(values: Record<string, unknown>): Record<string, unknown> {
    const payload = { ...values };
    if (!String(payload.paymentclientid ?? '').trim()) {
        delete payload.paymentclientid;
    }
    if (!String(payload.paymentclientsecret ?? '').trim()) {
        delete payload.paymentclientsecret;
    }
    return payload;
}

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: serviceOperator;
    handleRefresh: () => void;
};

const OperatorModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const { isLoading, updateServiceOperator, handleServiceOperatorCreation } =
        useServiceOperatorUpdate();
    const { vendors, isLoading: dropdownsLoading, serviceCategories } = useOperatorDropdowns('');

    return (
        <CustomModalWithForm
            modalTitle="Service Operator Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const payload = omitEmptyPaymentCredentials(values as Record<string, unknown>);
                if (payload.oidcDetails) {
                    const oidcDetails = payload.oidcDetails as Record<string, unknown>;
                    payload.oidcDetails = {
                        ...oidcDetails,
                        redirect_uris:
                            typeof oidcDetails.redirect_uris === 'string' &&
                            oidcDetails.redirect_uris
                                ? oidcDetails.redirect_uris
                                      .split('\n')
                                      .map((uri: string) => uri.trim())
                                      .filter(Boolean)
                                : undefined,
                    };
                }
                let result;
                if (values.id) {
                    result = await updateServiceOperator(payload as serviceOperator);
                } else {
                    result = await handleServiceOperatorCreation(payload as OperatorWithoutID);
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            validationSchema={serviceOperatorSchema}
            initialValues={{
                id: data?.id || '',
                serviceProvider: data?.serviceProvider || '',
                accessKey: data?.accessKey || '',
                paymentclientid: data?.paymentclientid || '',
                paymentclientsecret: data?.paymentclientsecret || '',
                serviceCategory: data?.serviceCategory || '',
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                providerCommission: formatNumberWithoutCommas(data?.providerCommission) || '0',
                vendorId: data?.vendorId || '',
                balanceMethod: data?.balanceMethod ?? '',
                serviceType: data?.serviceType || '',
                serviceImage: data?.serviceImage || '',
                isDynamicUnitPricing: data?.isDynamicUnitPricing || false,
                fixedCommissionPerTransaction:
                    formatNumberWithoutCommas(data?.fixedCommissionPerTransaction) || '0',
                isCommissionInclGST:
                    data?.isCommissionInclGST != null ? Boolean(data.isCommissionInclGST) : true,
                recordJournalEntry:
                    data?.recordJournalEntry != null ? Boolean(data.recordJournalEntry) : true,
                oidcDetails: data?.oauth_client
                    ? {
                          client_id: data?.oauth_client?.client_id,
                          client_secret: data?.oauth_client?.client_secret,
                          client_name: data?.oauth_client?.client_name,
                          redirect_uris: data?.oauth_client?.redirect_uris
                              ? data.oauth_client.redirect_uris.join('\n')
                              : '',
                          logo_uri: data?.oauth_client?.logo_uri,
                          active: data?.oauth_client?.active,
                      }
                    : undefined,
            }}
            reinitialise
        >
            <OperatorForm
                serviceTypes={serviceTypes}
                vendors={vendors}
                balanceMethods={balanceMethods}
                commissionTypes={commissionTypes}
                dropdownsLoading={dropdownsLoading}
                serviceCategories={serviceCategories}
                data={data}
            />
        </CustomModalWithForm>
    );
};

export default OperatorModal;
