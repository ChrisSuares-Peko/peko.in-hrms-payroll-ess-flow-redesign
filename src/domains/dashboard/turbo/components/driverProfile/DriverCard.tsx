
import { Col, Divider, Flex, Image, Row, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';


import { showToast } from '@src/slices/apiSlice';

import car from '../../assets/userImage.png';
import useManageFleetApi from '../../hooks/useManageFleet';
import { filterState } from '../../types';
import LicenseDetails from '../addDriver/LicenseDetails';

const DriverCard = ({ verifyResponse, id, setRefresh, setVehicleId }: any) => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        from: todayFormatted,
        to: todayFormatted,
    };

    const filter: filterState = initialValues;
    const { details, assignApi } = useManageFleetApi(filter);
    const dispatch = useDispatch();
     const capitalizeFirstLetter = (text: any): string => {
    if (typeof text === 'string') {
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    return text; // return as-is if not a string
};

    const driverInfo = [
        { label: 'Driver Name', value: capitalizeFirstLetter(verifyResponse?.name) },
        { label: "Father's Name", value: capitalizeFirstLetter(verifyResponse?.fatherName) },
        { label: 'Date of Birth', value: dayjs(verifyResponse?.dob).format('YYYY-MM-DD') },
        { label: 'Assign to Vehicle', value: '', isAssign: true },
    ];
    const properties = [
        { label: 'DL Number', value: verifyResponse?.dlNumber?.toUpperCase(), preserveCase: true },
        { label: 'DL Status', value: capitalizeFirstLetter(verifyResponse?.verificationStatus) },
        { label: 'Issue Date', value: dayjs(verifyResponse?.dateOfIssue).format('YYYY-MM-DD') },
        {
            label: 'Valid From',
            value: dayjs(verifyResponse?.rawData?.dl_validity?.non_transport?.from).format('YYYY-MM-DD'),
        },
        {
            label: 'Valid Till',
            value: dayjs(verifyResponse?.rawData?.dl_validity?.non_transport?.to).format('YYYY-MM-DD'),
        },
        // { label: 'Vehicle Class / Type', value: verifyResponse },
        { label: 'Address', value: capitalizeFirstLetter(verifyResponse?.permanentAddress) },
        {
            label: 'State of Issue',
            value: capitalizeFirstLetter(verifyResponse?.rawData?.details_of_driving_licence?.address_list?.[0]
                ?.split_address?.state[0][0]),
        },
        // { label: 'Upload DL Copy', value: 'Click to Upload', isUpload: true },
        // { label: 'Upload Aadhaar Copy', value: 'Click to Upload', isUpload: true },
        // { label: 'Upload PAN Copy', value: 'Click to Upload', isUpload: true },
    ];

    const selectedDriverId =
    details?.vehicleId ||
    (Array.isArray(verifyResponse?.assignments) ? verifyResponse.assignments[0]?.vehicleId : undefined);
  
    const vehicleOptions = details.map((driver: any) => ({
        value: driver.vehicleId,
        label: driver.model,
    }));

    const handleVehicleChange = async (driverId: string, vehicleId: string) => {
        // reassign lets an already-assigned driver be moved to another vehicle from this page
        const result = await assignApi({ driverId, vehicleId, reassign: true });

        if (result) {
            setRefresh(true);
            dispatch(
                showToast({
                    description: 'Driver assigned successfully',
                    variant: 'success',
                })
            );
        }

        // Logic to update the vehicle's driver (e.g., API call to save the driver assignment)
    };

   

    return (
        <Row gutter={[40, 10]} className="mt-3">
            <Col
                xs={24}
                xl={6}
                className="px-5 rounded-xl"
                // style={{ background: '#FBFBFB' }}
            >
                <Flex
                    justify="center"
                    align="center"
                    className="px-5 rounded-xl "
                    style={{ height: '100%', minHeight: '200px', background: '#FBFBFB' }} // set a height to center vertically
                >
                    <Image
                        src={verifyResponse?.photoUrl || car}
                        fallback={car}
                        preview={false}
                    />
                </Flex>
            </Col>

            <Col xs={24} xl={18}>
                <Row gutter={[10, 10]}>
                    <>
                        <Typography.Text className="px-2 mt-2 text-sm font-medium">
                            Basic Driver Information
                        </Typography.Text>
                        <Flex
                            justify="space-between"
                            className="flex-wrap w-full px-2 mt-1 md:flex-nowrap"
                        >
                            {driverInfo.map((item, index) => (
                                <div key={index} className="w-1/2 mb-4">
                                    <Flex vertical>
                                        <>
                                            { item.isAssign ? (
                                                <Select
                                                    className=""
                                                    value={selectedDriverId} // No value or undefined to show placeholder
                                                    onChange={value =>{
                                                        if(verifyResponse.id){
                                                            handleVehicleChange(
                                                                verifyResponse.id,
                                                                value
                                                            )
                                                        }
                                                        if(setVehicleId){
                                                            setVehicleId(value)
                                                        }
                                                        }
                                                       
                                                    }
                                                    options={vehicleOptions}
                                                    // style={{ width: 120 }}
                                                    placeholder="Select Vehicle" // Placeholder text
                                                />
                                            ) : (
                                                <Typography.Text className="font-medium">
                                                    {item.value || 'N/A'}
                                                </Typography.Text>
                                            )}
                                        </>
                                        <Typography.Text type="secondary" className="mt-2 text-xs">
                                            {item.label}
                                        </Typography.Text>
                                    </Flex>
                                </div>
                            ))}
                        </Flex>

                        <Divider className="-mt-1" />
                    </>
                </Row>
                <Typography.Text className="mt-4 text-sm font-medium">
                    License Details
                </Typography.Text>
                <Row gutter={[20, 20]} className="mt-3">
                    {properties.map(item => (
                        <LicenseDetails item={item} />
                    ))}
                </Row>
            </Col>
        </Row>
    );
};

export default DriverCard;
