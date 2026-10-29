import { useEffect, useState } from 'react';

import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import cloudHostingImg from '../assets/img/cloud-hosting.png';
import DomainSearchHero from '../components/landing/DomainSearchHero';
import DomainSearchResults from '../components/landing/DomainSearchResults';
import HostingServicesGrid from '../components/landing/HostingServicesGrid';
import LandingPageHeader from '../components/landing/LandingPageHeader';
import useHostingServices from '../hooks/useHostingServices';
import useSearchDomains from '../hooks/useSearchDomains';
import useServiceCart from '../hooks/useServiceCart';
import { DomainResult } from '../types/index';
import { services } from '../utils/data';

const { Text } = Typography;

const dedupeByDomain = (domains: DomainResult[]): DomainResult[] => {
    const seen = new Set<string>();
    return domains.filter(d => {
        if (seen.has(d.domain)) return false;
        seen.add(d.domain);
        return true;
    });
};

const LandingPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [addingId, setAddingId] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
    const [isProceedLoading, setIsProceedLoading] = useState(false);
    const [isAddingSelected, setIsAddingSelected] = useState(false);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams] = useSearchParams();
    const isDomainSearchView = searchParams.get('view') === 'search';

    const { handleSearch, handleClear, isLoading } = useSearchDomains();
    const { fetchCart, handleAddToCart, handleRemoveFromCart, cartConflictModalProps } = useServiceCart();
    const { services: liveServices, isLoading: isServicesLoading } = useHostingServices();

    const searchResults = useAppSelector(state => state.reducer.domainHosting.searchResults);
    const cartData = useAppSelector(state => state.reducer.domainHosting.cartData);

    const cartBadgeCount = cartData?.items?.reduce((sum, i) => sum + (i.productQuantity ?? 1), 0) ?? 0;
    const cartItemCount = cartData?.items?.filter(i => i.itemType === 'domain').length ?? 0;

    const userTypedTld = searchQuery.includes('.');
    const exactMatch = userTypedTld ? (searchResults?.exactMatch?.[0] ?? null) : null;
    const suggestions = searchResults?.suggestions ?? [];
    const otherDomains: DomainResult[] = Array.isArray(searchResults?.premium) ? searchResults.premium : [];
    const popularTlds = searchResults?.popularTlds ?? [];
    const isDomainAvailable = !!exactMatch?.available;
    const heroTitle =
        searchResults && !isDomainAvailable ? 'Search for Your Domain Today' : "Let's Get Your Business Online";

    const apiPlanTypes = new Set(liveServices.map(s => s.planType));
    const visibleServices = services.filter(s => apiPlanTypes.has(s.planType));
    const colSpan = visibleServices.length >= 4 ? 6 : 8;
    const startingPriceMap = Object.fromEntries(
        liveServices.filter(s => s.startingPrice != null).map(s => [s.planType, s.startingPrice as number]),
    );

    useEffect(() => {
        fetchCart();
        return () => {
            handleClear();
        };
    }, [fetchCart, handleClear]);

    const onSearch = () => {
        if (!searchQuery.trim()) {
            dispatch(showToast({ variant: 'warning', description: 'Domain name is required' }));
            return;
        }
        setSelectedDomains(new Set());
        handleSearch(searchQuery);
    };

    const onReset = () => {
        setSearchQuery('');
        setSelectedDomains(new Set());
        handleClear();
    };

    const checkDomainInCart = (classkey: string, domainName: string) =>
        (cartData?.items ?? []).some(i => i.productId === classkey && i.productName === domainName);

    const onToggleSelect = (domainName: string) => {
        setSelectedDomains(prev => {
            const next = new Set(prev);
            if (next.has(domainName)) {
                next.delete(domainName);
            } else {
                next.add(domainName);
            }
            return next;
        });
    };

    const onAdd = async (domain: DomainResult) => {
        setAddingId(domain.classkey);
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('domain_add_to_cart', {
                domain_name: domain.domain,
                price: domain.price,
            });
        }
        const result = await handleAddToCart({ itemType: 'domain', productId: domain.classkey, productName: domain.domain });
        if (result) {
            dispatch(showToast({ variant: 'success', description: `${domain.domain} has been added to your cart!` }));
        }
        setAddingId(null);
    };

    const onRemove = async (domain: DomainResult) => {
        setRemovingId(domain.classkey);
        await handleRemoveFromCart(domain.classkey, null, undefined, domain.domain, 'domain');
        setRemovingId(null);
    };

    // Add sequentially — the cart add is a read-modify-write on the server, so concurrent calls race.
    // Resolves with the count of domains that were actually added (some may be rejected, e.g. premium domains).
    const addDomainsSequentially = (domains: DomainResult[]): Promise<number> =>
        domains.reduce<Promise<number>>(
            (promise, domain) =>
                promise.then(async added => {
                    const result = await handleAddToCart({ itemType: 'domain', productId: domain.classkey, productName: domain.domain });
                    return result ? added + 1 : added;
                }),
            Promise.resolve(0),
        );

    const onProceedToCart = async () => {
        const allDomains = [
            ...(exactMatch ? [exactMatch] : []),
            ...suggestions,
            ...otherDomains,
        ];
        const toAdd = dedupeByDomain(allDomains).filter(
            d => selectedDomains.has(d.domain) && !checkDomainInCart(d.classkey, d.domain),
        );
        setIsProceedLoading(true);
        const added = await addDomainsSequentially(toAdd);
        setIsProceedLoading(false);
        const failed = toAdd.length - added;
        if (failed > 0) {
            dispatch(showToast({
                variant: 'error',
                description: `${failed} ${failed === 1 ? 'domain' : 'domains'} could not be added (not available for purchase).`,
            }));
        }
        navigate(paths.domainHosting.cart);
    };

    const onAddSelectedToCart = async () => {
        const allDomains = [
            ...(exactMatch ? [exactMatch] : []),
            ...suggestions,
            ...otherDomains,
        ];
        const toAdd = dedupeByDomain(allDomains).filter(
            d => selectedDomains.has(d.domain) && !checkDomainInCart(d.classkey, d.domain),
        );
        if (toAdd.length === 0) return;
        setIsAddingSelected(true);
        const added = await addDomainsSequentially(toAdd);
        setIsAddingSelected(false);
        if (added > 0) {
            dispatch(showToast({
                variant: 'success',
                description: `${added} ${added === 1 ? 'domain has' : 'domains have'} been added to your cart!`,
            }));
        }
        const failed = toAdd.length - added;
        if (failed > 0) {
            dispatch(showToast({
                variant: 'error',
                description: `${failed} ${failed === 1 ? 'domain' : 'domains'} could not be added (not available for purchase).`,
            }));
        }
    };

    const renderNoSearchContent = () => {
        if (isDomainSearchView) {
            return (
                <Flex vertical align="center" justify="center" gap={16} className="py-20">
                    <img src={cloudHostingImg} alt="" className="w-64 h-auto object-contain" />
                    <Text className="text-gray-400">Search for your perfect domain.</Text>
                </Flex>
            );
        }
        if (isServicesLoading) {
            return (
                <Row gutter={[16, 16]} justify="center">
                    {[1, 2, 3, 4].map(i => (
                        <Col xs={24} sm={12} lg={colSpan} key={i}>
                            <Skeleton active />
                        </Col>
                    ))}
                </Row>
            );
        }
        return (
            <HostingServicesGrid
                visibleServices={visibleServices}
                startingPriceMap={startingPriceMap}
                colSpan={colSpan}
                onNavigate={navigate}
            />
        );
    };

    return (
        <Content className="px-4 py-4 sm:px-6 sm:py-6 bg-white min-h-screen">
            <LandingPageHeader
                cartBadgeCount={cartBadgeCount}
                onOrderHistory={() => navigate(paths.domainHosting.manageSubscription)}
                onCart={() => navigate(paths.domainHosting.cart)}
            />

            <DomainSearchHero
                searchQuery={searchQuery}
                isLoading={isLoading}
                hasResults={!!searchResults}
                heroTitle={heroTitle}
                onSearchChange={setSearchQuery}
                onSearch={onSearch}
                onReset={onReset}
            />

            {!isLoading && searchResults && (
                <div className="max-w-[960px] min-[2048px]:max-w-[1400px] min-[2560px]:max-w-[2000px] mx-auto">
                    <DomainSearchResults
                        exactMatch={exactMatch}
                        isDomainAvailable={isDomainAvailable}
                        suggestions={suggestions}
                        otherDomains={otherDomains}
                        popularTlds={popularTlds}
                        selectedDomains={selectedDomains}
                        isProceedLoading={isProceedLoading}
                        addingId={addingId}
                        updatingId={removingId}
                        checkDomainInCart={checkDomainInCart}
                        onAdd={onAdd}
                        onRemove={onRemove}
                        onToggleSelect={onToggleSelect}
                        onProceedToCart={onProceedToCart}
                        onAddSelectedToCart={onAddSelectedToCart}
                        addingSelected={isAddingSelected}
                        cartItemCount={cartItemCount}
                    />
                </div>
            )}

            {!searchResults && !isLoading && renderNoSearchContent()}
            <ConfirmationModal {...cartConflictModalProps} />
        </Content>
    );
};

export default LandingPage;
