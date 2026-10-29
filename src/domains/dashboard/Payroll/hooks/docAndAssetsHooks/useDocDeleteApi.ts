import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';


import { deleteDocument } from '../../api/docAndAssetsApi/index';
import { DocResponse } from '../../types/docAndAssetsTypes';

interface useDeleteDocumentApiProps {
    handleCancel: () => void;
}

export const useDeleteDocumentApi = ({ handleCancel }: useDeleteDocumentApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const deleteDocumentData = async (
        documentId: string | undefined,
        employeeId: string | undefined
    ) => {
        setIsLoading(true);
        const data: DocResponse | false = await deleteDocument({
            userId: id,
            userType: role,
            documentId,
            employeeId,
        });
        if (data) {
          
            handleCancel();
        }
        setIsLoading(false);
    };

    return { deleteDocumentData, deleteLoader: isLoading };
};
