import React, { useEffect, useState } from 'react';

import { Flex, Image, Typography, Tag, Radio, Row, Col } from 'antd';

import locationImage from '@domains/dashboard/OfficeAddress/assets/icons/officespace.png';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { setPlanData } from '../slices';
import { WorkspaceDetail } from '../types/index';

interface LocationCardProps {
    data: WorkspaceDetail;
    buttonState: number;
}

const LocationCard = ({ data, buttonState }: LocationCardProps) => {
    const { id, address: description, logo, name: location, features } = data;

    const dispatch = useAppDispatch();
    const state = useAppSelector(planState => planState.reducer.plan);
    const handleChange = () => {
        setErrorMessage('');
        dispatch(setPlanData({ ...state, workspaceId: id }));
    };
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (buttonState !== 0 && state.workspaceId === null) {
            setErrorMessage('Please select location');
        } else {
            setErrorMessage('');
        }
    }, [buttonState, state.workspaceId]);

    return (
        <Row>
            <Col span={8}>
                <Image
                    className="w-full rounded-md object-cover"
                    height="100%"
                    src={logo || locationImage}
                    alt="Icon"
                />
            </Col>
            <Col span={15} offset={1}>
                <Flex vertical>
                    <Typography.Paragraph className="text-lg ">{location}</Typography.Paragraph>
                    <Typography.Paragraph className=" text-titleDescription text-sm mt-2">
                        {description}
                    </Typography.Paragraph>
                    <Flex>
                        {features &&
                            features?.length > 0 &&
                            features.map((feature: string) => (
                                <Tag className=" mt-3 w-15" bordered={false} color="red">
                                    {feature}
                                </Tag>
                            ))}
                    </Flex>
                    <Flex vertical className="mt-8">
                        <Radio checked={state.workspaceId === id} onChange={handleChange}>
                            Select this
                        </Radio>
                        {errorMessage !== '' && (
                            <Typography.Text className="text-red-500">
                                {errorMessage}
                            </Typography.Text>
                        )}
                    </Flex>
                </Flex>
            </Col>
        </Row>
    );
};

export default LocationCard;
