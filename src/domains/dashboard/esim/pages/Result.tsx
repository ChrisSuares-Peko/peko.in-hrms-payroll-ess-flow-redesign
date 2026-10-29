import React, { useEffect, useState } from 'react';

import { Col, Row } from 'antd';
import Lottie from 'react-lottie';

import animation from '@assets/animation/EsimLoader.json';
import { useAppSelector } from '@src/hooks/store';

import SearchEsim from '../components/home/SearchEsim';
import PackageCard from '../components/results/PackageCard';
import PackagesHeader from '../components/results/PackagesHeader';
import useSearchPackages from '../hooks/useSearchPackages';
import { IPackageCard, PackageListItem } from '../types/packagesList';

type Props = {};

const Result = (props: Props) => {
    const state = useAppSelector(item => item.reducer.esim.searchData);
    const [, setFilteredData] = useState<IPackageCard[]>();
    const [packageData, setPackageData] = useState<IPackageCard[]>();
    const [, setFilterType] = useState<string>('');
    const [, setSearchText] = useState<string>('');
    const { data, conversionRate, isLoading } = useSearchPackages(state.country, state.esimType);
    const [location, setLocation] = useState<string>('');

    useEffect(() => {
        const mapData = (packageDetails: PackageListItem[]) =>
            packageDetails.flatMap(item =>
                item.operators.flatMap(operator =>
                    operator.packages.map(packageItem => ({
                        image: operator.image?.url,
                        voice: packageItem.voice,
                        data: packageItem.data,
                        coverage: operator.countries,
                        sms: packageItem.text,
                        validity: packageItem.day,
                        price: packageItem.price,
                        conversionRate,
                        title: operator.title,
                        id: packageItem.id,
                    }))
                )
            );

        const updateFilteredData = (newData: IPackageCard[]) => {
            setFilteredData([]);
            setPackageData([]);
            setFilteredData(newData);
            setPackageData(newData);
        };

        if (state.esimType === 'regional' && data) {
            const packageDetails = data.filter(item => item.slug === state.region);
            setLocation(data[0]?.title || '');
            const packData = mapData(packageDetails);
            updateFilteredData(packData);
        } else if (state.esimType === 'global' && data) {
            const packageDetails = data.filter(item => item.slug === 'world');
            setLocation('Global');
            const packData = mapData(packageDetails);
            updateFilteredData(packData);
        } else if (state.esimType === 'local' && data) {
            setLocation(data[0]?.title || '');
            const packData = mapData(data);
            const sortedData = packData.sort((a, b) => a.price - b.price);
            updateFilteredData(sortedData);
        }
    }, [isLoading, data, conversionRate, state]);

    // useEffect(() => {
    //     if (filterType === 'price' && filteredData !== undefined) {
    //         setPackageData(filteredData);
    //         const res = filteredData?.sort((a, b) => a.price - b.price);
    //         setPackageData(res);
    //     }
    //     if (filterType === 'validity' && filteredData !== undefined) {
    //         setPackageData(filteredData);
    //         const res = filteredData?.sort((a, b) => a.validity - b.validity);
    //         setPackageData(res);
    //     }
    // }, [filterType, filteredData]);

    // useEffect(() => {
    //     if (searchText === '') {
    //         setPackageData(filteredData);
    //     } else if (filteredData !== undefined) {
    //         const res = filteredData.filter(
    //             item =>
    //                 item.title.includes(searchText) ||
    //                 item.data.includes(searchText) ||
    //                 (item.price * item.conversionRate).toString().includes(searchText)
    //         );
    //         setPackageData(res);
    //     }
    // }, [searchText, filteredData]);

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return (
        <Row>
            <Col span={24}>
                <SearchEsim />
            </Col>
            <Col span={24}>
                <PackagesHeader
                    location={location}
                    setFilterType={setFilterType}
                    setSearchText={setSearchText}
                />
            </Col>
            <Col span={24}>
                <Row className="mt-8" gutter={[20, 20]}>
                    {isLoading ? (
                        <Lottie
                            options={defaultOptions}
                            height={400}
                            width={600}
                            isClickToPauseDisabled
                        />
                    ) : (
                        packageData &&
                        packageData.map((item, i) => (
                            <Col key={item.id} xs={24} sm={12} md={8} lg={8} xl={6}>
                                <PackageCard
                                    conversionRate={item.conversionRate}
                                    coverage={item.coverage}
                                    data={item.data}
                                    id={item.id}
                                    image={item.image}
                                    price={item.price}
                                    sms={item.sms}
                                    title={item.title}
                                    validity={item.validity}
                                    voice={item.voice}
                                    key={i}
                                />
                            </Col>
                        ))
                    )}
                </Row>
            </Col>
        </Row>
    );
};

export default Result;
