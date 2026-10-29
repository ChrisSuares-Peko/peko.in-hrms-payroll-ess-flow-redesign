import { useEffect, useRef, useState, type FC } from 'react';

import { DownOutlined, EnvironmentFilled, SearchOutlined } from '@ant-design/icons';
import { Button, Divider, Flex, Input, Typography, type InputRef } from 'antd';

import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import LocationModal from './LocationModal';
import SearchSuggestionCard from './SearchSuggestionCard';
import { useProductSearch } from '../../hooks/useProductSearch';
import { ondcCityCode, SelectedCity } from '../../utils/indianCityStdCodes';

interface SearchLocationBarProps {
    selectedCity: SelectedCity | null;
    onSelectCity: (city: SelectedCity | null) => void;
    isLoadingCity?: boolean;
    /** last COMMITTED search (drives the product grid) — only changes on Enter/Search click */
    searchText: string;
    setSearchText: (v: string) => void;
}

/**
 * Combined location + product-search bar. The "Deliver to" pill opens the
 * "Select a location" modal; the product-search input shows an autocomplete
 * dropdown of matching products.
 */
const SearchLocationBar: FC<SearchLocationBarProps> = ({
    selectedCity,
    onSelectCity,
    isLoadingCity = false,
    searchText,
    setSearchText,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const inputBoxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<InputRef>(null);
    const [locationOpen, setLocationOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    // What's currently typed, kept separate from `searchText` so the product
    // grid only re-queries once the search is actually submitted — typing
    // still updates the live suggestion dropdown below via `search(v)`.
    const [draftText, setDraftText] = useState(searchText);
    // Geometry of the text-input segment, relative to this bar — the suggestions
    // panel is sized to it (not to the whole bar), so it lines up with the input
    // and excludes the location pill and the Search button.
    const [inputBox, setInputBox] = useState<{ left: number; width: number } | null>(null);
    const { suggestions, search } = useProductSearch(ondcCityCode(selectedCity));
    const dispatch = useAppDispatch();
    // Phones (<576px) get a placeholder that fits the input's own row; the full
    // sentence was cut to "Please enter a product or cate" at 320px.
    const { sm } = useScreenSize();

    // Measured rather than hard-coded: the location pill grows with a long city
    // name, and the bar wraps at narrow widths (the input then takes a full row),
    // so any fixed left/right offset would drift.
    useEffect(() => {
        const el = inputBoxRef.current;
        const bar = containerRef.current;
        if (!el || !bar) return undefined;

        const measure = () => {
            const box = el.getBoundingClientRect();
            const barBox = bar.getBoundingClientRect();
            setInputBox({ left: box.left - barBox.left, width: box.width });
        };

        measure();
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(el);
        resizeObserver.observe(bar);
        return () => resizeObserver.disconnect();
    }, []);

    // Close the suggestion dropdown when clicking outside the entire search bar
    // + dropdown area. Replaces the previous brittle onBlur timeout that raced
    // with touch-event click synthesis on mobile/tablet devices.
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setDraftText(searchText);
    }, [searchText]);

    const handleSearchChange = (v: string) => {
        setDraftText(v);
        search(v);
    };

    const commitSearch = () => {
        if (!draftText.trim()) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Please enter a product or category to search',
                })
            );
            return;
        }
        search.cancel();
        setFocused(false);
        inputRef.current?.blur();
        setSearchText(draftText);
    };

    // Only mount when there is at least one hit — no spinner or empty-state panel.
    const suggestOpen = focused && !!draftText.trim() && suggestions.length > 0;

    return (
        // `relative` so the suggestions panel below can be positioned against
        // THIS bar (absolute + a measured left/width matching the text input) —
        // deliberately not using antd Dropdown here, since its trigger-rect math
        // proved to depend on the surrounding page layout (sidebar width,
        // viewport) and didn't align consistently once this bar was embedded in
        // the real dashboard page.
        <div className="relative w-full" ref={containerRef}>
            <Flex
                align="stretch"
                gap={8}
                wrap="wrap"
                className={`w-full rounded-[18px] border bg-white p-2 ${
                    focused ? 'border-lightRed' : 'border-[#d8d8d8]'
                }`}
            >
                {/* Location trigger → opens the Select a location modal. On phones it
                    takes its own full row (the bar wraps there anyway), instead of a
                    190px pill with dead space beside it; from sm up it sits inline. */}
                <Flex
                    align="center"
                    gap={8}
                    role="button"
                    onClick={() => setLocationOpen(true)}
                    className="w-full shrink-0 cursor-pointer rounded-xl bg-[#f8f8f8] px-3 py-1.5 sm:w-auto sm:min-w-[190px]"
                >
                    <EnvironmentFilled className="text-base text-bgOrange" />
                    <Flex vertical align="start" className="min-w-0 flex-1 leading-tight">
                        <Typography.Text className="text-[10px] text-[#6e737c]">
                            {isLoadingCity ? 'Loading…' : 'Deliver to'}
                        </Typography.Text>
                        <Typography.Text
                            ellipsis
                            className="text-[15px] font-medium text-[#1e293b]"
                        >
                            {selectedCity?.name || 'Select location'}
                        </Typography.Text>
                    </Flex>
                    <DownOutlined className="text-xs text-[#1e293b]" />
                </Flex>

                <Divider type="vertical" className="!mx-0 hidden h-6 self-center md:block" />

                {/* Product search input — the wrapper is what the suggestions
                    panel measures itself against, so it owns the flex sizing.
                    No min-width on phones: a fixed 180px could push a narrow bar
                    past the screen edge; it has its own row there. */}
                <div
                    ref={inputBoxRef}
                    className="flex min-w-0 flex-1 basis-full items-center sm:basis-0 sm:min-w-[180px]"
                >
                    <Input
                        ref={inputRef}
                        variant="borderless"
                        allowClear
                        value={draftText}
                        onChange={e => handleSearchChange(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onPressEnter={commitSearch}
                        placeholder={
                            sm
                                ? 'Please enter a product or category to search'
                                : 'Search products'
                        }
                        maxLength={100}
                        prefix={<SearchOutlined className="me-1 text-[#b0b0b0] md:hidden" />}
                        className="w-full !ps-0 text-base md:!ps-1"
                    />
                </div>

                {/* Search button — stretches so top / right / bottom match bar p-2 */}
                <Button
                    type="primary"
                    onClick={commitSearch}
                    className="!h-auto !min-h-11 !w-full self-stretch !rounded-lg !border-none !bg-bgOrange !font-normal md:!w-[140px]"
                >
                    Search
                </Button>

                <LocationModal
                    open={locationOpen}
                    onClose={() => setLocationOpen(false)}
                    selectedCity={selectedCity}
                    onSelect={onSelectCity}
                />
            </Flex>

            {suggestOpen && (
                // Not a control — onMouseDown only preventDefaults so clicking
                // inside the dropdown doesn't blur the search input first.
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <div
                    className="absolute top-full z-[1050] mt-2"
                    // Falls back to spanning the whole bar until the first measure.
                    style={
                        inputBox
                            ? { left: inputBox.left, width: inputBox.width }
                            : { left: 0, right: 0 }
                    }
                    onMouseDown={e => e.preventDefault()}
                >
                    {/* max-h: `overflow-y-auto` with no height cap is a no-op — 10
                        suggestions at grid-cols-2 made an ~870px panel that buried a
                        phone viewport instead of scrolling inside itself. */}
                    <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-[#f5f5f5] bg-white p-4 drop-shadow-[0px_6px_20px_rgba(0,0,0,0.15)] sm:p-5 md:p-6">
                        <Typography.Text className="mb-5 block text-sm font-semibold leading-5 text-[#999999] md:text-[17px]">
                            Products
                        </Typography.Text>
                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 md:grid-cols-5">
                            {suggestions.slice(0, 10).map(product => (
                                <SearchSuggestionCard key={product.id} {...product} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchLocationBar;
