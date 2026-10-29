import { useEffect, useRef, useState, type FC } from 'react';

import {
    AimOutlined,
    ArrowLeftOutlined,
    CloseOutlined,
    EnvironmentFilled,
    SearchOutlined,
} from '@ant-design/icons';
import { Button, Flex, Input, Spin, Typography } from 'antd';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import { useCitySearch } from '../../hooks/useCitySearch';
import { getPosition } from '../../hooks/useCurrentLocation';
import { geocodeFirstMatch, useNominatimSearch } from '../../hooks/useNominatimSearch';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';
import { INDIAN_PIN_RE, type SelectedCity } from '../../utils/indianCityStdCodes';

const { Text } = Typography;

const DEFAULT_ZOOM = 16;

interface LocationMapStepProps {
    initialCenter: { lat: number; lng: number };
    onBack: () => void;
    onClose: () => void;
    onConfirm: (city: SelectedCity, extra: { pincode?: string; state?: string }) => void;
}

const MapController: FC<{
    onReady: (map: LeafletMap) => void;
    onMoveEnd: (lat: number, lng: number) => void;
}> = ({ onReady, onMoveEnd }) => {
    const map = useMap();

    useEffect(() => {
        onReady(map);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    useMapEvents({
        moveend: () => {
            const center = map.getCenter();
            onMoveEnd(center.lat, center.lng);
        },
    });

    return null;
};

/**
 * "Confirm delivery location" map step — Leaflet center pin, Nominatim search,
 * reverse geocode, and confirm. Reached from step 1 tabs or a place search pick.
 */
const LocationMapStep: FC<LocationMapStepProps> = ({
    initialCenter,
    onBack,
    onClose,
    onConfirm,
}) => {
    const dispatch = useAppDispatch();
    const { sm } = useScreenSize();
    const mapRef = useRef<LeafletMap | null>(null);
    const [query, setQuery] = useState('');
    const { resolved, isResolving, reverseGeocode } = useReverseGeocode();
    const { options, isSearching, search } = useNominatimSearch();
    const { options: cityOptions, isSearching: isCitySearching, search: citySearch } =
        useCitySearch();
    const [locating, setLocating] = useState(false);
    const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
    const [pincodePanning, setPincodePanning] = useState(false);

    useEffect(() => {
        reverseGeocode(initialCenter.lat, initialCenter.lng);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialCenter.lat, initialCenter.lng]);

    const panTo = (lat: number, lng: number) => {
        mapRef.current?.setView([lat, lng], DEFAULT_ZOOM);
    };

    const handleSearchChange = (v: string) => {
        setQuery(v);
        setSuggestionsDismissed(false);
        search(v);
        if (INDIAN_PIN_RE.test(v.trim())) {
            citySearch(v);
        }
    };

    const handlePickResult = (opt: { label: string; lat: number; lng: number }) => {
        setQuery(opt.label);
        setSuggestionsDismissed(true);
        panTo(opt.lat, opt.lng);
    };

    const handlePickCityOption = async (label: string) => {
        setPincodePanning(true);
        const coords = (await geocodeFirstMatch(label)) || null;
        setPincodePanning(false);
        if (!coords) {
            dispatch(
                showToast({
                    description: 'Could not locate that pincode on the map.',
                    variant: 'error',
                })
            );
            return;
        }
        setQuery(label);
        setSuggestionsDismissed(true);
        panTo(coords.lat, coords.lng);
    };

    const handleUseCurrentLocation = async () => {
        setLocating(true);
        const pos = await getPosition();
        setLocating(false);
        if (!pos) {
            dispatch(
                showToast({
                    description: "Couldn't detect your location. Please try again.",
                    variant: 'error',
                })
            );
            return;
        }
        panTo(pos.coords.latitude, pos.coords.longitude);
    };

    const handleConfirm = () => {
        if (!resolved) return;
        onConfirm(resolved.stdCity, {
            pincode: resolved.pincode || undefined,
            state: resolved.state || undefined,
        });
    };

    const showResults = query.trim().length > 0 && !suggestionsDismissed;
    const showPincodeFallback =
        showResults &&
        !isSearching &&
        !options.length &&
        INDIAN_PIN_RE.test(query.trim()) &&
        cityOptions.length > 0;

    let searchResultsContent = (
        <Text className="block px-2 py-3 text-center text-gray-400">No location found</Text>
    );
    if (isSearching || isCitySearching || pincodePanning) {
        searchResultsContent = (
            <Flex justify="center" className="py-4">
                <Spin size="small" />
            </Flex>
        );
    } else if (options.length) {
        searchResultsContent = (
            <>
                {options.map(opt => (
                    <button
                        type="button"
                        key={`${opt.lat}-${opt.lng}`}
                        onClick={() => handlePickResult(opt)}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[#f7f7f7]"
                    >
                        <EnvironmentFilled className="mt-0.5 shrink-0 text-bgOrange" />
                        <span className="truncate">{opt.label}</span>
                    </button>
                ))}
            </>
        );
    } else if (showPincodeFallback) {
        searchResultsContent = (
            <>
                {cityOptions.map(opt => (
                    <button
                        type="button"
                        key={opt.value || opt.label}
                        onClick={() => handlePickCityOption(opt.label)}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[#f7f7f7]"
                    >
                        <EnvironmentFilled className="mt-0.5 shrink-0 text-bgOrange" />
                        <span className="truncate">
                            {opt.label}
                            {opt.state ? ` · ${opt.state}` : ''}
                        </span>
                    </button>
                ))}
            </>
        );
    }

    return (
        // Tighter rhythm below sm: the whole step has to fit a 320×417 phone.
        <Flex vertical className="gap-3 sm:gap-5">
            <Flex align="center" justify="space-between" gap={8}>
                <Flex align="center" className="min-w-0 gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Back"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] sm:h-9 sm:w-9"
                    >
                        <ArrowLeftOutlined className="text-[#1e293b]" />
                    </button>
                    {/* 15px below sm keeps the title on one line beside the 32px buttons
                        (~176px free at 320); text-lg wrapped it to two. */}
                    <Text className="min-w-0 text-[15px] font-semibold leading-6 text-[#1e293b] sm:text-2xl">
                        Confirm delivery location
                    </Text>
                </Flex>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] sm:h-9 sm:w-9"
                >
                    <CloseOutlined className="text-[#6a7282]" />
                </button>
            </Flex>

            <div className="relative">
                <Input
                    size="large"
                    allowClear
                    value={query}
                    onChange={e => handleSearchChange(e.target.value)}
                    placeholder={sm ? 'Search area, locality or pincode' : 'Search area or pincode'}
                    prefix={<SearchOutlined className="me-1 text-[#bdbdbd]" />}
                    className="!h-11 !rounded-2xl !border-[#dce5ee] !bg-[#f8fafc] text-base sm:!h-14"
                />
                {showResults && (
                    <div className="absolute z-[1000] mt-1 max-h-[220px] w-full overflow-auto rounded-xl border border-[#eee] bg-white p-2 shadow-lg">
                        {searchResultsContent}
                    </div>
                )}
            </div>

            {/* Viewport-relative on phones: antd caps modal WIDTH but never height, so a
                fixed map pushes Confirm (and the header) off a short screen. 30vh with a
                120px floor keeps header → Confirm inside a 320×417 viewport. */}
            <div className="relative h-[30vh] max-h-[380px] min-h-[120px] w-full overflow-hidden rounded-2xl sm:h-[380px]">
                <MapContainer
                    center={[initialCenter.lat, initialCenter.lng]}
                    zoom={DEFAULT_ZOOM}
                    zoomControl={false}
                    className="h-full w-full"
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    {/* Top-right: at phone widths the bottom-left "Use my current location"
                        pill runs into a bottom-right zoom control. Hidden below sm — phones
                        pinch-zoom, and on a ~125px map the control covered half of it. */}
                    {sm && <ZoomControl position="topright" />}
                    <MapController
                        onReady={map => {
                            mapRef.current = map;
                        }}
                        onMoveEnd={(lat, lng) => {
                            reverseGeocode(lat, lng);
                        }}
                    />
                </MapContainer>

                <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
                    <EnvironmentFilled className="text-[36px] text-bgOrange drop-shadow-md" />
                </div>

                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    // bottom-6 below sm: on a narrow map the pill and the attribution line share the same x range.
                    className="absolute bottom-6 left-3 z-[500] flex items-center gap-2 rounded-full border border-bgOrange bg-white px-3 py-1.5 text-xs font-medium text-bgOrange shadow-md disabled:opacity-60 sm:bottom-4 sm:left-4 sm:px-4 sm:py-2 sm:text-sm"
                >
                    {locating ? <Spin size="small" /> : <AimOutlined />}
                    Use my current location
                </button>
            </div>

            <Flex vertical gap={4}>
                <Text className="text-sm font-medium text-[#999]">Selected Location</Text>
                {/* Stacked below sm: beside Confirm a 320px phone left the address ~110px. */}
                <Flex className="flex-col gap-2 rounded-xl bg-[#f8f8f8] p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <Flex align="center" gap={10} className="min-w-0">
                        <EnvironmentFilled className="shrink-0 text-lg text-bgOrange" />
                        {isResolving ? (
                            <Text className="text-[#6b6b6b]">Resolving address…</Text>
                        ) : (
                            // Two lines before the ellipsis.
                            <Typography.Paragraph
                                ellipsis={{ rows: 2 }}
                                className="!mb-0 text-[14px] leading-5 text-[#1e293b] sm:text-[15px]"
                            >
                                {resolved?.displayName || 'Move the map to select a location'}
                            </Typography.Paragraph>
                        )}
                    </Flex>
                    <Button
                        type="primary"
                        danger
                        disabled={!resolved || isResolving}
                        onClick={handleConfirm}
                        className="!h-10 !w-full !shrink-0 !rounded-lg !font-medium sm:!w-auto"
                    >
                        Confirm
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default LocationMapStep;
