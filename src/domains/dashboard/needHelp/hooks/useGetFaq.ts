import { useCallback, useState } from 'react';

import { getFaq } from '../api/index';
import { FAQDataResponse, CategorizedFAQData, FAQ } from '../types/type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const categorizeAndSplitFaqs = (
    faqData: FAQDataResponse
): [CategorizedFAQData[], CategorizedFAQData[]] => {
    const categorizedData = Object.entries(faqData).map(([category, items]) => ({
        category,
        items,
    }));

    let leftTotal = 0;
    let rightTotal = 0;
    const leftData: CategorizedFAQData[] = [];
    const rightData: CategorizedFAQData[] = [];

    categorizedData.forEach(category => {
        if (leftTotal <= rightTotal) {
            leftData.push(category);
            leftTotal += category.items.length;
        } else {
            rightData.push(category);
            rightTotal += category.items.length;
        }
    });

    return [leftData, rightData];
};

export default function useFaqApi() {
    const [data, setData] = useState<FAQ[]>(); // Initialize as an empty array
    const [isLoading, setIsLoading] = useState(true); // Loading state

    const getAllFaqs = useCallback(async (faqCategory: string) => {
        setIsLoading(true); // Start loading
        const fetchedData = await getFaq(faqCategory); // Fetch the data

        if (fetchedData) {
            setData(fetchedData); // Set the fetched data
        }

        setIsLoading(false); // Stop loading
    }, []); // Add dependencies if necessary

    return { data, isLoading, getAllFaqs }; // Return the data, loading state, and the fetch function
}
