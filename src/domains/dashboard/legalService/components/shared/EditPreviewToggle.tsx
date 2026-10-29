import { Button, Flex } from 'antd';
import { ReactSVG } from 'react-svg';

import EditIcon from '../../assets/icons/edit.svg';
import EyeIcon from '../../assets/icons/eye.svg';

interface EditPreviewToggleProps {
    mode: 'edit' | 'preview';
    onModeChange: (mode: 'edit' | 'preview') => void;
}

const EditPreviewToggle = ({ mode, onModeChange }: EditPreviewToggleProps) => (
    <Flex align="center" className="p-1 bg-slate-50 rounded-full">
        <Button
            type="text"
            onClick={() => onModeChange('edit')}
            icon={<ReactSVG src={EditIcon} beforeInjection={svg => { svg.setAttribute('style', 'width:16px;height:16px;'); svg.setAttribute('stroke', mode === 'edit' ? '#FF3A3A' : '#6b7280'); }} />}
            className={`!w-28 !rounded-full !text-sm !font-medium font-['Roboto'] !flex !items-center !justify-center !gap-2 transition-all ${mode === 'edit' ? '!bg-white shadow-md !outline !outline-1 !outline-[#FF3A3A] !text-[#FF3A3A]' : '!text-gray-500 hover:!text-gray-700 !bg-transparent'}`}
        >
            Edit
        </Button>
        <Button
            type="text"
            onClick={() => onModeChange('preview')}
            icon={<ReactSVG src={EyeIcon} beforeInjection={svg => { svg.setAttribute('style', 'width:16px;height:16px;'); svg.setAttribute('stroke', mode === 'preview' ? '#FF3A3A' : '#6b7280'); }} />}
            className={`!w-28 !rounded-full !text-sm !font-medium font-['Roboto'] !flex !items-center !justify-center !gap-2 transition-all ${mode === 'preview' ? '!bg-white shadow-md !outline !outline-1 !outline-[#FF3A3A] !text-[#FF3A3A]' : '!text-gray-500 hover:!text-gray-700 !bg-transparent'}`}
        >
            Preview
        </Button>
    </Flex>
);

export default EditPreviewToggle;
