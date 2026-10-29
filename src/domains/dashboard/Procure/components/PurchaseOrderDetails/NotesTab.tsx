import React, { useCallback, useEffect, useState } from 'react';

import { FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Input, Spin, Typography } from 'antd';

const { Text } = Typography;
const { TextArea } = Input;

type Props = {
    poId: number;
    fetchNotes: (id: number) => Promise<any[]>;
    addNote: (id: number, note: string) => Promise<any>;
};

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    }).replace(',', ' at');

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Flex
        align="center"
        gap={12}
        style={{ padding: '13px 17px', borderBottom: '0.37px solid #eaeaea' }}
    >
        <Flex
            align="center"
            justify="center"
            style={{ width: 37, height: 37, background: '#fff4f4', borderRadius: 10, flexShrink: 0 }}
        >
            <FileTextOutlined style={{ color: '#FF4F4F', fontSize: 16 }} />
        </Flex>
        <Text style={{ fontWeight: 500, fontSize: 14, color: '#000' }}>{title}</Text>
    </Flex>
);

const NotesTab: React.FC<Props> = ({ poId, fetchNotes, addNote }) => {
    const [notes, setNotes]           = useState<any[]>([]);
    const [noteText, setNoteText]     = useState('');
    const [noteError, setNoteError]   = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [isAdding, setIsAdding]     = useState(false);

    const validateNote = (value: string): string => {
        if (value !== value.trim()) return 'Please remove any extra spaces at the beginning or end of the text';
        if (/ {2}/.test(value)) return 'Please remove consecutive spaces in the text';
        if (value.trim().length < 3) return 'Notes must be at least 3 characters';
        return '';
    };

    const loadNotes = useCallback(async () => {
        setIsFetching(true);
        const data = await fetchNotes(poId);
        setNotes(data);
        setIsFetching(false);
    }, [fetchNotes, poId]);

    useEffect(() => { loadNotes(); }, [loadNotes, poId]);

    const handleAdd = async () => {
        const err = validateNote(noteText);
        if (err) { setNoteError(err); return; }
        setIsAdding(true);
        const result = await addNote(poId, noteText.trim());
        if (result) {
            setNoteText('');
            setNoteError('');
            await loadNotes();
        }
        setIsAdding(false);
    };

    return (
        <Flex vertical gap={20}>
            {/* Add a note */}
            <Card
                style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
            >
                <SectionHeader title="Add a notes" />
                <Flex vertical gap={12} style={{ padding: '16px 20px' }}>
                    <Text style={{ fontSize: 14, color: '#676767' }}>
                        Visible only to your team. Notes are appended chronologically and persist on the PO.
                    </Text>
                    <TextArea
                        rows={4}
                        placeholder="Add context for this PO, operational updates or internal decisions..."
                        value={noteText}
                        status={noteError ? 'error' : undefined}
                        onChange={e => { setNoteText(e.target.value); setNoteError(validateNote(e.target.value)); }}
                        style={{ borderColor: noteError ? undefined : '#cbd5e1', borderRadius: 8, fontSize: 14, color: '#676767', resize: 'none' }}
                    />
                    {noteError && (
                        <Text style={{ fontSize: 12, color: '#ff4d4f' }}>{noteError}</Text>
                    )}
                    <Button
                        type="primary"
                        danger
                        style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8, width: 'fit-content' }}
                        disabled={!noteText.trim()}
                        loading={isAdding}
                        onClick={handleAdd}
                    >
                        Add note
                    </Button>
                </Flex>
            </Card>

            {/* Note history */}
            <Card
                style={{ borderRadius: 22, border: '0.37px solid #eaeaea', overflow: 'hidden' }}
                styles={{ body: { padding: 0 } }}
            >
                <SectionHeader title={`Note History${notes.length > 0 ? ` (${notes.length})` : ''}`} />
                <Flex vertical gap={0} style={{ padding: '16px 20px' }}>
                    {isFetching && <Flex justify="center" style={{ padding: 12 }}><Spin size="small" /></Flex>}
                    {!isFetching && notes.length === 0 && (
                        <Text style={{ fontSize: 14, color: '#676767' }}>No notes yet.</Text>
                    )}
                    {!isFetching && notes.length > 0 && notes.map((note, idx) => (
                        <React.Fragment key={note.id}>
                            {idx > 0 && <div style={{ height: 1, background: '#eaeaea', margin: '12px 0' }} />}
                            <Flex vertical gap={4}>
                                <Text style={{ fontSize: 12, color: '#a9acb4' }}>
                                    {formatDate(note.createdAt)}
                                    {note.author?.contactPersonName ? ` · ${note.author.contactPersonName}` : ''}
                                </Text>
                                <Text style={{ fontSize: 14, color: '#676767', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                    {note.note}
                                </Text>
                            </Flex>
                        </React.Fragment>
                    ))}
                </Flex>
            </Card>
        </Flex>
    );
};

export default NotesTab;
