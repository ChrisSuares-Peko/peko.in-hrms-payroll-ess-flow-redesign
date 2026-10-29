import { Button, Flex } from 'antd';

import { RECENT_DOC_TABS } from '../../constants';

interface DocTabFilterProps {
    activeTab: string;
    onChange: (tab: string) => void;
}

const DocTabFilter = ({ activeTab, onChange }: DocTabFilterProps) => (
    <Flex className="w-full bg-gray-100 rounded-full px-1 py-0.5">
        {RECENT_DOC_TABS.map(tab => (
            <Button
                key={tab}
                type="text"
                onClick={() => onChange(tab)}
                className={`flex-1 rounded-full text-sm font-medium leading-6 font-['Roboto'] transition-colors ${
                    activeTab === tab
                        ? '!border !border-[#FF3A3A] !text-[#FF3A3A] !bg-white'
                        : '!border-0 !text-gray-500 hover:!text-[#FF3A3A] !bg-transparent'
                }`}
            >
                {tab}
            </Button>
        ))}
    </Flex>
);

export default DocTabFilter;
