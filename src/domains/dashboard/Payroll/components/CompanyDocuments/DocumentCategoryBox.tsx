import React from 'react';

import { Typography, Col,  Flex } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

type DocumentCategoryBoxProps = {
    title: string;
    fileCount: number;
    svgIcon: string;
    path:string;
};

const DocumentCategoryBox = ({ title, fileCount, svgIcon,path }: DocumentCategoryBoxProps) => (
    <Col
     
        className=" border-gray-300 rounded-lg  hover:shadow-lg transition-shadow duration-300 cursor-pointer max-h-full  "
        style={{
            border: '1px solid #ddd',
            padding: '1.75rem',
            borderRadius: '1rem',
            marginBottom: '1rem',
        }}
    >
        <Link to={path}>
        <Flex className="h-10 w-10 bg-bgIconCard rounded-2xl" align="center" justify="center">
            <ReactSVG src={svgIcon} />
        </Flex>
        <Flex vertical className="w-full">
            <Typography.Text className="text-center mt-2 text-lg font-semibold">
                {title}
            </Typography.Text>
            <Typography.Text className="">{fileCount} Files</Typography.Text>
        </Flex>
        </Link>
    </Col>
);

export default DocumentCategoryBox;
