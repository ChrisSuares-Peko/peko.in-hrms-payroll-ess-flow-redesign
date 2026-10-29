import { LockOutlined } from '@ant-design/icons';
import { Col, Form, Input, Row, Tooltip } from 'antd';

import { GetInvoiceByIdResponse } from '../../types/invoice';

interface Props {
    inv: GetInvoiceByIdResponse;
}

const lockedTitle = (
    <span className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Customer Details
        </span>
        <Tooltip title="Customer is locked — it mirrors the original invoice">
            <LockOutlined style={{ opacity: 0.5, fontSize: 12 }} />
        </Tooltip>
    </span>
);

const LockedCustomerSection = ({ inv }: Props) => {
    const address = [inv.address, inv.city, inv.state, inv.pincode].filter(Boolean).join(', ');

    const fields = [
        { label: 'Name', value: inv.name, fullWidth: false },
        { label: 'Email', value: inv.email, fullWidth: false },
        { label: 'Address', value: address, fullWidth: true },
        { label: 'Phone', value: inv.phoneNumber, fullWidth: false },
        { label: 'GSTIN', value: inv.gstNumber, fullWidth: false },
    ];

    return (
        <div>
            <div className="flex items-center mb-3">{lockedTitle}</div>
            <Form layout="vertical" className="w-full">
                <Row gutter={[12, 0]}>
                    {fields.map(({ label, value, fullWidth }) => (
                        <Col key={label} xs={24} sm={fullWidth ? 24 : 12}>
                            <Form.Item label={label} className="mb-2.5">
                                <Input value={value || '—'} disabled />
                            </Form.Item>
                        </Col>
                    ))}
                </Row>
            </Form>
        </div>
    );
};

export default LockedCustomerSection;
