import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';

import { DocBlock, parseDoc } from './parseDoc';

const s = StyleSheet.create({
    page: {
        paddingVertical: 40,
        paddingHorizontal: 48,
        fontSize: 10,
        fontFamily: 'Times-Roman',
        color: '#1f2937',
        lineHeight: 1.5,
    },
    title: {
        fontSize: 15,
        fontFamily: 'Times-Bold',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subtitle: { fontSize: 12, fontFamily: 'Times-Bold', textAlign: 'center', marginTop: 2 },
    meta: { fontSize: 9, color: '#6b7280', textAlign: 'center', marginTop: 2 },
    draft: {
        fontSize: 9,
        color: '#92400e',
        backgroundColor: '#fffbeb',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderStyle: 'solid',
        padding: 8,
        marginVertical: 12,
        borderRadius: 4,
    },
    heading: {
        fontSize: 11,
        fontFamily: 'Times-Bold',
        marginTop: 14,
        marginBottom: 4,
        borderBottomColor: '#e5e7eb',
        borderBottomWidth: 1,
        borderStyle: 'solid',
        paddingBottom: 2,
    },
    para: { marginBottom: 6, textAlign: 'justify' },
    note: { fontSize: 9, color: '#6b7280', marginBottom: 6 },
    listItem: { flexDirection: 'row', marginBottom: 3 },
    listNum: { width: 18 },
    listText: { flex: 1, textAlign: 'justify' },
});

const TEXT_STYLE = {
    title: s.title,
    subtitle: s.subtitle,
    meta: s.meta,
    note: s.note,
    draft: s.draft,
    heading: s.heading,
    para: s.para,
} as const;

function Blocks({ blocks }: { blocks: DocBlock[] }) {
    return (
        <>
            {blocks.map((block, i) => {
                if (block.type === 'list') {
                    return (
                        <View key={i}>
                            {block.items.map((item, j) => (
                                <View key={j} style={s.listItem}>
                                    <Text style={s.listNum}>{j + 1}.</Text>
                                    <Text style={s.listText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    );
                }

                return (
                    <Text key={i} style={TEXT_STYLE[block.type]}>
                        {block.text}
                    </Text>
                );
            })}
        </>
    );
}

function DocumentPdf({ blocks }: { blocks: DocBlock[] }) {
    return (
        <Document>
            <Page wrap size="A4" style={s.page}>
                <Blocks blocks={blocks} />
            </Page>
        </Document>
    );
}

export const toPdfFile = async (bodyHtml: string, fileName: string): Promise<File> => {
    const blob = await pdf(<DocumentPdf blocks={parseDoc(bodyHtml)} />).toBlob();

    return new File([blob], fileName, { type: 'application/pdf' });
};
