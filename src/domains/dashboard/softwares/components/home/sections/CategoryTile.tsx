import { Flex, Typography, Image } from 'antd';

import icon from '../../../../../../assets/icons/Accounts.svg';
import { IsoftwareCategory } from '../../../types';

const { Text } = Typography;
type Props = {
    category: IsoftwareCategory;
    navigateAndUpdateStore: (weburl: string) => void;
    tileIconSize: number;
};

const CategoryTile = ({ category, navigateAndUpdateStore, tileIconSize }: Props) => (
    <Flex
        className="inline-flex items-center gap-1 lg:gap-2 px-2 py-1 lg:px-3 lg:py-2 rounded-xl bg-white border border-gray-200 cursor-pointer"
        onClick={() => {
            navigateAndUpdateStore(category.weburl);
        }}
    >
        <Image
            src={category.icon || icon}
            preview={false}
            width={tileIconSize}
            height={tileIconSize}
             onError={e => {
                        e.currentTarget.src = icon;
                    }}
            />
        <Text className="font-medium text-xs lg:text-base  text-[#364153] whitespace-nowrap">
            {category.name}
        </Text>
    </Flex>
);

export default CategoryTile;
