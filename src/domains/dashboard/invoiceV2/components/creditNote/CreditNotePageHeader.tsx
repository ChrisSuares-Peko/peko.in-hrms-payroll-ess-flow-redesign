import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { GetInvoiceByIdResponse } from '../../types/invoice';

interface Props {
    selectedInvoice: GetInvoiceByIdResponse;
    onChangeInvoice: () => void;
}

const CreditNotePageHeader = ({ selectedInvoice, onChangeInvoice }: Props) => {
    const navigate = useNavigate();
    const invoiceNo = `${selectedInvoice.prefix ?? ''}${selectedInvoice.invoiceNumber}`;

    return (
        <div className="mb-4">
            <Flex justify="space-between" align="center" className="mb-4">
                <Typography.Title level={4} className="!mb-0">
                    Create Credit Note
                </Typography.Title>
                <Button onClick={() => navigate(`/${paths.invoice.index}/credit-notes`)}>
                    Back
                </Button>
            </Flex>

            <Flex
                justify="space-between"
                align="flex-start"
                wrap="wrap"
                gap={8}
                className="rounded-xl px-5 py-3 bg-[#ECFDF5]"
            >
                <Typography.Text className="text-sm text-gray-700">
                    Crediting{' '}
                    <strong className="text-gray-900">{invoiceNo}</strong>
                    {' · '}
                    {selectedInvoice.name}
                    {' · ₹'}
                    {Number(selectedInvoice.totalAmount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                    })}
                </Typography.Text>
                <Flex
                    align="center"
                    gap={6}
                    className="cursor-pointer text-sm font-medium text-[#43B75D] hover:opacity-80 transition-opacity shrink-0"
                    onClick={onChangeInvoice}
                >
                    <CloseCircleOutlined />
                    Change invoice
                </Flex>
            </Flex>
        </div>
    );
};

export default CreditNotePageHeader;
