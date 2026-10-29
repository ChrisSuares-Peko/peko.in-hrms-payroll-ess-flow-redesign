import React from 'react';

import { Grid } from 'antd';

import FlightInfoDrawerSm from './searchResult/FlightInfoDrawerSm';
import FlightInfoDrawerWeb from './searchResult/FlightInfoDrawerWeb';
import { Flight } from '../types/Flight';
import { SelectedAirline } from '../types/slices';

type Props = {
    flightDetails: SelectedAirline;
    selectedInbountAirline?: SelectedAirline;
    isDrawerOpen: boolean;
    price?: number | undefined;
    handleClose: () => void;
    handleSubmit?: (item: Flight) => void;
    hideBookNow?: boolean;
};

const FlightInfoDrawer: React.FC<Props> = ({
    flightDetails,
    selectedInbountAirline,
    isDrawerOpen,
    price,
    hideBookNow,
    handleClose,
    handleSubmit,
}) => {
    const screens = Grid.useBreakpoint();

    return screens.md ? (
        <FlightInfoDrawerWeb
            flightDetails={flightDetails}
            selectedInbountAirline={selectedInbountAirline}
            isDrawerOpen={isDrawerOpen}
            price={price}
            handleClose={handleClose}
            handleSubmit={handleSubmit}
            hideBookNow={hideBookNow}
        />
    ) : (
        <FlightInfoDrawerSm
            flightDetails={flightDetails}
            selectedInbountAirline={selectedInbountAirline}
            isDrawerOpen={isDrawerOpen}
            price={price}
            handleClose={handleClose}
            handleSubmit={handleSubmit}
        />
    );
};

export default FlightInfoDrawer;
