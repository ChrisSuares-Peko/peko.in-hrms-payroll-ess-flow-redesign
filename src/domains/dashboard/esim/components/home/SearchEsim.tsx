import React, { useEffect, useState } from 'react';

import { Button, Col, Flex, Image, Row, Select, Spin, Typography } from 'antd';
// import clevertap from 'clevertap-web-sdk';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import SearchDrawer from './SearchDrawer';
import QuestionSVG from '../../assets/icons/question.svg';
import SmartPhoneSVG from '../../assets/icons/smartphone.svg';
import useSearchPackages from '../../hooks/useSearchPackages';
import { resetFormState, setSearchData } from '../../slice/esimSlice';
import { eSimTypesOptions } from '../../utils/data';

type Props = {};
type selectOptions = {
    value: string;
    label: string;
    img: string;
};

const SearchEsim = (props: Props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    if (location.pathname === '/corporate-travel') {
        dispatch(resetFormState());
    }

    const searchData = useAppSelector(item => item.reducer.esim.searchData);
    const [esimType, setEsimType] = useState(searchData.esimType);
    const [country, setCountry] = useState(searchData.country);
    const [region, setRegion] = useState(searchData.region);
    const [countryOptions, setCountryOptions] = useState<selectOptions[] | undefined>([]);
    const [regionOptions, setRegionOptions] = useState<selectOptions[] | undefined>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data, isLoading } = useSearchPackages('', esimType);

    const showToastMessage = (desc: string) =>
        dispatch(
            showToast({
                description: 'Select eSIM Type',
                variant: 'error',
            })
        );

    const handleSearch = () => {
        if (esimType === '') showToastMessage('Select eSIM Type');

        if (esimType === 'local' && country === '') {
            setRegion('');
            showToastMessage('Select eSIM country');
        }

        if (esimType === 'regional' && region === '') {
            setCountry('');
            showToastMessage('Select eSIM region');
        }

        dispatch(
            setSearchData({
                country,
                region,
                esimType,
            })
        );

        navigate(`${paths.dashboard.corporateTravel}/${paths.esim.index}/${paths.esim.packages}`, {
            state: {
                esimType,
                country,
                region,
            },
        });
        return false;
    };

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    useEffect(() => {
        if (esimType === 'local') {
            const countryData: selectOptions[] = [];
            if (data) {
                data.forEach(item => {
                    if (item.title.toLowerCase() !== 'world') {
                        countryData.push({
                            value: item.country_code,
                            label: item.title,
                            img: item.image.url,
                        });
                    }
                });
            }
            const options = countryData.sort((a, b) => a.label.localeCompare(b.label));

            setCountryOptions(options);
        }
        if (esimType === 'regional') {
            const countryData: selectOptions[] = [];
            if (data) {
                data.forEach(item => {
                    if (item.title.toLowerCase() !== 'world') {
                        countryData.push({
                            value: item.slug,
                            label: item.title,
                            img: item.image.url,
                        });
                    }
                });
            }
            setRegionOptions(countryData);
        }
    }, [data, esimType]);

    return (
        <Row
            className="w-full flex xs:justify-start md:justify-center"
            align="bottom"
            justify="center"
            gutter={[20, 10]}
        >
            <Col sm={12} md={6} className="pl-6">
                <Flex className="w-full" gap={15} vertical>
                    <Typography.Text className="text-sm text-textBlack line-clamp-1">
                        Package Type
                    </Typography.Text>
                    <Select
                        className="rounded-sm border-textGrey xs:w-full"
                        placeholder="Select eSIM Type"
                        size="large"
                        value={esimType === '' ? searchData.esimType : esimType}
                        onSelect={e => {
                            setEsimType(e);
                            // clevertap.event.push('Esimtype', {
                            //     Page: 'Esimtype',
                            //     Action: 'Esimtype clicked',
                            //     // Action:'softwares clicked',
                            //     Email: user?.email,
                            // });
                        }}
                        options={eSimTypesOptions}
                    />
                </Flex>
            </Col>
            <Col sm={12} md={6} className={`pl-2 ${esimType !== 'local' ? 'hidden' : ''}`}>
                <Flex gap={15} vertical>
                    <Typography.Text className="text-sm text-textBlack line-clamp-1">
                        Search Destination Country
                    </Typography.Text>
                    <Select
                        showSearch
                        className="rounded-sm border-textGrey"
                        placeholder="Select eSIM country"
                        size="large"
                        value={countryOptions?.length !== 0 ? country : ''}
                        onSelect={e => {
                            setCountry(e);
                            // clevertap.event.push('country', {
                            //     Page: 'country',
                            //     Action: 'country clicked',
                            //     // Action:'softwares clicked',
                            //     Email: user?.email,
                            // });
                        }}
                        filterOption={(input, option) =>
                            !isLoading && option?.key.toLowerCase().includes(input.toLowerCase())
                        }
                        loading={isLoading}
                    >
                        {!isLoading && countryOptions ? (
                            countryOptions.map((item, index) => (
                                <Select.Option key={item.label} value={item.value}>
                                    <Flex gap={10} className="items-center">
                                        <Image
                                            width={35}
                                            src={item.img}
                                            height={20}
                                            className="rounded-sm ms-1  flex-shrink-0"
                                            preview={false}
                                        />
                                        <Typography.Text className="truncate max-w-xs">
                                            {item.label}
                                        </Typography.Text>
                                    </Flex>
                                </Select.Option>
                            ))
                        ) : (
                            <Select.Option value="loading" disabled>
                                <Flex
                                    className={`w-full ${!isLoading && countryOptions?.length === 0 ? 'hidden' : ''}`}
                                    justify="center"
                                    gap={10}
                                >
                                    <Spin />
                                </Flex>
                            </Select.Option>
                        )}
                    </Select>
                </Flex>
            </Col>
            <Col sm={12} md={6} className={`pl-2 ${esimType === 'local' ? 'hidden' : ''}`}>
                <Flex gap={15} vertical>
                    <Typography.Text className="text-sm text-textBlack line-clamp-1">
                        Search Destination Region
                    </Typography.Text>
                    <Select
                        showSearch
                        className="rounded-sm border-textGrey"
                        placeholder="Select eSIM region"
                        size="large"
                        disabled={esimType === 'global'}
                        value={esimType === 'global' || regionOptions?.length === 0 ? '' : region}
                        onSelect={e => setRegion(e)}
                        filterOption={(input, option) =>
                            !isLoading && option?.key.toLowerCase().includes(input.toLowerCase())
                        }
                        loading={isLoading}
                    >
                        {!isLoading && regionOptions ? (
                            regionOptions.map((item, index) => (
                                <Select.Option key={item.value} value={item.value}>
                                    <Flex gap={10}>
                                        <Image
                                            width={40}
                                            src={item.img}
                                            height={20}
                                            className="rounded-sm"
                                            preview={false}
                                        />
                                        <Typography.Text>{item?.label}</Typography.Text>
                                    </Flex>
                                </Select.Option>
                            ))
                        ) : (
                            <Select.Option value="loading" disabled>
                                <Flex
                                    className={`w-full ${!isLoading && regionOptions?.length === 0 ? 'hidden' : ''}`}
                                    justify="center"
                                    gap={10}
                                >
                                    <Spin />
                                </Flex>
                            </Select.Option>
                        )}
                    </Select>
                </Flex>
            </Col>
            <Col sm={12} md={4}>
                <Button
                    onClick={() => handleSearch()}
                    className="w-full flex justify-center px-4 items-center"
                    size="large"
                    type="primary"
                    danger
                >
                    <Typography.Text className="text-white text-sm cursor-pointer">
                        Search eSIM
                    </Typography.Text>
                </Button>
            </Col>
            <Col sm={12} xl={4} onClick={() => toggleModal()} className="">
                <Col className="h-9" />
                <Flex justify="end" align="center" className="w-full">
                    <Flex justify="center" align="center" className="max-w-56">
                        <ReactSVG
                            src={SmartPhoneSVG}
                            className="cursor-pointer"
                            beforeInjection={svg => {
                                svg.setAttribute('style', 'width: 40px; height: 45px;');
                            }}
                            onClick={() => toggleModal()}
                        />
                        <Typography.Text
                            onClick={() => toggleModal()}
                            className="text-red-500 text-xs ms-2 cursor-pointer"
                        >
                            Search for supported smartphone models
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Col>
            <Col sm={12} xl={4} className="pl-2">
                <Col className="h-9" />
                <Flex
                    justify="center"
                    align="center"
                    onClick={() =>
                        navigate(
                            `${paths.dashboard.corporateTravel}/${paths.esim.index}/${paths.esim.howEsim}`
                        )
                    }
                >
                    <ReactSVG
                        src={QuestionSVG}
                        beforeInjection={svg => {
                            svg.setAttribute('style', 'width: 40px; height: 45px;');
                        }}
                        className="cursor-pointer"
                    />
                    <Typography.Text className="text-red-500 text-xs ms-2 cursor-pointer">
                        How eSIM <br /> works?
                    </Typography.Text>
                </Flex>
            </Col>
            {isModalOpen && <SearchDrawer isModalOpen={isModalOpen} toggleModal={toggleModal} />}
        </Row>
    );
};

export default SearchEsim;
