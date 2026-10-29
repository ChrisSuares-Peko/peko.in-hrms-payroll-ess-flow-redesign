import React, { useState } from 'react';

import { Col, Flex, Image, Input, Modal, Typography } from 'antd';

import { Country } from '../../types/packagesList';

type Props = {
    isModalOpen: boolean;
    handleCancel: () => void;
    country: Country[];
};

const CountryModal = ({ handleCancel, isModalOpen, country }: Props) => {
    const [filteredData, setFilteredData] = useState<Country[]>(country);

    const filterCountry = (searchText: string) => {
        const filteredCountries = country.filter(item =>
            item.title.toLowerCase().includes(searchText.toLowerCase())
        );

        setFilteredData(filteredCountries);
    };

    return (
        <Modal
            title="Supported Countries"
            open={isModalOpen}
            onCancel={handleCancel}
            footer={<Col />}
        >
            <Flex gap={20} className="mx-2 h-96 overflow-scroll" vertical>
                <Input.Search
                    onSearch={e => filterCountry(e)}
                    onChange={e => filterCountry(e.target.value)}
                    className="w-full"
                    allowClear
                />
                <Flex gap={20} className="h-full overflow-scroll" vertical>
                    {filteredData.map((item, i) => (
                        <Flex gap={20}>
                            <Image preview={false} src={item.image.url} height={25} width={40} />
                            <Typography.Text>{item.title}</Typography.Text>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Modal>
    );
};

export default CountryModal;
