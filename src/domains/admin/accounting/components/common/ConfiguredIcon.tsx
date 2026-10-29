import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

const ConfiguredIcon = ({
    configured,
    onToggle,
}: {
    configured: boolean;
    onToggle?: () => void;
}) => {
    const Icon = configured ? CheckOutlined : CloseOutlined;
    return (
        <Icon
            className={`text-base ${configured ? 'text-textLime' : 'text-brandColor'} ${
                onToggle ? 'cursor-pointer' : ''
            }`}
            onClick={
                onToggle
                    ? (event: React.MouseEvent) => {
                          event.stopPropagation();
                          onToggle();
                      }
                    : undefined
            }
        />
    );
};

export default ConfiguredIcon;
