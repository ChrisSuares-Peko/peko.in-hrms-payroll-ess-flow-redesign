const TypeBadge = ({ type }: { type: string }) => {
    const isCredit = type === 'Credit';
    return (
        <span
            style={{
                backgroundColor: isCredit ? '#dcfce7' : '#fee2e2',
                color: isCredit ? '#16a34a' : '#dc2626',
                borderRadius: 60,
                padding: '3px 12px',
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
            }}
        >
            {type}
        </span>
    );
};

export default TypeBadge;
