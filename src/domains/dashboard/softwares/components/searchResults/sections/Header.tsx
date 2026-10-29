import { Flex, Typography } from 'antd';

import { useSearchResultContext } from '../../../contexts/SearchPageContext';

const { Text } = Typography;

const Header = () => {
    const { query, productsCount, isLoading } = useSearchResultContext();
    return (
        <Flex vertical className="w-full gap-2 justify-start items-start">
            <Text className="font-medium text-2xl">Your results for &ldquo;{query}&ldquo;</Text>
            {!isLoading && (
                <Text className="font-regular text-base text-[#868686]">
                    {productsCount} results found. Showing top matches by relevance score
                </Text>
            )}
        </Flex>
    );
};

export default Header;
