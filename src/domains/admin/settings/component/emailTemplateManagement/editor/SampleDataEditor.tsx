export const parseSampleData = (
    raw: string
):
    | { status: 'empty' }
    | { status: 'valid'; data: Record<string, unknown> }
    | { status: 'invalid' } => {
    const trimmed = raw.trim();
    if (!trimmed) return { status: 'empty' };
    try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return { status: 'invalid' };
        }
        return { status: 'valid', data: parsed as Record<string, unknown> };
    } catch {
        return { status: 'invalid' };
    }
};
