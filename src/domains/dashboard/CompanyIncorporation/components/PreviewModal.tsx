import { CloseOutlined } from '@ant-design/icons';
import { Modal, Button } from 'antd';

const SECTION_DIVIDER = '━'.repeat(54);

interface PreviewModalProps {
    visible: boolean;
    title: string;
    content: string;
    onClose: () => void;
}

const PreviewModal = ({ visible, title, content, onClose }: PreviewModalProps) => {
    const sections = content.split(SECTION_DIVIDER);

    return (
        <Modal
            title={title}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
            className="!rounded-[16px]"
            closeIcon={<CloseOutlined />}
            bodyStyle={{
                maxHeight: '70vh',
                overflowY: 'auto',
                padding: '32px',
            }}
        >
            <div className="space-y-6">
                <div className="bg-bgGrayF9 rounded-[12px] p-8 border border-borderGrayLight">
                    {sections.map((section, i) => (
                        <span key={i}>
                            <p className="text-[14px] leading-relaxed text-[#425466] font-normal whitespace-pre-wrap">
                                {section}
                            </p>
                            {i < sections.length - 1 && (
                                <hr className="border-[#d0d0d0] my-3" />
                            )}
                        </span>
                    ))}
                </div>

                <div className="flex gap-4 justify-end">
                    <Button
                        type="primary"
                        onClick={onClose}
                        className="!bg-lightRed hover:!bg-lightRedHover !h-[40px] !px-6 !rounded-[6px] transition-colors"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PreviewModal;
