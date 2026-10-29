import React, { memo, useEffect, useState } from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Flex, Input, Tag, Typography, theme } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import { schema } from '../schema/schemas';

const { Text } = Typography;
type Props = {
    error: string;
    setError: (val: string) => void;
    values: string[] | undefined | false;
    email: string[] | undefined | false;
    handleTagClose: (removedValue: string) => void;
    isValidEmail: boolean | null;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validateAddEmail: () => void;
    inputValue: string;
    disabled?: boolean;
};

const ListTagsAndEmailInput = ({
    error,
    setError,
    values,
    handleTagClose,
    email,
    isValidEmail,
    handleInputChange,
    validateAddEmail,
    inputValue,
    disabled = true,
}: Props) => {
    const { xs } = useScreenSize();
    const [visibleItems, setVisibleItems] = useState<number | false | undefined>(3);
    const [showMore, setshowMore] = useState<boolean>(false);

    const handleSeeMore = () => {
        setshowMore(!showMore);
    };
    const handleSeeLess = () => {
        setVisibleItems(3);
        setshowMore(!showMore);
    };
    const validateEmail = async () => {
        try {
            await schema.validate({ email: inputValue });
            setError('');
            return true;
        } catch (validationError) {
            setError(validationError.errors[0]);
            setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
            return false;
        }
    };
    useEffect(() => {
        if (values && showMore) {
            setVisibleItems(values.length);
        }
    }, [showMore, values]);
    const {
        token: { colorPrimary },
    } = theme.useToken();
    return (
        <>
            <Flex justify="space-between" align="center">
                <Text className="tex-normal text-base">Email IDs </Text>
                {showMore ? (
                    <Text
                        className="font-bold py-3 0 cursor-pointer"
                        onClick={handleSeeLess}
                        style={{ color: xs ? 'black' : colorPrimary }}
                    >
                        Show Less
                    </Text>
                ) : (
                    visibleItems &&
                    Array.isArray(values) &&
                    visibleItems < values.length && (
                        <Text
                            className="font-bold py-3 cursor-pointer"
                            style={{ color: xs ? 'black' : colorPrimary }}
                            onClick={handleSeeMore}
                        >
                            Show More
                        </Text>
                    )
                )}
            </Flex>
            <Flex className="flex-wrap" gap={10}>
                {values &&
                    values.slice(0, visibleItems as number | undefined).map(value => (
                        <Tag
                            key={value}
                            closable
                            onClose={() => handleTagClose(value)}
                            className="h-7 flex items-center"
                            color={email && email.includes(value) ? '' : 'green'}
                        >
                            {value}
                        </Tag>
                    ))}
            </Flex>
            <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onPressEnter={async () => {
                    const valid = await validateEmail();
                    if (valid) {
                        validateAddEmail();
                    }
                }}
                disabled={disabled}
                placeholder="Enter Email ID"
                onBlur={validateEmail}
            />
            {error && (
                <Text type="danger">
                    <CloseCircleOutlined /> {error}
                </Text>
            )}

            {isValidEmail === false && (
                <Text type="danger">
                    <CloseCircleOutlined /> Email address already exists
                </Text>
            )}
        </>
    );
};

export default memo(ListTagsAndEmailInput);
