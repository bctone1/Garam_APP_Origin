import { Platform, PermissionsAndroid } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import axios from 'axios';
import { REACT_APP_API_URL } from '@env';
import { Notice } from './notice_storage';

type DeepLinkHandler = (notice: Notice) => void;
type ToastHandler = (params: { title: string; body: string; onPress?: () => void }) => void;

let deepLinkHandler: DeepLinkHandler | null = null;
let toastHandler: ToastHandler | null = null;

export function setPushDeepLinkHandler(handler: DeepLinkHandler | null) {
    deepLinkHandler = handler;
}

export function setPushToastHandler(handler: ToastHandler | null) {
    toastHandler = handler;
}

async function requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
        try {
            const granted = await PermissionsAndroid.request(
                'android.permission.POST_NOTIFICATIONS' as any,
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('[FCM] 알림 권한 요청 실패:', err);
            return false;
        }
    }
    return true;
}

async function sendTokenToServer(token: string) {
    try {
        await axios.post(`${REACT_APP_API_URL}/devices/register`, {
            token,
            platform: 'android',
        });
        console.log('[FCM] 토큰 등록 완료');
    } catch (err: any) {
        console.error('[FCM] 토큰 등록 실패:', err?.message || err);
    }
}

async function fetchNotice(noticeId: string | number): Promise<Notice | null> {
    try {
        const res = await axios.get(`${REACT_APP_API_URL}/notices/${noticeId}`);
        return res.data as Notice;
    } catch (err) {
        console.error('[FCM] 공지 fetch 실패:', err);
        return null;
    }
}

async function handleDeepLink(remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) {
    if (!remoteMessage) return;
    const noticeId = remoteMessage.data?.notice_id;
    if (!noticeId) return;
    const notice = await fetchNotice(noticeId as string);
    if (notice) {
        if (deepLinkHandler) {
            deepLinkHandler(notice);
        } else {
            // 핸들러가 아직 등록 전 — 짧게 대기 후 한 번 더 시도
            setTimeout(() => {
                deepLinkHandler?.(notice);
            }, 800);
        }
    }
}

let initialized = false;

export async function initPush() {
    if (initialized) return;
    initialized = true;

    const granted = await requestPermission();
    if (!granted) {
        console.log('[FCM] 알림 권한 거부 — 푸시 미수신');
        return;
    }

    try {
        const token = await messaging().getToken();
        console.log('[FCM] 토큰:', token.slice(0, 30), '...');
        await sendTokenToServer(token);
    } catch (err) {
        console.error('[FCM] 토큰 발급 실패:', err);
    }

    messaging().onTokenRefresh(async (newToken) => {
        console.log('[FCM] 토큰 갱신');
        await sendTokenToServer(newToken);
    });

    messaging().onMessage(async (remoteMessage) => {
        console.log('[FCM] 포그라운드 메시지:', remoteMessage.notification?.title);
        toastHandler?.({
            title: remoteMessage.notification?.title || '알림',
            body: remoteMessage.notification?.body || '',
            onPress: () => handleDeepLink(remoteMessage),
        });
    });

    messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[FCM] 백그라운드 탭:', remoteMessage.notification?.title);
        handleDeepLink(remoteMessage);
    });

    const initial = await messaging().getInitialNotification();
    if (initial) {
        console.log('[FCM] 콜드 스타트 탭:', initial.notification?.title);
        handleDeepLink(initial);
    }
}
