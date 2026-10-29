import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBusinessDocs } from '../../api/dashBoardIndex';
import templateIcon from '../../assets/icons/companydocuments/templateicon.svg';

type PayrollTemplateDocument = {
    id: number;
    name: string;
    document: string;
};

type PayrollTemplateCategory = {
    id: number;
    categoryName: string;
    categoryImage?: string | null;
    documents?: PayrollTemplateDocument[];
};

type PayrollTemplatesResponse = {
    categoryDataWithDocuments?: PayrollTemplateCategory[];
};

export type CompanyDocCategoryCard = {
    id: number;
    icon: string;
    category: string;
    size: number;
};

export const useGetCompanyDoc = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [categoryData, setCategoryData] = useState<CompanyDocCategoryCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getBusinessDocsCategory = useCallback(async () => {
        const res: PayrollTemplatesResponse | false = await getBusinessDocs({
            userId: id,
            userType: role,
        });

        if (res) {
            const arr =
                res.categoryDataWithDocuments?.map(item => ({
                    id: item.id,
                    icon: item.categoryImage || templateIcon,
                    category: item.categoryName ?? '',
                    size: item.documents?.length ?? 0,
                })) ?? [];
            setCategoryData(arr);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getBusinessDocsCategory();
    }, [getBusinessDocsCategory]);

    return { data: categoryData, isLoading };
};
