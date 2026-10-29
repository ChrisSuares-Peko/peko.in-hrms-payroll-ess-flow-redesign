import React from 'react';

import { Col, Empty, Flex, Row, Skeleton } from 'antd';

import MoreTransactions from '@assets/svg/moretransactions.svg';

import IconCard from '../components/IconCard';
import WorksCard from '../components/WorksCard';
import WorksHeader from '../components/WorksHeader';
import { useListingApi } from '../hooks/useListingApi';

const WorksList = () => {
    const { data, isLoading, count } = useListingApi(1, 100);

    return (
        <Flex vertical gap={30} className="">
            <WorksHeader />

            <>
                <Row gutter={[28, 30]} className="mt-4">
                    {!isLoading
                        ? data.map((works, index) => (
                              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                  <div className=" w-full h-full">
                                      <WorksCard
                                          id={works.id}
                                          key={works.id}
                                          workImg={works.image}
                                          workTitle={works.name}
                                          workDescription={works.features}
                                      />
                                  </div>
                              </Col>
                          ))
                        : Array.from({ length: 8 }).map((_, index) => (
                              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                  <Skeleton className="w-full" paragraph={{ rows: 4 }} />
                              </Col>
                          ))}
                </Row>
                {count <= 0 && !isLoading && (
                    <Flex align="center" justify="center">
                        <Empty
                            image={
                                <img
                                    src={MoreTransactions}
                                    alt="No result"
                                    style={{ width: '200px', height: '200px' }}
                                />
                            } // Adjust width and height as needed
                            description={
                                <div className="font-normal" style={{ marginTop: '80px' }}>
                                    No Works Added
                                </div>
                            } // Add margin-top to position the text below the image
                        />
                    </Flex>
                )}
                {/* <Flex justify="center" className="mt-10">
                <Typography.Text className="text-center text-lg font-normal">
                    What is Peko Works?{' '}
                    <span style={{ color: 'red' }}>Check here</span>
                </Typography.Text>
            </Flex> */}

                {/* <Flex justify="center" className="mt-5 hidden">
                    <Typography.Text className="  text-center text-lg font-normal">
                        What is Peko Works?
                    </Typography.Text>
                </Flex> */}
                <Flex className="md:px-52 hidden">
                    <Row justify="center" gutter={[28, 30]}>
                        <IconCard
                            title="Choose a suitable plan"
                            icon="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1713424768676.png?alt=media&token=95aee2e9-8013-48d4-959b-4b0c252c0290"
                            count="1"
                        />
                        <IconCard
                            title="Provide all the necessary details for office address submission"
                            icon="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1713424768676.png?alt=media&token=95aee2e9-8013-48d4-959b-4b0c252c0290"
                            count="2"
                        />
                        <IconCard
                            title="A dedicated executive will call you for further assistance"
                            icon="https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1713424768676.png?alt=media&token=95aee2e9-8013-48d4-959b-4b0c252c0290"
                            count="3"
                        />
                    </Row>
                </Flex>

                {/* <Pagination className="text-center" size="small" total={50} /> */}
            </>
        </Flex>
    );
};
export default WorksList;
