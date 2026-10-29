import React from 'react';

import { Flex, Typography } from 'antd';

interface desc {
    suppliments?: any;
}
const Supplements = ({ suppliments }: desc) => {
    const formatSupplementDetails = (supplement: any) => {
        const formatText = (text: string) =>
            text
                ?.replace(/_/g, ' ') // Replace underscores with spaces
                .split(' ') // Split by space
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize
                .join(' '); // Join back

        return {
            formattedType: formatText(supplement?.Type),
            formattedDescription: formatText(supplement?.Description),
        };
    };

    const {  formattedDescription } = formatSupplementDetails(suppliments?.[0]?.[0]);
   
    return (
        <>
            {suppliments && (
                <Flex
                    className="w-full rounded-[28px] mt-8 border border-[#ececec] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
                    style={{ backgroundColor: '#ECF7FF' }}
                >
                    <Flex vertical gap={7} className="py-5 px-7">
                        <Flex vertical>
                            <Typography.Text className="">
                                {' '}
                                Additional Charges (to be paid at hotel):
                            </Typography.Text>

                            {suppliments?.[0]?.map((items: any) => (
                                <Flex gap={3} className="mt-1">
                                    <Typography.Text className="">
                                        {`${formattedDescription}: `}
                                    </Typography.Text>
                                    <Typography.Text className=" font-medium">
                                        {`${items.Currency} ${items.Price}`}
                                    </Typography.Text>
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>
                </Flex>
            )}
        </>
    );
};

export default Supplements;
