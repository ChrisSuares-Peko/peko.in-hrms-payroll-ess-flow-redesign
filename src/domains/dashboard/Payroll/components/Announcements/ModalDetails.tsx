import React from 'react';

import { Typography } from 'antd';

type Props = {
    title: string;
    text: string | number;
};
const ModalDetails = ({ text, title }: Props) => (
    <>
        <Typography.Text className="text-base font-medium me-1"> {title} </Typography.Text>
        <Typography.Text className="text-base">{text}</Typography.Text>
    </>
);

export default ModalDetails;
