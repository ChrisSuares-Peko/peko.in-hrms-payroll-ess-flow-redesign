import React from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Typography, Col,  Flex, Button } from 'antd';
import { ReactSVG } from 'react-svg';

type OnBoardingDocumentsProps = {
    title: string;
   
    svgIcon: string;
};

const OnBoardingDocCard = ({ title,  svgIcon }: OnBoardingDocumentsProps) => (
    <Col
     
        className=" border-gray-300 rounded-lg  hover:shadow-lg transition-shadow duration-300 cursor-pointer max-h-full  "
        style={{
            border: '1px solid #ddd',
            padding: '1.75rem',
            borderRadius: '1rem',
            marginBottom: '1rem',
        }}
    >
        <Flex className="h-10 w-10 bg-bgIconCard rounded-2xl" align="center" justify="center">
            <ReactSVG src={svgIcon} />
       
        <Flex vertical className="w-full" justify="space-between" align="center">
            <Typography.Text className="text-center mt-2 text-lg font-semibold">
                {title}
            </Typography.Text>
           <Button icon={<DownloadOutlined/>}>Download</Button>
        </Flex>
        </Flex>
    </Col>
);

export default OnBoardingDocCard;
