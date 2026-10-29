import { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Checkbox, Col, Flex, Input, Rate, Row, Slider, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';
import { removeEmoji } from '@utils/regex';

import useHotelFilters from '../../hooks/useFilterHotels';
import {AMENITIES} from "../../utils/data" 


interface FilterhotelProps {
    title: string;
    dataSource: any;
    setFilteredData: any;
    setCurrentPage: any;
    sortOption: any;
}

const Filterhotel = ({
    title,
    dataSource,
    setFilteredData,
    setCurrentPage,
    sortOption,
}: FilterhotelProps) => {
    const { hotelPriceRange } = useAppSelector(state => state.reducer.hotels);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [ranges, setRange] = useState<[number, number]>([
        hotelPriceRange.lowestPrice,
        hotelPriceRange.highestPrice,
    ]);
    const [priceRange, setPriceRange] = useState<[number, number]>([
        hotelPriceRange.lowestPrice,
        hotelPriceRange.highestPrice,
    ]);
    const [selectedRateRanges, setSelectedRateRanges] = useState<number[][]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
    const [ratingsCount, setRatingsCount] = useState<{ [key: number]: number }>({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
        0: 0,
    });
    const [rateRangeCounts, setRateRangeCounts] = useState<{ [key: string]: number }>({
        '0-2000': 0,
        '2000-4000': 0,
        '4000-7500': 0,
        '7500-11000': 0,
        '11000+': 0,
    });
    const [startValue, setStartValue] = useState<number>(hotelPriceRange.lowestPrice || 0);
    const [endValue, setEndValue] = useState<number>(hotelPriceRange.highestPrice || 0);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);


    const {
        filterHotels,
        filterByPriceRange,
        filterByHotelName,
        filterByRate,
        filterByRatings,
        calculateRatingCounts,
        calculateRateCounts,
        filterByAmenities
    } = useHotelFilters();

    const handleAmenityChange = (amenity: string) => {
  setSelectedAmenities(prev =>
    prev.includes(amenity)
      ? prev.filter(a => a !== amenity)
      : [...prev, amenity]
  );
};


    useEffect(() => {
        if (dataSource && dataSource.length > 0) {
            const dynamicRateCounts = calculateRateCounts(
                filterByRatings(dataSource, selectedRatings)
            );
            const dynamicRatingCounts = calculateRatingCounts(
                filterByRate(dataSource, selectedRateRanges)
            );

            setRateRangeCounts(dynamicRateCounts);
            setRatingsCount(dynamicRatingCounts);
        }
    }, [
        dataSource,
        selectedRatings,
        selectedRateRanges,
        filterByRate,
        filterByRatings,
        calculateRateCounts,
        calculateRatingCounts,
    ]);

  useEffect(() => {
  if (!dataSource || dataSource.length === 0) {
    setFilteredData([]);
    return;
  }

  const filteredByPrice = filterByPriceRange(dataSource, priceRange);
  const filteredByRateRange = filterByRate(filteredByPrice, selectedRateRanges);
  const filteredByRating = filterByRatings(filteredByRateRange, selectedRatings);
  const filteredByAmenitiesResult = filterByAmenities(
    filteredByRating,
    selectedAmenities
  );
  const filteredBySearch = filterByHotelName(
    filteredByAmenitiesResult,
    searchQuery
  );
  const sortedData = filterHotels(filteredBySearch, sortOption);

  setFilteredData(sortedData);
  setCurrentPage(1);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  dataSource,
  priceRange,
  selectedRateRanges,
  selectedRatings,
  selectedAmenities,
  searchQuery,
  sortOption,
  setFilteredData,
  setCurrentPage,
]);

    
    const handleResetFilters = () => {
        setPriceRange([hotelPriceRange.lowestPrice, hotelPriceRange.highestPrice]);
        setRange([hotelPriceRange.lowestPrice, hotelPriceRange.highestPrice]);
        setSearchQuery('');
        setSelectedRatings([]);
        setSelectedRateRanges([]);
        setEndValue(hotelPriceRange.highestPrice);
        setStartValue(hotelPriceRange.lowestPrice);
    };

    const handleChangeSearchQuery = (value: string) => {
        if (setSearchQuery) {
            setSearchQuery(value);
        }
    };

    const handleRatingChange = (rating: number) => {
        setSelectedRatings(prevRatings => {
            if (prevRatings.includes(rating)) {
                return prevRatings.filter(value => value !== rating);
            }
            return [...prevRatings, rating];
        });
    };

    const handleRateRangeChange = (price: number, nextPrice: number) => {
        setSelectedRateRanges(prevRanges => {
            const exists = prevRanges.some(([min, max]) => min === price && max === nextPrice);
            if (exists) {
                return prevRanges.filter(([min, max]) => !(min === price && max === nextPrice));
            }
            return [...prevRanges, [price, nextPrice]];
        });
    };

    const onChange = (values: [number, number]) => {
        setStartValue(values[0]);
        setEndValue(values[1]);
        setPriceRange(values);
        setRange(values);

        const filteredData = filterByPriceRange(dataSource, values);
        setFilteredData(filteredData);
        setCurrentPage(1);
    };

    return (
        <Content>
            <Flex justify="space-between" className="p-4">
                <Typography.Text className="font-bold text-lg">{title}</Typography.Text>
                <Flex align="center" justify="center">
                    <Typography.Text
                        className="font-medium text-brandPrimary cursor-pointer"
                        onClick={handleResetFilters}
                    >
                        Reset
                    </Typography.Text>
                </Flex>
            </Flex>
            <Flex vertical className="mt-2 mb-4">
                <Typography.Text className="font-medium ml-4">Search by hotel name</Typography.Text>
                <Flex className="px-4 py-3">
                    <Input
                        placeholder="Search by hotel name"
                        suffix={<SearchOutlined />}
                        allowClear
                        type="text"
                        maxLength={90}
                        value={searchQuery}
                        onChange={e => handleChangeSearchQuery(e.target.value.replace(removeEmoji, ''))}
                        className="input-container rounded-sm"
                    />
                </Flex>
            </Flex>
            <Flex vertical className=" mb-4">
                <Typography.Text className="font-medium ml-4">Price</Typography.Text>
                <Content style={{ padding: '0 16px' }}>
                    <Slider
                        range
                        value={[
                            Math.floor((startValue ?? hotelPriceRange.lowestPrice) / 10) * 10,
                            Math.ceil((endValue ?? hotelPriceRange.highestPrice) / 10) * 10,
                        ]}
                        onChange={values => {
                            const roundedValues: [number, number] = [
                                Math.floor(values[0] / 10) * 10, // Round down min value
                                Math.ceil(values[1] / 10) * 10, // Round up max value
                            ];
                            onChange(roundedValues);
                        }}
                        min={Math.floor(hotelPriceRange.lowestPrice / 10) * 10}
                        max={Math.ceil(hotelPriceRange.highestPrice / 10) * 10}
                    />
                </Content>
                <Row gutter={16} className="p-4">
                    <Col className="gutter-row" span={12}>
                        <Content className="py-2 border border-solid border-gray-200 rounded-[12px]">
                            <Flex vertical>
                                <Typography.Text className="text-xs text-gray-500 ml-4">
                                    Min price
                                </Typography.Text>
                                <Typography.Text className="font-medium ml-4">
                                    ₹{' '}
                                    {formatNumberWithLocalString(
                                        Math.floor((startValue ?? 0) / 10) * 10,
                                        0,
                                        0
                                    )}
                                </Typography.Text>
                            </Flex>
                        </Content>
                    </Col>
                    <Col className="gutter-row" span={12}>
                        <Content className="py-2 border border-solid border-gray-200 rounded-[12px]">
                            <Flex vertical>
                                <Typography.Text className="text-xs text-gray-500 ml-4">
                                    Max price
                                </Typography.Text>
                                <Typography.Text className="font-medium ml-4">
                                    ₹{' '}
                                    {formatNumberWithLocalString(
                                        Math.ceil((endValue ?? 10) / 10) * 10,
                                        0,
                                        0
                                    )}
                                </Typography.Text>
                            </Flex>
                        </Content>
                    </Col>
                </Row>
            </Flex>
            <Flex vertical gap={7} className="px-4 mb-4">
                <Typography.Text className="font-medium">Rate Range</Typography.Text>
                {[0, 2000, 4000, 7500, 11000].map((price, index, arr) => {
                    const nextPrice = arr[index + 1] || Infinity;
                    const isChecked = selectedRateRanges.some(
                        ([min, max]) => min === price && max === nextPrice
                    );
                    const rangeKey =
                        index === arr.length - 1 ? '11000+' : `${price}-${arr[index + 1]}`;

                    return (
                        <Flex justify="space-between" key={price}>
                            <Flex gap={4}>
                                <Checkbox
                                    checked={isChecked}
                                    onChange={() => handleRateRangeChange(price, nextPrice)}
                                />
                                <Typography.Text
                                    className="text-sm ml-1 mt-1 cursor-pointer"
                                    onClick={() => handleRateRangeChange(price, nextPrice)}
                                >
                                    {index === arr.length - 1
                                        ? `₹ ${price}+`
                                        : `₹ ${price} - ₹ ${arr[index + 1]}`}
                                </Typography.Text>
                            </Flex>
                            <Typography.Text className="ml-1 text-sm text-gray-500">
                                {rateRangeCounts[rangeKey] || 0}
                            </Typography.Text>
                        </Flex>
                    );
                })}
            </Flex>
            <Flex vertical gap={7} className="px-4 mt-7 mb-7">
                <Typography.Text className="font-medium">Star Rating</Typography.Text>
                {[5, 4, 3, 2, 1, 0].map(rating => (
                    <Flex justify="space-between" key={rating}>
                        <Flex gap={4}>
                            <Checkbox
                                checked={selectedRatings.includes(rating)}
                                onChange={() => handleRatingChange(rating)}
                            />
                            {rating === 0 ? (
                                <Typography.Text className="text-sm ml-1 mt-1">
                                    No Stars
                                </Typography.Text>
                            ) : (
                                <Rate disabled value={rating} className="text-sm mt-1" />
                            )}
                        </Flex>
                        <Typography.Text className="ml-1 text-sm text-gray-500">
                            {ratingsCount[rating] || 0}
                        </Typography.Text>
                    </Flex>
                ))}
            </Flex>
            <Flex vertical gap={7} className="px-4 mb-6">
  <Typography.Text className="font-medium">Amenities</Typography.Text>

  {AMENITIES.map(a => (
    <Flex key={a.key} justify="space-between">
      <Flex gap={4}>
        <Checkbox
          checked={selectedAmenities.includes(a.key)}
          onChange={() => handleAmenityChange(a.key)}
        />
        <Typography.Text className="text-sm ml-1 mt-1">
          {a.label}
        </Typography.Text>
      </Flex>
    </Flex>
  ))}
</Flex>


        </Content>
    );
};

export default Filterhotel;
