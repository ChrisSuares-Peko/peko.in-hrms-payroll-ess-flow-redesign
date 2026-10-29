import { Flex, Modal, Radio, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

type Props = {
    open: boolean;
    onClose: () => void;
};

const OPTIONS = [
    {
        key: 'new-hire',
        title: 'New Hire',
        description: 'Send an offer letter and pre-board them before their joining date.',
    },
    {
        key: 'existing',
        title: 'Existing Employee',
        description: 'Add their record and optionally send ESS access now.',
    },
];

const AddEmployeeModal = ({ open, onClose }: Props) => {
    const navigate = useNavigate();

    const handleSelect = (type: string) => {
        onClose();
        const page = type === 'new-hire' ? paths.payroll.addNewHire : paths.payroll.addEmployee;
        navigate(`/${paths.payroll.index}/${paths.payroll.employees}/${page}`);
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={520}
            title={
                <Flex vertical align="center" gap={2} className="pt-2">
                    <Typography.Title level={4} className="!m-0">
                        Add Employee
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Choose how you&rsquo;d like to add this person
                    </Typography.Text>
                </Flex>
            }
        >
            <Flex vertical gap={16} className="py-4">
                {OPTIONS.map(option => (
                    <Flex
                        key={option.key}
                        align="flex-start"
                        gap={12}
                        onClick={() => handleSelect(option.key)}
                        className="cursor-pointer rounded-xl border border-solid border-[#e5e7eb] p-4 transition-colors hover:border-brandColor"
                    >
                        <Radio className="mt-1" />
                        <Flex vertical>
                            <Typography.Text className="font-semibold text-black">
                                {option.title}
                            </Typography.Text>
                            <Typography.Text type="secondary" className="text-xs">
                                {option.description}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </Modal>
    );
};

export default AddEmployeeModal;
