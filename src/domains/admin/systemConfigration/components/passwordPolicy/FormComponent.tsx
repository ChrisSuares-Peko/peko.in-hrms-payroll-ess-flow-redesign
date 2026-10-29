import React from 'react';

import { Button, Col, Flex, Row, Slider, Typography } from 'antd';
import { useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

type props = {
    values: any;
    isLoading: boolean;
    id?: number;
    accessPermission: any;
};
const FormComponent = ({ values, isLoading, id, accessPermission }: props) => {
    const { handleSubmit, setFieldValue } = useFormikContext();
    const onClickSubmit = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        handleSubmit();
    };
    const getLabelandDescription = (number: number, label: string, description: string) => {
        if (number === 2) {
            return (
                <Flex vertical className="w-full" align="start" justify="end" gap={5}>
                    <Typography.Text
                        className="text-lg font-normal text-titleText cursor-pointer"
                        onClick={() => setFieldValue('level', number)}
                    >
                        {label}
                    </Typography.Text>
                    <TextInput
                        isDisabled={values.level === 1}
                        name="minLength"
                        type="text"
                        classes=" rounded-sm "
                        allowNumbersOnly
                    />
                    <Typography.Text className="text-xs -mt-3 font-medium">
                        {description}
                    </Typography.Text>
                </Flex>
            );
        }
        return (
            <Flex vertical className="w-full" align="start" gap={5}>
                <Typography.Text
                    className="text-lg font-normal text-titleText cursor-pointer"
                    onClick={() => setFieldValue('level', number)}
                >
                    {label}
                </Typography.Text>
                <Typography.Text className="text-sm font-medium">{description}</Typography.Text>
            </Flex>
        );
    };

    return (
        <>
            <Typography.Text className="text-lg font-medium">
                Select Password Strength
            </Typography.Text>
            {accessPermission?.update && (
                <Flex vertical className="pb-16 pt-2">
                    <Slider
                        value={values.level}
                        autoFocus
                        tooltip={{
                            open: false,
                        }}
                        dots
                        min={1}
                        max={5}
                        className="w-4/5"
                        included
                        onChange={e => setFieldValue('level', e)}
                    />
                    <Flex className="-mt-1">
                        {getLabelandDescription(1, 'Level 1', 'Non-empty required')}
                        {getLabelandDescription(2, 'Level 2', 'Characters at least in length')}
                        {getLabelandDescription(3, 'Level 3', 'Lowercase, uppercase, numbers')}
                        {getLabelandDescription(4, 'Level 4', 'Special characters [!@#$%]')}
                        {getLabelandDescription(
                            5,
                            'Level 5',
                            'No more than 2 identical characters in a row'
                        )}
                    </Flex>
                </Flex>
            )}
            <Row gutter={[20, 10]} className="w-full xxl:w-3/5">
                <Col xs={24} md={12}>
                    <TextInput
                        name="minChangeChars"
                        label="Number Of Characters Change On Update"
                        type="text"
                        isRequired
                        classes=" rounded-sm"
                        allowNumbersOnly
                        showToolTip
                        tooltipText="Number of characters to change on Change Password"
                        isDisabled={!accessPermission?.update}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        name="maxPasswordAge"
                        label="Maximum Password Age"
                        type="text"
                        isRequired
                        classes=" rounded-sm"
                        allowNumbersOnly
                        showToolTip
                        tooltipText="Number of days after which user will be enforced to change password."
                        isDisabled={!accessPermission?.update}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <TextInput
                        showToolTip
                        name="prohibitPasswordReuseTimes"
                        label="Prohibit Password Reuse for a Minimum of"
                        type="text"
                        isRequired
                        classes=" rounded-sm"
                        allowNumbersOnly
                        tooltipText="Prevent from reusing the same old password."
                        isDisabled={!accessPermission?.update}
                    />
                </Col>
                <Col xs={24}>
                    <Flex className="w-full " justify="flex-start" gap={10} key="">
                        {accessPermission && accessPermission.update && (
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                className="px-5"
                                onClick={onClickSubmit}
                                loading={isLoading}
                            >
                                Save
                            </Button>
                        )}
                    </Flex>
                </Col>
            </Row>
        </>
    );
};

export default FormComponent;
