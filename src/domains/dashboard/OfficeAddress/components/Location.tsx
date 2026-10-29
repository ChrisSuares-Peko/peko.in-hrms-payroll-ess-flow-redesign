import React from 'react';

import { Flex, Image, Typography, Tag, Radio } from 'antd';

import locationImage from '@domains/dashboard/OfficeAddress/assets/icons/officespace.png';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { setPlanData } from '../slices';
import { WorkspaceDetail } from '../types/index';

interface LocationProps {
    data: WorkspaceDetail;
}

const Location = ({ data }: LocationProps) => {
    const { id, address: description, logo, name: location, features } = data;

    const dispatch = useAppDispatch();
    const state = useAppSelector(planState => planState.reducer.plan);

    const handleChange = () => {
        dispatch(setPlanData({ ...state, workspaceId: id }));
    };
    return (
        <Flex vertical gap={20} className="border p-5 rounded-xl">
            <Image className="mt-1 rounded-xl" src={logo || locationImage} alt="Icon" />
            <Flex vertical>
                <Flex align="center" justify="">
                    <Typography.Paragraph className="text-md">{location}</Typography.Paragraph>

                    {features &&
                        features?.length > 0 &&
                        features.map((feature: string) => (
                            <Tag className=" w-15 ml-7" bordered={false} color="red">
                                {feature}
                            </Tag>
                        ))}
                </Flex>

                <Typography.Paragraph className="  text-sm text-titleDescription ">
                    {description}
                </Typography.Paragraph>
                <Flex className="mt-5">
                    <Radio checked={state.workspaceId === id} onChange={handleChange}>
                        Select this
                    </Radio>
                </Flex>
            </Flex>
        </Flex>
    );
};
export default Location;
