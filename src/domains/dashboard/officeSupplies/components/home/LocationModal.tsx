import { useRef, useState, type FC } from 'react';

import { AimOutlined, CloseOutlined, EnvironmentFilled, SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Modal, Spin, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import LocationMapStep from './LocationMapStep';
import { lookupPostcode, searchCities } from '../../api/cityList';
import { useCitySearch } from '../../hooks/useCitySearch';
import { getPosition } from '../../hooks/useCurrentLocation';
import { geocodeFirstMatch, useNominatimSearch } from '../../hooks/useNominatimSearch';
import { RecentLocation, useRecentLocations } from '../../hooks/useRecentLocations';
import { useSavedAddresses } from '../../hooks/useSavedAddresses';
import { Address } from '../../types/address';
import {
    INDIAN_PIN_RE,
    matchCityByName,
    resolveCity,
    searchLocalCities,
    SelectedCity,
    withPincode,
} from '../../utils/indianCityStdCodes';

const DEFAULT_MAP_CENTER = { lat: 28.6139, lng: 77.209 };
const PINCODE_RE = /^\d{6}$/;
const ACTION_CLASS =
    'flex items-center gap-1.5 text-[14px] font-medium leading-none text-[#FF4F4F] disabled:opacity-60';

const { Text } = Typography;

const MapFoldIcon: FC<{ className?: string }> = ({ className }) => (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" width="15" height="15" className={className}>
        <path
            d="M9 18.5 3 21V6.5L9 4m0 14.5 6 2.5m-6-2.5V4m6 16.5 6-2.5V4L15 6.5m0 14V6.5M9 4l6 2.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
        />
    </svg>
);

interface LocationModalProps {
    open: boolean;
    onClose: () => void;
    selectedCity: SelectedCity | null;
    onSelect: (city: SelectedCity) => void;
}

interface LocationRowProps {
    label: string;
    pincode?: string;
    state?: string;
    active?: boolean;
    last?: boolean;
    onClick: () => void;
}

const LocationRow: FC<LocationRowProps> = ({ label, pincode, state, active, last, onClick }) => (
    <div>
        <Flex
            align="center"
            gap={10}
            onClick={onClick}
            className={`w-full cursor-pointer rounded-[10px] px-2 py-2 transition-colors hover:bg-[#f7f7f7] ${
                active ? 'bg-[#f7f7f7]' : ''
            }`}
        >
            <EnvironmentFilled className="shrink-0 text-[15px] text-[#FF4F4F]" />
            <Flex vertical gap={0} className="min-w-0">
                <Text className="truncate text-[14px] font-semibold leading-5 text-[#1e293b]">
                    {label}
                </Text>
                {(pincode || state) && (
                    <Text className="truncate text-[12px] leading-[18px] text-[#8c8c8c]">
                        {[pincode, state].filter(Boolean).join(' • ')}
                    </Text>
                )}
            </Flex>
        </Flex>
        {!last && <div className="mx-2 h-px bg-[#eee]" />}
    </div>
);

const savedAddressTitle = (address: Address) =>
    address.nickname?.trim() ||
    address.city?.trim() ||
    address.addressLine1?.trim() ||
    'Saved address';

/** City/locality text only — never a pincode (`/cities` expects a name). */
const savedAddressCityName = (address: Address) => {
    const city = address.city?.trim();
    if (city && !PINCODE_RE.test(city)) return city;
    const locality = address.addressLine1?.split(',')[0]?.trim();
    if (locality && !PINCODE_RE.test(locality)) return locality;
    return '';
};

/** Google / Nominatim labels are "Bengaluru, Karnataka, India" — use the head as the city. */
const firstLabelPart = (label: string) => label.split(',')[0]?.trim() || label;

/**
 * "Select a location" modal (Figma 2151-25396): search, pink GPS/map links,
 * Saved Address / Recent Locations tabs, then map confirm as step 2.
 */
const LocationModal: FC<LocationModalProps> = ({ open, onClose, selectedCity, onSelect }) => {
    const dispatch = useAppDispatch();
    const { sm } = useScreenSize();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { options, isSearching, search: citySearch } = useCitySearch();
    const {
        options: placeOptions,
        isSearching: isPlaceSearching,
        search: placeSearch,
    } = useNominatimSearch();
    const { recents, addRecent } = useRecentLocations();
    const { addresses, isLoading: isLoadingAddresses } = useSavedAddresses(open);
    const [query, setQuery] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);
    const [isLocatingOnMap, setIsLocatingOnMap] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
    const [listTab, setListTab] = useState<'saved' | 'recent'>('saved');
    const [pickingId, setPickingId] = useState<number | null>(null);
    const cancelledRef = useRef(false);

    const handleQuery = (v: string) => {
        setQuery(v);
        citySearch(v);
        // 6-digit PIN → India Post only. Nominatim free-text on the digits
        // returns postal codes in other countries.
        if (INDIAN_PIN_RE.test(v.trim())) {
            placeSearch('');
        } else {
            placeSearch(v);
        }
    };

    const close = () => {
        cancelledRef.current = true;
        setQuery('');
        setMapCenter(null);
        setListTab('saved');
        setPickingId(null);
        onClose();
    };

    const commit = (city: SelectedCity, extra?: { pincode?: string; state?: string }) => {
        onSelect(withPincode(city, extra?.pincode));
        addRecent({ ...city, ...extra });
        close();
    };

    const handleCurrentLocation = async () => {
        cancelledRef.current = false;
        setIsDetecting(true);
        const pos = await getPosition();
        setIsDetecting(false);
        if (cancelledRef.current) return;
        if (!pos) {
            dispatch(
                showToast({
                    description: "Couldn't detect your location. Please try again.",
                    variant: 'error',
                })
            );
            return;
        }
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    };

    const handleLocateOnMap = async () => {
        cancelledRef.current = false;
        setIsLocatingOnMap(true);
        const center = selectedCity
            ? (await geocodeFirstMatch(selectedCity.name)) || DEFAULT_MAP_CENTER
            : DEFAULT_MAP_CENTER;
        setIsLocatingOnMap(false);
        if (cancelledRef.current) return;
        setMapCenter(center);
    };

    const openMapAtPlace = (lat: number, lng: number) => {
        cancelledRef.current = false;
        setMapCenter({ lat, lng });
    };

    const handleSavedClick = async (address: Address) => {
        if (pickingId !== null) return;
        setPickingId(address.id);
        try {
            const postcode =
                (address.zipCode || '').replace(/\D/g, '') || address.zipCode?.trim() || '';
            const extra = {
                pincode: postcode || undefined,
                state: address.state || undefined,
            };
            let cityName = savedAddressCityName(address);

            if (postcode) {
                const resolved = await lookupPostcode({
                    userId: id,
                    userType: role,
                    postcode,
                });
                if (resolved) {
                    const { city: pinCity, state: pinState } = resolved;
                    if (pinCity) cityName = pinCity;
                    if (pinState) extra.state = pinState;
                }
            }

            if (cityName) {
                const exact = matchCityByName(cityName, extra.state);
                if (exact) {
                    commit({ name: exact.name, code: exact.code }, extra);
                    return;
                }
                const local = searchLocalCities(cityName)[0];
                if (local) {
                    commit({ name: local.name, code: local.code }, extra);
                    return;
                }

                const apiCities = await searchCities({
                    userId: id,
                    userType: role,
                    searchText: cityName,
                });
                const first = Array.isArray(apiCities) ? apiCities[0] : undefined;
                if (first?.label) {
                    const head = firstLabelPart(first.label);
                    const city = resolveCity(head, extra.state);
                    commit({ name: city.name, code: city.code }, extra);
                    return;
                }

                const coords = await geocodeFirstMatch(cityName);
                if (coords) {
                    openMapAtPlace(coords.lat, coords.lng);
                    return;
                }
            }

            dispatch(
                showToast({
                    description: "Couldn't map that address to a delivery city.",
                    variant: 'error',
                })
            );
        } finally {
            setPickingId(null);
        }
    };

    const showResults = query.trim().length > 0;
    const isSearchLoading = isSearching || isPlaceSearching;

    const renderSearchResults = () => {
        if (isSearchLoading) {
            return (
                <Flex justify="center" className="py-4">
                    <Spin size="small" />
                </Flex>
            );
        }

        const hasPlaces = placeOptions.length > 0;
        const hasCities = options.length > 0;

        if (!hasPlaces && !hasCities) {
            return (
                <Text className="block px-2 py-4 text-center text-[13px] text-gray-400">
                    No location found
                </Text>
            );
        }

        return (
            <>
                {hasPlaces && (
                    <>
                        <Text className="mb-0.5 mt-1 block px-2 text-[12px] font-semibold text-[#999]">
                            Places on map
                        </Text>
                        {placeOptions.map((opt, i) => (
                            <LocationRow
                                key={`${opt.lat}-${opt.lng}`}
                                label={opt.label}
                                last={i === placeOptions.length - 1 && !hasCities}
                                onClick={() => openMapAtPlace(opt.lat, opt.lng)}
                            />
                        ))}
                    </>
                )}
                {hasCities && (
                    <>
                        {hasPlaces && <div className="my-2 h-px bg-[#eee]" />}
                        <Text className="mb-0.5 mt-1 block px-2 text-[12px] font-semibold text-[#999]">
                            {INDIAN_PIN_RE.test(query.trim()) ? 'Pincode' : 'Cities'}
                        </Text>
                        {options.map((o, i) => (
                            <LocationRow
                                key={o.value || o.label}
                                label={o.label}
                                pincode={o.pincode}
                                state={o.state}
                                last={i === options.length - 1}
                                active={
                                    o.value
                                        ? selectedCity?.code === o.value
                                        : selectedCity?.name === o.label
                                }
                                onClick={() =>
                                    commit(
                                        { name: o.label, code: o.value },
                                        { pincode: o.pincode, state: o.state }
                                    )
                                }
                            />
                        ))}
                    </>
                )}
            </>
        );
    };

    const renderSavedList = () => {
        if (isLoadingAddresses) {
            return (
                <Flex justify="center" className="py-4">
                    <Spin size="small" />
                </Flex>
            );
        }
        if (!addresses.length) {
            return (
                <Text className="block px-2 py-3 text-center text-[13px] text-gray-400">
                    No saved addresses
                </Text>
            );
        }
        return addresses.map((address, i) => {
            const cityMatch = matchCityByName(address.city, address.state);
            return (
                <LocationRow
                    key={address.id}
                    label={savedAddressTitle(address)}
                    pincode={address.zipCode || undefined}
                    state={cityMatch?.state || address.state || undefined}
                    last={i === addresses.length - 1}
                    active={pickingId === address.id}
                    onClick={() => handleSavedClick(address)}
                />
            );
        });
    };

    const renderRecentList = () => {
        if (!recents.length) {
            return (
                <Text className="block px-2 py-3 text-center text-[13px] text-gray-400">
                    No recent locations
                </Text>
            );
        }
        return recents.map((r: RecentLocation, i) => (
            <LocationRow
                key={r.code}
                label={r.name}
                pincode={r.pincode}
                state={r.state}
                last={i === recents.length - 1}
                active={selectedCity?.code === r.code}
                onClick={() =>
                    commit({ name: r.name, code: r.code }, { pincode: r.pincode, state: r.state })
                }
            />
        ));
    };

    return (
        <Modal
            open={open}
            onCancel={close}
            footer={null}
            closable={false}
            centered
            width={520}
            // 16px on phones: every pixel counts for the map step at 320×475.
            styles={{ content: { borderRadius: 20, padding: sm ? 20 : 16 } }}
        >
            {mapCenter ? (
                <LocationMapStep
                    initialCenter={mapCenter}
                    onBack={() => setMapCenter(null)}
                    onClose={close}
                    onConfirm={commit}
                />
            ) : (
                <>
                    <Flex align="start" justify="space-between" className="mb-4">
                        <Flex vertical gap={2} className="min-w-0 pe-3">
                            <Text className="text-[20px] font-semibold leading-7 text-[#1e293b]">
                                Select a location
                            </Text>
                            <Text className="text-[13px] leading-5 text-[#6a7282]">
                                Products and prices depend on where your order ships.
                            </Text>
                        </Flex>
                        <button
                            type="button"
                            onClick={close}
                            aria-label="Close"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6]"
                        >
                            <CloseOutlined className="text-[11px] text-[#6a7282]" />
                        </button>
                    </Flex>

                    <Input
                        allowClear
                        value={query}
                        onChange={e => handleQuery(e.target.value)}
                        placeholder="Search area, locality or pincode"
                        prefix={<SearchOutlined className="text-[14px] text-[#bdbdbd]" />}
                        className="!h-11 !rounded-xl !border-[#d5dbe3] !bg-white !text-[13px]"
                    />

                    {/* wrap + gap: the two actions total ~303px against ~303px of modal
                        content at 375px, so without wrapping they collided. */}
                    <Flex
                        align="center"
                        justify="space-evenly"
                        wrap="wrap"
                        gap={8}
                        className="mt-3 w-full"
                    >
                        <button
                            type="button"
                            onClick={handleCurrentLocation}
                            disabled={isDetecting}
                            className={ACTION_CLASS}
                        >
                            {isDetecting ? <Spin size="small" /> : <AimOutlined aria-hidden />}
                            Use my current location
                        </button>
                        <button
                            type="button"
                            onClick={handleLocateOnMap}
                            disabled={isLocatingOnMap}
                            className={ACTION_CLASS}
                        >
                            {isLocatingOnMap ? <Spin size="small" /> : <MapFoldIcon />}
                            Locate on map
                        </button>
                    </Flex>

                    {showResults ? (
                        <div className="mt-3 max-h-[280px] overflow-auto">
                            {renderSearchResults()}
                        </div>
                    ) : (
                        <>
                            <Flex align="end" className="mt-3.5 w-full border-b border-[#eee]">
                                <button
                                    type="button"
                                    onClick={() => setListTab('saved')}
                                    className="flex flex-1 items-center justify-center"
                                >
                                    <span
                                        className={`-mb-px border-b-[3px] pb-2 text-[14px] ${
                                            listTab === 'saved'
                                                ? 'border-[#FF4F4F] font-semibold text-[#1e293b]'
                                                : 'border-transparent font-normal text-[#1e293b]'
                                        }`}
                                    >
                                        Saved Address
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setListTab('recent')}
                                    className="flex flex-1 items-center justify-center"
                                >
                                    <span
                                        className={`-mb-px border-b-[3px] pb-2 text-[14px] ${
                                            listTab === 'recent'
                                                ? 'border-[#FF4F4F] font-semibold text-[#1e293b]'
                                                : 'border-transparent font-normal text-[#1e293b]'
                                        }`}
                                    >
                                        Recent Locations
                                    </span>
                                </button>
                            </Flex>
                            <div className="max-h-[240px] overflow-auto pt-1">
                                {listTab === 'saved' ? renderSavedList() : renderRecentList()}
                            </div>
                        </>
                    )}
                </>
            )}
        </Modal>
    );
};

export default LocationModal;
