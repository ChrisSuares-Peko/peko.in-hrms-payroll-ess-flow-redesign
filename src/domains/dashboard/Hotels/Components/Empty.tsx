import React from 'react';

import { Flex, Image, Typography } from 'antd';

import nohotel from '@domains/dashboard/Hotels/Assets/noResults.png';

const Empty = () => (
    <Flex vertical gap={30} justify="center" align="center" style={{ height: '60vh' }}>
        <Image height={200} width={250} src={nohotel} preview={false} />
        <Typography.Text className="mt-4 text-[#8C8C8C] text-center md:text-base">
            We couldn&apos;t find any hotels matching your search criteria. <br />
            Please try adjusting your search filters, such as dates or locations, and search again.
        </Typography.Text>
    </Flex>
);

export default Empty;
