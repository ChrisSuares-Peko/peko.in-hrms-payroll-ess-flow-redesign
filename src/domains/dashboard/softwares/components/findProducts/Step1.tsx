import React from 'react';

import { Button, Flex, Radio, Typography } from 'antd';
import { NavigateFunction } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { IRfpCategory } from '../../types';

const { Text } = Typography;

type Step1Props = {
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    categoryList: IRfpCategory[];
    navigate: NavigateFunction;
    fetchGeneralQ: () => Promise<void>;
    isLoading: boolean;
};

const Step1 = ({
    selectedCategory,
    setSelectedCategory,
    categoryList,
    navigate,
    fetchGeneralQ,
    isLoading,
}: Step1Props) => (
    <>
        <Text className="sm:text-lg font-medium">Select a category</Text>

        <Radio.Group
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full mt-6"
        >
            <Flex className="flex flex-col gap-4">
                {categoryList.map(c => (
                    <Radio
                        key={c.weburl}
                        value={c.weburl}
                        className="border rounded-lg px-4 py-3 text-sm "
                    >
                        {c.name}
                    </Radio>
                ))}
            </Flex>
        </Radio.Group>

        <Flex className="mt-10" gap={10}>
            <Button danger onClick={() => navigate(`/${paths.softwares.index}`)} className="w-1/2">
                Go Back
            </Button>

            <Button
                type="primary"
                danger
                onClick={fetchGeneralQ}
                loading={isLoading}
                className="w-1/2"
            >
                Next
            </Button>
        </Flex>
    </>
);

export default Step1;
