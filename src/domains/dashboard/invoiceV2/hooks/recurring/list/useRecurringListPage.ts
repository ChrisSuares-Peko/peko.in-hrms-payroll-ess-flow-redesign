import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

export const useRecurringListPage = () => {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);

    const handleMakeRecurring = () => setModalOpen(true);

    const handleCloseModal = () => setModalOpen(false);

    const handleView = (id: string) => {
        navigate(`/${paths.invoice.index}/${paths.invoice.recurringView}`, {
            state: { id },
        });
    };

    return {
        modalOpen,
        handleMakeRecurring,
        handleCloseModal,
        handleView,
    };
};
