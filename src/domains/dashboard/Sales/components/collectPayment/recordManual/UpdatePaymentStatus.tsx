import { Modal } from 'antd';

import RecordManually from './RecordManually';
import { PaymentRow } from '../../../utils/table_column/paymentTrackingColumns';
import Invoicesummary from '../../shared/Invoicesummary';

type Props = {
    open: boolean;
    editRow: PaymentRow | null;
    onClose: () => void;
    onPaymentSaved?: () => void;
};

function UpdatePaymentStatus({ open, editRow, onClose, onPaymentSaved }: Props) {
    return (
        <Modal
            open={open}
            onCancel={onClose}
            width={520}
            centered
            footer={null}
            closable={false}
            destroyOnHidden
            className="[&_.ant-modal-content]:rounded-[20px] [&_.ant-modal-content]:p-7"
        >
            <Invoicesummary
                title="Update Payment Status"
                description="Log an offline or received payment"
                customerName={editRow?.customer || ''}
                invoiceNo={editRow?.invoiceRef || ''}
                amount={editRow?.amount || 0}
            />
            <RecordManually
                invoice={null}
                onCancel={onClose}
                onPaymentSuccess={onPaymentSaved ?? onClose}
            />
        </Modal>
    );
}

export default UpdatePaymentStatus;
