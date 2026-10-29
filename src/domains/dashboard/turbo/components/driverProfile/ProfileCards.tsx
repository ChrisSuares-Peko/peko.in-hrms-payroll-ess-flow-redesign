import React from 'react';

import { Badge, Button, Col, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { paths } from '@src/routes/paths';
import { toTitleCase } from '@utils/wordFormat';

import img from '../../assets/icons/profile.svg';
import { isLongToken } from '../../utils/layout';

const ProfileCards = ({
    item,
    setModalData,
    openConfirmationModal,
    setOpenConfirmationModal,
    handleDelete,
}: any) => {
    const navigate = useNavigate();
    const statusStyles = {
        VALID: {
            text: '#027A48',
            background: '#ECFDF3',
        },
        INVALID: {
            text: '#B78512',
            background: '#FDFDEC',
        },
    };
    function findColorByStatus(status: string) {
        let value = statusStyles.INVALID;
        if (status === 'VALID') {
            value = statusStyles[status];
        }
        return value;
    }
    const cardData = [
        { label: 'DL Number', value: item.dlNumber },
        { label: 'License Validity', value: item.rawData.dl_validity.non_transport.from },
        {
            label: 'State of Issue',
            value: toTitleCase(
                item.rawData.details_of_driving_licence.address_list[0].split_address.state[0][0]
            ),
        },
        { label: 'Vehicle Assigned', value: item.assignments[0]?.fleet?.vehicleNumber },
        { label: 'DL Status', value: item?.verificationStatus },
    ];
    return (
        <Col xs={24} lg={12}>
            <div className="border rounded-xl p-6 h-full !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                <Flex
                    justify="space-between"
                    className="flex-col sm:flex-row gap-3 sm:items-center w-full"
                >
                    <Flex gap={2}>
                        {/* {item.photoUrl ? (
                            <Avatar src={item.photoUrl} size={48} shape="circle" />
                        ) : (
                            <ReactSVG src={img} />
                        )} */}
                        <ReactSVG src={img} />
                        <Typography.Text className="font-medium text-lg mt-3">
                            {item.name}
                        </Typography.Text>
                    </Flex>
                    <Flex gap={7}>
                        <Button
                            type="default"
                            danger
                            size="middle"
                            className="text-xs md:px-5 md:text-sm"
                            onClick={() => {
                                setModalData(item);
                                setOpenConfirmationModal(true);
                            }}
                        >
                            Delete
                        </Button>
                        <Button
                            type="default"
                            danger
                            size="middle"
                            className="text-xs md:px-5 md:text-sm"
                            onClick={() =>
                                navigate(paths.turbo.driverDetails, { state: { key: item.id } })
                            }
                        >
                            View
                        </Button>
                    </Flex>
                </Flex>
                <Row gutter={[20, 20]} className="mt-4">
                    {cardData.map((items: any, index: any) => (
                        <Col xs={isLongToken(items.value) ? 24 : 12} md={12} xl={8} key={index}>
                            <Flex vertical gap={5}>
                                {items.label === 'DL Status' ? (
                                    <Badge
                                        status={items.value === 'VALID' ? 'success' : 'error'}
                                        text={
                                            items.value.charAt(0).toUpperCase() +
                                            items.value.slice(1).toLowerCase()
                                        }
                                        className="px-2 rounded-2xl"
                                        style={{
                                            color: findColorByStatus(items.value).text,
                                            backgroundColor: findColorByStatus(items.value)
                                                .background,
                                            padding: '1px 9px',
                                            border: '1px ',
                                            borderRadius: '15px',
                                        }}
                                    />
                                ) : (
                                    <Typography.Text className="font-medium text-base break-normal">
                                        {items.value || 'N/A'}
                                    </Typography.Text>
                                )}

                                <Typography.Text type="secondary" className="text-xs">
                                    {items.label}
                                </Typography.Text>
                            </Flex>
                        </Col>
                    ))}
                </Row>
            </div>
            {openConfirmationModal && (
                <ConfirmationModal
                    isOpen={openConfirmationModal}
                    handleCancel={() => setOpenConfirmationModal(false)}
                    title="Are you sure you want to delete this driver? This action will permanently remove the driver and its associated data (e.g., documents, vehicle assignment) from your fleet."
                    handleSubmit={handleDelete}
                    isLoading={false}
                />
            )}
        </Col>
    );
};

export default ProfileCards;
