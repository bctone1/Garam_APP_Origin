import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    useWindowDimensions,
} from 'react-native';
import { Notice, resolveNoticeAssetUrl } from '../utill/notice_storage';

interface NoticePopupProps {
    notice: Notice;
    onDismissToday?: (id: number) => void;
    onClose: (id: number) => void;
}

export default function NoticePopup({ notice, onDismissToday, onClose }: NoticePopupProps) {
    const showDismiss = typeof onDismissToday === 'function';
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {notice.title}
                </Text>
            </View>

            <ScrollView style={styles.cardBody} contentContainerStyle={styles.cardBodyContent}>
                <NoticeMarkdown content={notice.content} />
            </ScrollView>

            <View style={[styles.cardFooter, !showDismiss && styles.cardFooterAlone]}>
                {showDismiss && (
                    <TouchableOpacity
                        style={styles.footerBtn}
                        onPress={() => onDismissToday!(notice.id)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.footerDismissText}>오늘 하루 보지 않기</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.footerBtn}
                    onPress={() => onClose(notice.id)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.footerCloseText}>닫기 ×</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

type Block =
    | { type: 'text'; value: string }
    | { type: 'heading'; level: number; value: string }
    | { type: 'list'; ordered: boolean; index: number; value: string }
    | { type: 'image'; value: string }
    | { type: 'space' };

export function NoticeMarkdown({ content }: { content: string }) {
    const blocks = parseMarkdown(content || '');
    return (
        <View>
            {blocks.map((block, i) => {
                if (block.type === 'image') {
                    return <MarkdownImage key={`img-${i}`} url={block.value} />;
                }
                if (block.type === 'heading') {
                    const fontSize = block.level === 1 ? 18 : block.level === 2 ? 16 : 15;
                    return (
                        <Text key={`h-${i}`} style={[mdStyles.heading, { fontSize }]}>
                            {block.value}
                        </Text>
                    );
                }
                if (block.type === 'list') {
                    return (
                        <View key={`l-${i}`} style={mdStyles.listRow}>
                            <Text style={mdStyles.listMarker}>
                                {block.ordered ? `${block.index}.` : '•'}
                            </Text>
                            <Text style={mdStyles.listText}>{block.value}</Text>
                        </View>
                    );
                }
                if (block.type === 'space') {
                    return <View key={`s-${i}`} style={{ height: 8 }} />;
                }
                return (
                    <Text key={`t-${i}`} style={mdStyles.paragraph}>
                        {block.value}
                    </Text>
                );
            })}
        </View>
    );
}

function MarkdownImage({ url }: { url: string }) {
    const [ratio, setRatio] = useState(0.6);
    const [errored, setErrored] = useState(false);
    const { width: screenWidth } = useWindowDimensions();
    const maxImageWidth = Math.min(screenWidth - 80, 320);
    const fullUrl = resolveNoticeAssetUrl(url);

    useEffect(() => {
        let cancelled = false;
        Image.getSize(
            fullUrl,
            (w, h) => {
                if (cancelled || !w || !h) return;
                setRatio(h / w);
            },
            (err) => {
                if (cancelled) return;
                console.warn('[NoticeMarkdown] Image.getSize 실패:', fullUrl, err);
            },
        );
        return () => {
            cancelled = true;
        };
    }, [fullUrl]);

    if (errored) {
        return (
            <View style={[mdStyles.image, mdStyles.imageError, { width: maxImageWidth, height: 80 }]}>
                <Text style={mdStyles.imageErrorText}>이미지를 불러올 수 없습니다</Text>
            </View>
        );
    }

    const displayHeight = Math.max(80, Math.min(ratio * maxImageWidth, 360));

    return (
        <Image
            source={{ uri: fullUrl }}
            style={[mdStyles.image, { width: maxImageWidth, height: displayHeight }]}
            resizeMode="contain"
            onError={(e) => {
                console.warn('[NoticeMarkdown] Image 로드 실패:', fullUrl, e.nativeEvent?.error);
                setErrored(true);
            }}
        />
    );
}

function parseMarkdown(md: string): Block[] {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const blocks: Block[] = [];
    let olRunning = false;
    let olIndex = 0;
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
            blocks.push({ type: 'space' });
            olRunning = false;
            olIndex = 0;
            continue;
        }
        const imgOnly = line.match(/^!\[[^\]]*\]\(([^)]+)\)\s*$/);
        if (imgOnly) {
            blocks.push({ type: 'image', value: imgOnly[1] });
            olRunning = false;
            olIndex = 0;
            continue;
        }
        const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (hMatch) {
            blocks.push({ type: 'heading', level: hMatch[1].length, value: stripInline(hMatch[2]) });
            olRunning = false;
            olIndex = 0;
            continue;
        }
        const olMatch = line.match(/^\d+\.\s+(.+)$/);
        if (olMatch) {
            if (!olRunning) {
                olRunning = true;
                olIndex = 0;
            }
            olIndex += 1;
            blocks.push({ type: 'list', ordered: true, index: olIndex, value: stripInline(olMatch[1]) });
            continue;
        }
        const ulMatch = line.match(/^[-*]\s+(.+)$/);
        if (ulMatch) {
            blocks.push({ type: 'list', ordered: false, index: 0, value: stripInline(ulMatch[1]) });
            olRunning = false;
            olIndex = 0;
            continue;
        }
        // inline image (텍스트 + 이미지가 한 줄)
        const inlineImg = line.match(/^(.*?)!\[[^\]]*\]\(([^)]+)\)\s*(.*)$/);
        if (inlineImg) {
            const before = inlineImg[1].trim();
            const url = inlineImg[2];
            const after = inlineImg[3].trim();
            if (before) blocks.push({ type: 'text', value: stripInline(before) });
            blocks.push({ type: 'image', value: url });
            if (after) blocks.push({ type: 'text', value: stripInline(after) });
            olRunning = false;
            olIndex = 0;
            continue;
        }
        blocks.push({ type: 'text', value: stripInline(line) });
        olRunning = false;
        olIndex = 0;
    }
    return blocks;
}

function stripInline(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4,
        marginHorizontal: 16,
        marginVertical: 8,
        maxHeight: '85%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 6,
    },
    cardHeader: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        lineHeight: 21,
    },
    cardBody: {
        backgroundColor: '#fff',
    },
    cardBodyContent: {
        paddingHorizontal: 22,
        paddingVertical: 20,
    },
    cardFooter: {
        backgroundColor: '#2d2d2d',
        paddingHorizontal: 14,
        paddingVertical: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardFooterAlone: {
        justifyContent: 'flex-end',
    },
    footerBtn: {
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    footerDismissText: {
        color: '#e5e7eb',
        fontSize: 13,
    },
    footerCloseText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});

const mdStyles = StyleSheet.create({
    paragraph: {
        color: '#374151',
        fontSize: 14,
        lineHeight: 23,
        marginVertical: 4,
    },
    heading: {
        fontWeight: '700',
        color: '#111827',
        marginTop: 14,
        marginBottom: 8,
        lineHeight: 22,
    },
    listRow: {
        flexDirection: 'row',
        marginVertical: 2,
        paddingRight: 4,
    },
    listMarker: {
        minWidth: 22,
        color: '#374151',
        fontSize: 14,
        lineHeight: 23,
    },
    listText: {
        flex: 1,
        color: '#374151',
        fontSize: 14,
        lineHeight: 23,
    },
    image: {
        marginVertical: 8,
        borderRadius: 4,
        backgroundColor: '#f3f4f6',
        alignSelf: 'flex-start',
    },
    imageError: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    imageErrorText: {
        color: '#9ca3af',
        fontSize: 12,
    },
});
