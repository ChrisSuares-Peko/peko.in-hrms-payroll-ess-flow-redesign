import { useState } from 'react';

import { Button, Flex, Row, Typography, Image, Skeleton, Col } from 'antd';

import OwnerCard from './OwnerCard';
import { EmptyAllEmployeeImg } from '../../assets/images/export';
import { useGetAllOwnerDocApi } from '../../hooks/ownerDocHooks/useListOwnerDocApi';
import OwnerDetailsModal from '../Modals/OwnerDetailsModal';

const OwnersDetails = () => {
    const [openOwnerDetailsModal, setOpenOwnerDetailsModal] = useState(false);
    const [reloadTable, setReloadTable] = useState(false);
    const { tableDatas, tableLoading } = useGetAllOwnerDocApi(reloadTable);

    return (
        <>
            <Flex justify="end">
                <Button
                    danger
                    type="primary"
                    className="px-6"
                    onClick={() => setOpenOwnerDetailsModal(true)}
                >
                    Add Owner
                </Button>
            </Flex>
            <Row gutter={[25, 30]}>
                {tableDatas.map((owner, index) => (
                    <OwnerCard
                        key={owner.id}
                        owner={owner}
                        index={index + 1}
                        reloadTable={setReloadTable}
                    />
                ))}
            </Row>
            {tableDatas.length === 0 && !tableLoading && (
                <Row>
                    <Flex
                        className="w-full h-96 my-10"
                        justify="center"
                        align="center"
                        gap="middle"
                        vertical
                    >
                        <Image preview={false} src={EmptyAllEmployeeImg} width={300} />

                        <Typography.Text className="text-center text-titleText text-2xl font-light">
                            No Owner Found
                        </Typography.Text>
                    </Flex>
                </Row>
            )}
            {tableLoading && (
                <>
                    {Array.from({ length: 2 }, (_, i) => (
                        <div key={i} className="mt-2">
                            <Skeleton.Input
                                style={{ width: 200, marginBottom: 8, marginTop: 4 }}
                                active
                                size="small"
                            />
                            <Row
                                className="mt-4 border rounded-2xl w-full h-fit"
                                justify="space-between"
                            >
                                <Skeleton
                                    style={{ width: 200, marginBottom: 8, marginTop: 4 }}
                                    active
                                    title={false}
                                    paragraph={{ rows: 3, width: ['100%', '100%'] }}
                                />
                                <Col span={24} md={9} className="md:border-r">
                                    <Skeleton
                                        style={{ marginBottom: 8, marginTop: 4 }}
                                        active
                                        title={false}
                                        paragraph={{ rows: 3, width: ['100%', '100%'] }}
                                    />
                                    <Skeleton
                                        style={{ marginBottom: 8, marginTop: 4 }}
                                        active
                                        title={false}
                                        paragraph={{ rows: 3, width: ['100%', '100%'] }}
                                    />
                                    <Skeleton
                                        style={{ marginBottom: 8, marginTop: 4 }}
                                        active
                                        title={false}
                                        paragraph={{ rows: 3, width: ['100%', '100%'] }}
                                    />
                                </Col>
                                <Col span={24} md={9} className="  ">
                                    <Skeleton
                                        style={{ marginBottom: 8, marginTop: 4 }}
                                        active
                                        title={false}
                                        paragraph={{ rows: 3, width: ['100%', '100%'] }}
                                    />
                                    <Skeleton
                                        style={{ marginBottom: 8, marginTop: 4 }}
                                        active
                                        title={false}
                                        paragraph={{ rows: 3, width: ['100%', '100%'] }}
                                    />
                                    <Skeleton
                                        style={{ marginBottom: 8, marginTop: 4 }}
                                        active
                                        title={false}
                                        paragraph={{ rows: 3, width: ['100%', '100%'] }}
                                    />
                                </Col>
                            </Row>
                        </div>
                    ))}
                </>
            )}
            {openOwnerDetailsModal && (
                <OwnerDetailsModal
                    open={openOwnerDetailsModal}
                    handleCancel={() => setOpenOwnerDetailsModal(false)}
                    reloadTable={setReloadTable}
                />
            )}
        </>
    );
};

export default OwnersDetails;
