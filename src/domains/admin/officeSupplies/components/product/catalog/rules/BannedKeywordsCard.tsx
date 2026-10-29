import { FC, useMemo, useState } from 'react';

import { CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Modal, Segmented, Tooltip } from 'antd';

import RuleSection, { ChangeMeta, CountPill } from './RuleSection';
import { changeText, plural, timeAgo } from './ruleUtils';
import { BannedKeyword, KeywordPreview, RuleLastChange } from '../../../../types/ondcCatalogRules';

type SortKey = 'newest' | 'az' | 'hits';

interface Props {
    keywords: BannedKeyword[];
    hiding: number;
    lastChange: RuleLastChange | null;
    onPreview: (words: string[]) => Promise<KeywordPreview | false>;
    /** resolves true once the words are banned; false if cancelled or failed */
    onAdd: (words: string[], preview: KeywordPreview) => Promise<boolean>;
    onRemove: (keyword: BannedKeyword) => void;
    onHistory: () => void;
}

/** Same canonical form the server stores: lower-case, punctuation → single space. */
const parseWords = (raw: string) =>
    Array.from(
        new Set(
            raw
                .split(/[,\n]/)
                .map(w =>
                    w
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, ' ')
                        .trim()
                )
                .filter(Boolean)
        )
    );

const KeywordChip: FC<{ keyword: BannedKeyword; onRemove: () => void }> = ({
    keyword,
    onRemove,
}) => {
    const active = keyword.hits > 0;
    return (
        <Tooltip
            title={`Added by ${keyword.addedByName || 'Admin'} · ${timeAgo(keyword.createdAt)}${
                active ? ` · kept ${plural(keyword.hits, 'product')} out in the last 24 h` : ''
            }`}
        >
            <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[12px] ${
                    active
                        ? 'border-[#101828] bg-[#101828] text-white'
                        : 'border-[#EAECF0] bg-[#F9FAFB] text-[#344054]'
                }`}
            >
                {keyword.word}
                {active && (
                    <span className="rounded bg-white px-1 text-[10px] font-semibold leading-[14px] text-[#101828]">
                        {keyword.hits}
                    </span>
                )}
                <button
                    type="button"
                    aria-label={`Remove ${keyword.word}`}
                    onClick={onRemove}
                    className={`flex cursor-pointer items-center border-none bg-transparent p-0 ${
                        active
                            ? 'text-[#D0D5DD] hover:text-white'
                            : 'text-[#98A2B3] hover:text-[#101828]'
                    }`}
                >
                    <CloseOutlined className="text-[9px]" />
                </button>
            </span>
        </Tooltip>
    );
};

const BannedKeywordsCard: FC<Props> = ({
    keywords,
    hiding,
    lastChange,
    onPreview,
    onAdd,
    onRemove,
    onHistory,
}) => {
    const [draft, setDraft] = useState('');
    const [preview, setPreview] = useState<KeywordPreview | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [pasteOpen, setPasteOpen] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<SortKey>('newest');
    const [onlyHiding, setOnlyHiding] = useState(false);

    const hidingWords = keywords.filter(k => k.hits > 0).length;

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = keywords.filter(
            k => (!q || k.word.includes(q)) && (!onlyHiding || k.hits > 0)
        );
        if (sort === 'az') return [...list].sort((a, b) => a.word.localeCompare(b.word));
        if (sort === 'hits') return [...list].sort((a, b) => b.hits - a.hits);
        return list; // the API returns newest first
    }, [keywords, search, sort, onlyHiding]);

    const runPreview = async (raw: string) => {
        const words = parseWords(raw);
        if (!words.length) return;
        setPreviewing(true);
        const res = await onPreview(words);
        setPreviewing(false);
        if (res) setPreview(res);
    };

    const confirmAdd = async () => {
        if (!preview?.words.length) return;
        setAdding(true);
        const done = await onAdd(
            preview.words.map(w => w.word),
            preview
        );
        setAdding(false);
        if (done) {
            setPreview(null);
            setDraft('');
        }
    };

    const freshCount = preview?.words.length ?? 0;

    return (
        <RuleSection
            title="Banned keywords"
            count={keywords.length}
            description={
                <>
                    A product whose name or description contains a banned word is not stored. Whole
                    words only, so &quot;acid&quot; does not match &quot;acidity&quot;. A phrase is
                    matched as a phrase.
                </>
            }
            extra={<CountPill>Kept out {hiding} products</CountPill>}
        >
            <div className="flex flex-wrap items-center gap-2">
                <Input
                    size="small"
                    className="!w-full sm:!w-[320px]"
                    placeholder="Add words, comma separated: e.g. syrup, watch strap"
                    value={draft}
                    onChange={e => {
                        setDraft(e.target.value);
                        setPreview(null);
                    }}
                    onPressEnter={() => runPreview(draft)}
                />
                <Button
                    size="small"
                    disabled={!draft.trim()}
                    loading={previewing}
                    onClick={() => runPreview(draft)}
                >
                    Preview matches
                </Button>
                <Button
                    size="small"
                    type="link"
                    className="!px-1 !text-[#344054]"
                    onClick={() => setPasteOpen(true)}
                >
                    Paste a list
                </Button>
            </div>

            {preview && (
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1 text-[12px] text-[#475467]">
                        {preview.words.map(w => (
                            <span key={w.word}>
                                <span className="font-semibold text-[#101828]">{w.word}</span>
                                {w.count
                                    ? ` matches ${plural(w.count, 'product')} already listed${
                                          w.sample.length
                                              ? ` (${w.sample.slice(0, 2).join(', ')}…)`
                                              : ''
                                      }`
                                    : ' matches nothing listed right now'}
                            </span>
                        ))}
                        {!freshCount && <span>Nothing new to add.</span>}
                        {preview.alreadyBanned.length > 0 && (
                            <span className="text-[#98A2B3]">
                                Already banned: {preview.alreadyBanned.join(', ')}.
                            </span>
                        )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Button size="small" disabled={adding} onClick={() => setPreview(null)}>
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            type="primary"
                            disabled={!freshCount}
                            loading={adding}
                            onClick={confirmAdd}
                        >
                            Ban {plural(freshCount, 'word')}
                        </Button>
                    </div>
                </div>
            )}

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        size="small"
                        allowClear
                        className="!w-[180px]"
                        prefix={<SearchOutlined className="text-[#98A2B3]" />}
                        placeholder="Find a word"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <Segmented
                        size="small"
                        value={sort}
                        onChange={v => setSort(v as SortKey)}
                        options={[
                            { label: 'Newest', value: 'newest' },
                            { label: 'A to Z', value: 'az' },
                            { label: 'Hiding most', value: 'hits' },
                        ]}
                    />
                    <Checkbox checked={onlyHiding} onChange={e => setOnlyHiding(e.target.checked)}>
                        <span className="text-[12px] text-[#344054]">
                            Only words hiding products ({hidingWords})
                        </span>
                    </Checkbox>
                </div>
                <ChangeMeta
                    text={changeText(lastChange, 'No words added yet')}
                    onHistory={onHistory}
                />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {visible.map(k => (
                    <KeywordChip key={k.id} keyword={k} onRemove={() => onRemove(k)} />
                ))}
                {!visible.length && (
                    <span className="text-[12px] text-[#98A2B3]">
                        {keywords.length ? 'No words match.' : 'No banned words yet.'}
                    </span>
                )}
            </div>

            <div className="mt-3 text-[11px] text-[#98A2B3]">
                Dark chips kept a product out in the last 24 hours. Hover a chip for who added it
                and when. Removing a word lets matching products in again from the next catalog.
            </div>

            <Modal
                open={pasteOpen}
                title="Paste a list of words"
                okText="Preview matches"
                okButtonProps={{ disabled: !parseWords(pasteText).length, loading: previewing }}
                onOk={async () => {
                    await runPreview(pasteText);
                    setPasteText('');
                    setPasteOpen(false);
                }}
                onCancel={() => setPasteOpen(false)}
            >
                <div className="flex flex-col gap-2 pt-2">
                    <span className="text-[12px] text-[#667085]">
                        One per line or comma separated. Duplicates and words already banned are
                        skipped.
                    </span>
                    <Input.TextArea
                        rows={6}
                        value={pasteText}
                        onChange={e => setPasteText(e.target.value)}
                        placeholder={'syrup\nwatch strap\nlighter'}
                    />
                </div>
            </Modal>
        </RuleSection>
    );
};

export default BannedKeywordsCard;
