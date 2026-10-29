import { useParams } from 'react-router-dom';

import OfficeSuppliesTop from '../components/OfficeSuppliesTop';
import ProductDetails from '../components/productDetails/ProductDetails';
import { useProductDetailsApi } from '../hooks/useProductDetailsApi';

function OfficeSupplies() {
    const { id } = useParams();
    const ondcProductId = decodeURIComponent(id!);
    const { productImages, productDetails, isLoading } = useProductDetailsApi(ondcProductId);
    return (
        <div className="mx-auto w-full max-w-[1560px]">
            <OfficeSuppliesTop />
            <ProductDetails
                productDetails={productDetails!}
                productImages={productImages}
                isLoading={isLoading}
            />
        </div>
    );
}

export default OfficeSupplies;
