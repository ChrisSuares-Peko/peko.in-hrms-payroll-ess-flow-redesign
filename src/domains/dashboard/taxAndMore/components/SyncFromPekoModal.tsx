import { SyncOutlined } from '@ant-design/icons';
import { Flex, Modal, Typography } from 'antd';

interface SyncFromPekoModalProps {
    open: boolean;
    monthLabel: string;
}

const SyncFromPekoModal = ({ open, monthLabel }: SyncFromPekoModalProps) => (
    <Modal
        open={open}
        footer={null}
        closable={false}
        maskClosable={false}
        width={600}
        centered
        styles={{
            content: {
                padding: 0,
                borderRadius: 20,
                overflow: 'hidden',
                border: '1px solid #cbd5e1',
            },
            body: { padding: 0 },
            mask: { backgroundColor: 'rgba(0,0,0,0.5)' },
        }}
    >
        {/* Header */}
        <div className="bg-white border-b border-[#cbd5e1] px-6 py-[14px] rounded-tl-[14px] rounded-tr-[14px]">
            <Typography.Text
                className="font-semibold text-[#1e293b]"
                style={{ fontSize: 20, lineHeight: '28px' }}
            >
                Synching invoices for {monthLabel}....
            </Typography.Text>
        </div>

        {/* Body */}
        <Flex
            vertical
            align="center"
            justify="center"
            gap={18}
            className="bg-white rounded-bl-[14px] rounded-br-[14px] px-6 py-5"
            style={{ height: 259 }}
        >
            <Flex
                align="center"
                justify="center"
                className="rounded-[16px] border border-[#fca5a5] bg-[#fef2f2] flex-shrink-0"
                style={{ width: 64, height: 64 }}
            >
                <SyncOutlined spin className="text-brandColor" style={{ fontSize: 24 }} />
            </Flex>

            <Flex vertical gap={4} align="center" style={{ width: 483 }}>
                <Typography.Text
                    className="font-semibold text-[#1f2937] text-center w-full"
                    style={{ fontSize: 18, lineHeight: '26px' }}
                >
                    Syncing from Peko Invoicing
                </Typography.Text>
                <Typography.Text
                    className="text-[#475569] text-center w-full"
                    style={{ fontSize: 14, lineHeight: '22px' }}
                >
                    Pulling your invoices for {monthLabel}…
                </Typography.Text>
            </Flex>
        </Flex>
    </Modal>
);

export default SyncFromPekoModal;
