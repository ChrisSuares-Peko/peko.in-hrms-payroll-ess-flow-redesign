import { type FC } from 'react';

import { Card, Col, Flex, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { formatToDDMMYYYY } from '@utils/dateFormat';

import { OrderDetailsPassenger } from '../../types/slices';

interface PassengerProps {
    passenger: OrderDetailsPassenger;
    index: number;
}

const Passenger: FC<PassengerProps> = ({ passenger, index }) => {
    const { sm } = useScreenSize();
    const { orderDetails } = useAppSelector(state => state.reducer.airline);
    return (
        <Col key={index} xs={24} sm={24} md={12} lg={8} xl={8} style={{ padding: 0 }}>
            <Card
                variant="borderless"
                style={{ background: '#F0F0F0' }}
                styles={sm ? {} : { body: { padding: 16 } }}
            >
                <Flex className="mb-3">
                    <Typography.Text strong className="text-lg">
                        {`Passenger ${index + 1}`}{' '}
                    </Typography.Text>
                </Flex>

                <Typography.Text strong>Name: </Typography.Text>
                {/* Title (e.g. Mr/Mrs) hidden for now — it is auto-derived from gender, not collected from the user, so we display the name only. Re-enable when title collection is added. */}
                {/* <Typography.Text>{`${passenger.Title}. ${passenger.FirstName} ${passenger.LastName}`}</Typography.Text> */}
                <Typography.Text>{`${passenger.FirstName} ${passenger.LastName}`}</Typography.Text>
                <br />
                <Typography.Text strong>Airline PNR: </Typography.Text>
                <Typography.Text>{orderDetails.PNR}</Typography.Text>
                <br />
                {passenger.PassportNo && (
                    <>
                        <Typography.Text strong>Passport Number: </Typography.Text>
                        <Typography.Text>{passenger.PassportNo}</Typography.Text>
                        <br />
                        <Typography.Text strong>Passport Expiry Date: </Typography.Text>
                        <Typography.Text>
                            {passenger.PassportExpiry ? formatToDDMMYYYY(passenger.PassportExpiry) : 'NA'}
                        </Typography.Text>
                        <br />
                    </>
                )}
                <Typography.Text strong>Ticket Number: </Typography.Text>
                <Typography.Text>{passenger.Ticket.TicketId || ''}</Typography.Text>

                {/* {passenger.SeatDynamic && (
                    <>
                        <Typography.Text strong>Seat: </Typography.Text>
                        <Typography.Text>{`${passenger.SeatDynamic[0].SeatNo}${passenger.SeatDynamic[0].RowNo}`}</Typography.Text>
                    </>
                )} */}
                <br />
                <Typography.Text strong>Email ID: </Typography.Text>
                <Typography.Text>{passenger.Email}</Typography.Text>
            </Card>
        </Col>
    );
};

export default Passenger;
