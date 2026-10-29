import React from 'react';

import { Button } from 'antd';

interface Props {
    classkey: string;
    addingId: string | null;
    onAdd: () => void;
    primary?: boolean;
}

const DomainCartControl: React.FC<Props> = ({ classkey, addingId, onAdd, primary = false }) =>
    primary ? (
        <Button className="bg-lightRed border-lightRed text-white" loading={addingId === classkey} onClick={onAdd}>
            Add to cart
        </Button>
    ) : (
        <Button size="small" className="border-brandPrimary text-brandPrimary w-24" loading={addingId === classkey} onClick={onAdd}>
            Add to cart
        </Button>
    );

export default DomainCartControl;
