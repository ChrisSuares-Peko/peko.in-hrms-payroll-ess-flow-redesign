import { useAppSelector } from '@src/hooks/store';

import AddressFormContent from './AddressFormContent';
import { AddressFieldValue } from '../../types/address';

interface Props {
    open: boolean;
    isReceiver: boolean;
    onClose: () => void;
    onSaved?: () => void;
    editAddressData?: AddressFieldValue;
}

const AddAddressModal = ({ open, isReceiver, onClose, onSaved, editAddressData }: Props) => {
    const { shipmentType } = useAppSelector(state => state.reducer.logisticsV3);
    const isInternationalReceiver = isReceiver && shipmentType === 'international';

    if (!open) return null;

    return (
        <AddressFormContent
            isReceiver={isReceiver}
            isInternationalReceiver={isInternationalReceiver}
            onClose={onClose}
            onSaved={onSaved}
            editAddressData={editAddressData}
        />
    );
};

export default AddAddressModal;
