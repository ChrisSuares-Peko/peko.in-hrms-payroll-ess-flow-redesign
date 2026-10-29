import { useRef, useState } from 'react';

import { FormikProps } from 'formik';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
// import { commonSelectType } from '@customtypes/general';

import useGiftCardsUpdate from '../../hooks/useGiftCardUpdate';
import { giftCardSchema } from '../../schema/giftCards';
import { GiftCardsBody, GiftCardsFormValues } from '../../types/giftCards';
import { priceTypes, usageTypes } from '../../utils/giftCards';
import GiftCardForm from '../forms/GiftCardForm';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: GiftCardsBody;
    handleRefresh: () => void;
};

// Both vendors (Xoxoday, Edenred) write to the same gift card record, but each
// only populates a subset of the "type" columns: Edenred sets is_open_denominnation
// / gv_type, Xoxoday sets priceType / usageType. priceType is the only field used
// for denomination type — is_open_denominnation is only read as a fallback when
// deriving its initial value, never written back. Usage type is edited via a
// single "usageType" form field, but is routed back to whichever column the
// record actually uses (see deriveUsageField below) since gv_type is Edenred's
// column and usageType is Xoxoday's.
const matchOptionValue = (options: { oValue: string }[], raw?: string | null) => {
    if (!raw) return '';
    const match = options.find(({ oValue }) => oValue.toLowerCase() === raw.toLowerCase());
    return match ? match.oValue : '';
};

const derivePriceType = (data?: GiftCardsBody) =>
    matchOptionValue(priceTypes, data?.priceType) ||
    (data?.is_open_denominnation ? 'FLEXI' : 'FIXED');

const deriveUsageType = (data?: GiftCardsBody) =>
    matchOptionValue(usageTypes, data?.usageType) || matchOptionValue(usageTypes, data?.gv_type);

// Usage type lives in a different column per vendor: `gv_type` for Edenred,
// `usageType` for Xoxoday. Detect which one the record already uses and send
// the dropdown's value under that key only; default new records to usageType.
const deriveUsageField = (data?: GiftCardsBody): 'gv_type' | 'usageType' =>
    !data?.usageType && data?.gv_type ? 'gv_type' : 'usageType';

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const [selectedDenominationType, setSelectedDenominationType] = useState(derivePriceType(data));
    const [selectedGVType, setSelectedGVType] = useState(deriveUsageType(data) || null);

    const handleDenominationTypeChange = (isOpenOrFixed: any) => {
        setSelectedDenominationType(isOpenOrFixed);
    };
    const handleGVTypeChange = (GVType: any) => {
        setSelectedGVType(GVType);
    };
    const GiftCardsFormRef = useRef<FormikProps<GiftCardsFormValues>>(null);
    const { isLoading, handleGiftCardsCreation, updateGiftCardsDetails } = useGiftCardsUpdate();
    return (
        <CustomModalWithForm
            modalTitle="Gift Card Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let result;
                const usageField = deriveUsageField(data);
                if (usageField === 'gv_type') {
                    values.gv_type = values.usageType;
                    delete values.usageType;
                }
                if (values.id) {
                    result = await updateGiftCardsDetails(values);
                } else {
                    result = await handleGiftCardsCreation(values);
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            initialValues={{
                id: data?.id || '',
                product_name: data?.product_name || '',
                product_id: data?.product_id || '',
                priceType: derivePriceType(data),
                usageType: deriveUsageType(data),
                // mrp: data?.mrp || '',
                // selling_price: data?.selling_price || '',
                max_price: data?.max_price || '',
                min_price: data?.min_price || '',
                denominations: data?.denominations,
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: data?.commission || 0,
                fixedCommissionPerTransaction: data?.fixedCommissionPerTransaction || 0,
                isCommissionInclGST:
                    data?.isCommissionInclGST != null ? Boolean(data.isCommissionInclGST) : true,
            }}
            validationSchema={giftCardSchema}
            formRefName={GiftCardsFormRef}
            reinitialise
        >
            {({ setFieldValue }) => (
                <GiftCardForm
                    selectedDenominationType={selectedDenominationType}
                    selectedGVType={selectedGVType}
                    handleDenominationTypeChange={handleDenominationTypeChange}
                    handleGVTypeChange={handleGVTypeChange}
                    GiftCardsFormRef={GiftCardsFormRef}
                    setFieldValue={setFieldValue}
                />
            )}
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
