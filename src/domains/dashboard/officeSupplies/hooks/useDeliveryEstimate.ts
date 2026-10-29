import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPosition, pincodeFromCoords } from './useCurrentLocation';
import { readStoredCity } from './useOfficeSuppliesCity';
import { getDeliveryEstimateApi } from '../api/product';
import { DeliveryEstimateResponse, OndcProduct } from '../types/products';
import { indianPincode } from '../utils/indianCityStdCodes';

/** The saved-on-cart-item slice of an estimate result. */
export type DeliveryEstimateSnapshot = {
    expectedDeliveryDate: string | null;
    deliveryTat: string | null;
    /** the city the estimate was queried with */
    cityName: string | null;
};

/**
 * Imperative one-shot ONDC delivery-estimate fetch — reused by both the PDP
 * hook below and the "fetch-then-add-to-cart" flow (product cards). Delivery
 * location = the office-supplies selected city (localStorage) + PIN + best-effort
 * browser gps. Returns `undefined` when no city is selected or the seller
 * couldn't quote — callers treat that as "no estimate" (never fabricated).
 */
export async function fetchDeliveryEstimate(params: {
    userId: number;
    userType: string;
    ondcProductId: string;
    quantity: number;
}): Promise<DeliveryEstimateSnapshot | undefined> {
    const city = readStoredCity();
    if (!city?.code) return undefined;

    // best-effort browser gps — optional, omitted when denied/unavailable
    const pos = await getPosition();
    const gps = pos ? `${pos.coords.latitude},${pos.coords.longitude}` : undefined;

    let pincode = indianPincode(city.pincode);
    if (!pincode && pos) {
        pincode = await pincodeFromCoords(pos.coords.latitude, pos.coords.longitude);
    }

    const data: DeliveryEstimateResponse | false = await getDeliveryEstimateApi({
        userId: params.userId,
        userType: params.userType,
        ondcProductId: params.ondcProductId,
        quantity: params.quantity,
        city: city.code,
        gps,
        pincode,
    });
    if (!data) return undefined;

    return {
        expectedDeliveryDate: data.expectedDeliveryDate,
        deliveryTat: data.deliveryTat,
        cityName: city.name,
    };
}

/**
 * ONDC delivery estimate for the PDP, fetched automatically on page entry.
 * Never fabricates: `fetched` flips true once a call returns, and
 * `estimate.expectedDeliveryDate` is null whenever the seller couldn't quote —
 * the UI shows an honest message. When no city is selected it returns silently
 * (nothing renders) — no toast, since this fires on every product view.
 */
export function useDeliveryEstimate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [estimate, setEstimate] = useState<DeliveryEstimateResponse | null>(null);
    // The city name the estimate was queried with — shown as "… to {city}".
    const [cityName, setCityName] = useState<string | null>(null);

    const getEstimate = async (product: OndcProduct, quantity: number) => {
        if (!readStoredCity()?.code) return;

        setIsLoading(true);
        const snapshot = await fetchDeliveryEstimate({
            userId: id,
            userType: role,
            ondcProductId: product.ondcProductId,
            quantity,
        });
        setIsLoading(false);
        setFetched(true);
        setCityName(snapshot?.cityName ?? null);
        setEstimate(
            snapshot
                ? {
                      serviceable: !!snapshot.expectedDeliveryDate,
                      expectedDeliveryDate: snapshot.expectedDeliveryDate,
                      deliveryTat: snapshot.deliveryTat,
                  }
                : null
        );
    };

    return { estimate, cityName, isLoading, fetched, getEstimate };
}
