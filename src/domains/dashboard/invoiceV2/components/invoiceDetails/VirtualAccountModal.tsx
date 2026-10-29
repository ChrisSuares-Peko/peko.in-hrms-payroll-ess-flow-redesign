import { Button, Card, Col, Flex, Modal, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import globIcon from '../../assets/icons/global.svg';
import { VirtualAccountDetails } from '../../types/invoiceDetails';
import { DUMMY_VIRTUAL_ACCOUNT_DETAILS } from '../../utils/dummyData';
import CopyableRow from '../shared/CopyableRow';
import InfoItem from '../shared/InfoItem';
import LeftHeader from '../shared/LeftHeader';

interface VirtualAccountModalProps {
    open: boolean;
    onCancel: () => void;
    onShare?: () => void;
    details?: VirtualAccountDetails;
}

const VirtualAccountModal = ({ open, onCancel, onShare, details }: VirtualAccountModalProps) => {
    const data = { ...DUMMY_VIRTUAL_ACCOUNT_DETAILS, ...details };

    const fullWidthRows = [
        { label: 'Account Name', value: data.accountName! },
        { label: 'Bank Name', value: data.bankName! },
        { label: 'IBAN', value: data.iban! },
        { label: 'SWIFT/BIC Code', value: data.swiftCode! },
        { label: 'Account Number', value: data.accountNumber! },
    ];

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width={560}
            closable={false}
            destroyOnHidden
            className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:overflow-hidden"
            styles={{ body: { maxHeight: '85vh', overflowY: 'auto' } }}
        >
            <Flex vertical gap={16} className="p-7">
                <LeftHeader
                    title="Virtual Account Details"
                    description="Share these details with your customer"
                />

                <InfoItem
                    icon={<ReactSVG src={globIcon} />}
                    iconBgClass="bg-[#FEF2F2] !w-14"
                    title={`Virtual IBAN for ${data.companyName}`}
                    description={`This virtual account is dedicated for receiving payment for invoice ${data.invoiceNo}. Funds received will be automatically reconciled.`}
                    className="bg-[#F8FAFC] border-1"
                />

                <Card className="rounded-2xl">
                    <Flex vertical gap={12}>
                        <LeftHeader
                            title="Bank Account Information"
                            titleClass="text-base font-medium"
                        />
                        {fullWidthRows.map(row => (
                            <CopyableRow
                                key={row.label}
                                title={row.label}
                                description={row.value}
                            />
                        ))}
                        <Row gutter={12}>
                            <Col span={12}>
                                <CopyableRow title="Currency" description={data.currency!} />
                            </Col>
                            <Col span={12}>
                                <CopyableRow
                                    title="Routing Number"
                                    description={data.routingNumber!}
                                />
                            </Col>
                        </Row>
                        <CopyableRow title="Bank Address" description={data.bankAddress!} />
                    </Flex>
                </Card>

                <Flex className="px-4 py-3 bg-amber-50 rounded-xl border border-amber-200" gap={8}>
                    <Typography.Text className="text-[#475569] text-xs">
                        <Typography.Text className="text-[#475569] text-sm font-medium">
                            Important:
                        </Typography.Text>{' '}
                        Please ensure your customer includes the invoice number ({data.invoiceNo})
                        as a reference when making the payment for automatic reconciliation.
                    </Typography.Text>
                </Flex>

                <Flex gap={12}>
                    <Button block className="h-10 text-[#475569]" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        danger
                        block
                        className="h-10"
                        onClick={onShare ?? onCancel}
                    >
                        Share with Customer
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default VirtualAccountModal;
