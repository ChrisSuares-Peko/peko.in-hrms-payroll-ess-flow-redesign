import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import ProductListing from '../components/home/ProductListing';
import OfficeSuppliesTop from '../components/OfficeSuppliesTop';
import { useOfficeSuppliesCity } from '../hooks/useOfficeSuppliesCity';
import { useOfficeSupplyCategories } from '../hooks/useOfficeSupplyCategories';
import { OfficeCategory } from '../utils/officeSupplyCategories';

const OfficeSupplies = () => {
    const navigate = useNavigate();
    const { selectedCity, setSelectedCity, isLoadingCity } = useOfficeSuppliesCity();
    const { categories, isLoading: isLoadingCategories } = useOfficeSupplyCategories();

    const goToResults = (params: Record<string, string>) => {
        const query = new URLSearchParams(params).toString();
        navigate(`${paths.dashboard.officeSupplies}/${paths.officeSupplies.products}?${query}`);
    };

    const handleSearch = (searchText: string) => {
        if (!searchText.trim()) return;
        goToResults({ search: searchText });
    };

    const handleSelectCategory = (category: OfficeCategory) => {
        // "All Product" has nothing to navigate to — it's already the browse/home state.
        if (category.key === 'all') return;
        goToResults({ category: category.key });
    };

    return (
        // Cap + centre the content column so extra width on large monitors becomes
        // whitespace instead of stretched rows (matches ProductDetailsPage's wrapper).
        <div className="mx-auto w-full max-w-7xl">
            <OfficeSuppliesTop />
            <ProductListing
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                isLoadingCity={isLoadingCity}
                categories={categories}
                isLoadingCategories={isLoadingCategories}
                onSearch={handleSearch}
                onSelectCategory={handleSelectCategory}
            />
        </div>
    );
};
export default OfficeSupplies;
