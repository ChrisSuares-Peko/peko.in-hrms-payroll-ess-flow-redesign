import { CloseCircleOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

import { SOFTWARE_OPTIONS } from '../utils/data';

interface OtherImportsModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (softwareId: string) => void;
}

const OtherImportsModal = ({ open, onClose, onSelect }: OtherImportsModalProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        closable={false}
        width={600}
        centered
        styles={{
            content: { padding: 0, borderRadius: 20, overflow: 'hidden' },
            body: { padding: 0 },
        }}
    >
        {/* Header */}
        <Flex align="flex-start" justify="space-between" className="px-8 pt-8 pb-6">
            <Flex vertical gap={6}>
                <Typography.Title
                    level={3}
                    className="!mb-0 !font-bold text-[#0f172a]"
                    style={{ lineHeight: '36px' }}
                >
                    Upload from software
                </Typography.Title>
                <Typography.Text className="text-sm text-[#64748b]" style={{ lineHeight: '22px' }}>
                    Choose how you want to bring in your invoices
                </Typography.Text>
            </Flex>
            <Button
                type="text"
                icon={<CloseCircleOutlined style={{ fontSize: 22, color: '#94a3b8' }} />}
                onClick={onClose}
                style={{ padding: 0, height: 'auto', marginTop: 2 }}
            />
        </Flex>

        {/* Divider */}
        <div className="border-t border-[#f1f5f9]" />

        {/* Software list */}
        <Flex vertical className="pb-2">
            {SOFTWARE_OPTIONS.map(opt => (
                <button
                    key={opt.id}
                    type="button"
                    className="w-full text-left px-8 py-[18px] border-b border-[#f8fafc] last:border-b-0 hover:bg-[#f8fafc] transition-colors flex items-center justify-between"
                    onClick={() => onSelect(opt.id)}
                >
                    <Flex gap={16} align="center">
                        <Flex
                            align="center"
                            justify="center"
                            className="rounded-2xl flex-shrink-0 font-bold"
                            style={{
                                width: 56,
                                height: 56,
                                backgroundColor: '#dcfce7',
                                color: '#16a34a',
                                fontSize: 20,
                                letterSpacing: 0,
                            }}
                        >
                            {opt.initial}
                        </Flex>
                        <Flex vertical gap={4}>
                            <Typography.Text
                                className="font-bold text-[#0f172a]"
                                style={{ fontSize: 16, lineHeight: '24px' }}
                            >
                                {opt.name}
                            </Typography.Text>
                            <Typography.Text
                                className="text-sm text-[#64748b]"
                                style={{ lineHeight: '20px' }}
                            >
                                {opt.description}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    <RightOutlined className="text-[#94a3b8]" style={{ fontSize: 14 }} />
                </button>
            ))}
        </Flex>
    </Modal>
);

export default OtherImportsModal;
