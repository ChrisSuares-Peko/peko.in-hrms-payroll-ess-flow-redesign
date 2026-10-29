import { CloseOutlined } from '@ant-design/icons';
import { Flex, Tag, Typography } from 'antd';

import { useAppDispatch } from '@src/hooks/store';

// import { removeSelectedAncillary } from '../../slices/airlineSlice';
import useFindFlightType from '../../hooks/useFindFlightType';
import { removePassengerAncillaries } from '../../slices/airlineSlice';
import { getPropertyByAncType } from '../../utils/ancillaries';

type AccType = {
    Origin: string;
    Destination: string;
    AirlineDescription: string;
    Weight: number;
    SeatNo: string;
    RowNo: string;
};
const SelectedAncTags = ({ ancType, passenger }: any) => {
    const dispatch = useAppDispatch();
    const { getFlightType } = useFindFlightType();
    let selectedAncillaries: AccType[] = passenger[getPropertyByAncType(ancType)];
    selectedAncillaries = selectedAncillaries.filter((anc: any) => {
        if (anc.Code === 'NoMeal' || anc.Code === 'NoSeat' || anc.Code === 'NoBaggage')
            return false;
        return true;
    });

    return (
        <Flex vertical gap={10}>
            {selectedAncillaries &&
                selectedAncillaries.map((selected, i: number) => {
                    const flightType = getFlightType(selected.Origin, selected.Destination);
                    const title = `${selected.Origin} - ${selected.Destination}`;
                    return (
                        <Flex vertical key={i} className="w-full" gap={5}>
                            <Flex className="gap-4">
                                {flightType && (
                                    <Typography.Text className="text-xs xs375:text-sm font-semibold">
                                        {flightType}
                                    </Typography.Text>
                                )}{' '}
                                <Typography.Text className="text-xs xs375:text-sm">
                                    {title}
                                </Typography.Text>
                            </Flex>
                            <Flex wrap="wrap">
                                <Tag
                                    color="error"
                                    className="rounded-md flex align-middle overflow-x-auto"
                                    style={{ maxWidth: '100%', whiteSpace: 'nowrap' }}
                                >
                                    <span className="truncate">
                                        {ancType === 'meal' && selected.AirlineDescription}
                                        {ancType === 'baggage' &&
                                            `Excess Baggage ${selected.Weight} Kg`}
                                        {ancType === 'seat' &&
                                            `${selected.RowNo}${selected.SeatNo}`}
                                    </span>

                                    <CloseOutlined
                                        className="ms-2  text-gray-500"
                                        style={{ fontSize: '11px' }}
                                        onClick={() => {
                                            dispatch(
                                                removePassengerAncillaries({
                                                    passengerId: passenger.passengerId,
                                                    ancType: getPropertyByAncType(ancType),
                                                    index: i,
                                                })
                                            );
                                        }}
                                    />
                                </Tag>
                            </Flex>
                        </Flex>
                    );
                })}
        </Flex>
    );
};

export default SelectedAncTags;
