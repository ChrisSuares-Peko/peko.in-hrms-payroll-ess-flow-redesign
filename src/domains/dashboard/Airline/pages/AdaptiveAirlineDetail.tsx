import React, { useState } from 'react';

import { Flex } from 'antd';

import PassengerSelectionPage from '../views/PassengerSelectionPage';
import PriceCardPage from '../views/PriceCardPage';
import SeatSelectionPage from '../views/SeatSelectionPage';

type Props = {
    openFareRules: () => void;
    fareQuotes: any;
};

const AdaptiveAirlineDetail = ({ openFareRules, fareQuotes }: Props) => {
    const [currentPage, setCurrentPage] = useState(1);
    const handleNextClick = () => {
        setCurrentPage(prevPage => (prevPage < 3 ? prevPage + 1 : 1));
    };

    const handlePrevClick = () => {
        setCurrentPage(prevPage => (prevPage > 1 ? prevPage - 1 : prevPage));
    };

    return (
        <Flex vertical className="gap-4">
            {currentPage === 1 && (
                <PriceCardPage
                    openFareRules={openFareRules}
                    handleClick={handleNextClick}
                    fareQuotes={fareQuotes}
                />
            )}
            {currentPage === 2 && (
                <PassengerSelectionPage
                    handlePrevClick={handlePrevClick}
                    handleClick={handleNextClick}
                    fareQuotes={fareQuotes}
                />
            )}
            {currentPage === 3 && (
                <SeatSelectionPage
                    handlePrevClick={handlePrevClick}
                    handleClick={handleNextClick}
                    fareQuotes={fareQuotes}
                />
            )}
        </Flex>
    );
};

export default AdaptiveAirlineDetail;
