import axios from 'axios';
import RNFS from 'react-native-fs';
import { REACT_APP_API_URL } from '@env';

export interface Notice {
    id: number;
    title: string;
    content: string;
    is_important: boolean;
    status: 'active' | 'scheduled' | 'expired';
    start_at: string | null;
    end_at: string | null;
    created_at: string;
}

interface ListNoticeParams {
    offset?: number;
    limit?: number;
    status?: 'all' | 'active' | 'scheduled' | 'expired';
    importantOnly?: boolean;
    q?: string;
}

export async function getNotices(params: ListNoticeParams = {}): Promise<Notice[]> {
    const { offset = 0, limit = 50, status = 'all', importantOnly = false, q } = params;
    const res = await axios.get(`${REACT_APP_API_URL}/notices/`, {
        params: {
            offset,
            limit,
            status,
            important_only: importantOnly,
            ...(q ? { q } : {}),
        },
    });
    return res.data;
}

export async function getActiveNotices(importantOnly = false): Promise<Notice[]> {
    return getNotices({ status: 'active', importantOnly, limit: 100 });
}

export function resolveNoticeAssetUrl(url: string): string {
    if (!url) return url;
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    return `${REACT_APP_API_URL}${url}`;
}

const DISMISS_FILE = `${RNFS.DocumentDirectoryPath}/notice_dismissed.json`;

async function readDismissedMap(): Promise<Record<string, string>> {
    try {
        const exists = await RNFS.exists(DISMISS_FILE);
        if (!exists) return {};
        const content = await RNFS.readFile(DISMISS_FILE, 'utf8');
        return JSON.parse(content) || {};
    } catch {
        return {};
    }
}

async function writeDismissedMap(map: Record<string, string>): Promise<void> {
    try {
        await RNFS.writeFile(DISMISS_FILE, JSON.stringify(map), 'utf8');
    } catch (err) {
        console.warn('dismiss map 저장 실패:', err);
    }
}

export async function getDismissedMap(): Promise<Record<string, string>> {
    return readDismissedMap();
}

export async function dismissNoticeForToday(id: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const map = await readDismissedMap();
    map[String(id)] = today;
    await writeDismissedMap(map);
}

export async function isDismissedToday(id: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const map = await readDismissedMap();
    return map[String(id)] === today;
}

export function previewNoticeText(md: string, maxLen = 120): string {
    const stripped = (md || '')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '[이미지]')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*_`>~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return stripped.length > maxLen ? stripped.slice(0, maxLen) + '…' : stripped;
}
