import React from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Image, Typography, Empty, Tooltip } from 'antd';
// import clevertap from 'clevertap-web-sdk';
import { Link } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import useTextTruncation from '@src/hooks/useTextTruncation';
import { paths } from '@src/routes/paths';

import { workData } from '../type';

const WorksCard = ({ id, workTitle, workImg, workDescription }: workData) => {
    const { md, xs, sm } = useScreenSize();
    const { textRef, isTruncated } = useTextTruncation();

    return (
        <Link
            to={`${paths.works.detail}/${id}`}
            // onClick={() => {
            //     clevertap.event.push('works_service_type', {
            //         name: workTitle?.split(' ')?.join('_')?.toLowerCase(),
            //     });
            // }}
        >
            <Flex
                vertical
                className={`h-full border rounded-[2rem] relative cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105 shadow-md _scale_on_hover ${xs ? 'h-[274px] w-[274px]' : ''}  mx-auto `}
            >
                {workImg ? (
                    <>
                        <Flex
                            className="rounded-[1.8rem] mb-2 mt-8 bg-[#FFF7F6] p-3 mx-7"
                            align="center"
                            justify="center"
                        >
                            <Image
                                preview={false}
                                src={workImg}
                                className="max-h-[96px] object-contain"
                            />
                        </Flex>
                        <Flex justify="center" align="center" className="mt-auto">
                            <Typography.Text className="md:mt-3 mt-0 md:text-base lg:text-base line-clamp-1 font-medium text-center px-1">
                                {workTitle}
                            </Typography.Text>
                        </Flex>
                    </>
                ) : (
                    <>
                        {md ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span className="xs:text-xs md:text-sm">
                                        No Preview Available
                                    </span>
                                }
                            />
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{
                                    marginBlock: xs ? '1px' : '10px',
                                    width: '70%',
                                }}
                                description={
                                    <span className="xs:text-xs md:text-sm">
                                        No Preview Available
                                    </span>
                                }
                            />
                        )}

                        <Flex justify="center" align="center" className="mt-auto">
                            <Typography.Text className="md:mt-3 mt-0 md:text-base lg:text-base line-clamp-1 font-medium">
                                {workTitle}
                            </Typography.Text>
                        </Flex>
                    </>
                )}

                <Flex gap={1} justify="center" align="center" className="md:px-3 px-1 mb-9 mt-0">
                    <Typography.Text
                        ref={textRef}
                        className="text-center xs:line-clamp-3  sm:line-clamp-1 md:text-[.81rem]"
                    >
                        {workDescription}
                    </Typography.Text>

                    {isTruncated && sm && (
                        <Tooltip title={workDescription}>
                            <InfoCircleOutlined className="text-[#888]" />
                        </Tooltip>
                    )}
                </Flex>
            </Flex>
        </Link>
    );
};

export default WorksCard;
