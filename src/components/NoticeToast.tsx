import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';

export interface ToastData {
    id: number;
    title: string;
    body: string;
    onPress?: () => void;
}

interface NoticeToastProps {
    toast: ToastData | null;
    onDismiss: () => void;
}

const TOAST_DURATION = 4000;

export default function NoticeToast({ toast, onDismiss }: NoticeToastProps) {
    const translateY = useRef(new Animated.Value(-160)).current;
    const dismissedRef = useRef(false);

    useEffect(() => {
        if (!toast) return;
        dismissedRef.current = false;
        translateY.setValue(-160);

        Animated.timing(translateY, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
            if (!dismissedRef.current) close();
        }, TOAST_DURATION);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast?.id]);

    const close = () => {
        if (dismissedRef.current) return;
        dismissedRef.current = true;
        Animated.timing(translateY, {
            toValue: -160,
            duration: 220,
            useNativeDriver: true,
        }).start(() => onDismiss());
    };

    if (!toast) return null;

    const handlePress = () => {
        toast.onPress?.();
        close();
    };

    return (
        <Animated.View
            style={[styles.container, { transform: [{ translateY }] }]}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePress}
                onLongPress={close}
                style={styles.toast}
            >
                <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
                {!!toast.body && (
                    <Text style={styles.body} numberOfLines={2}>{toast.body}</Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 50,
        left: 12,
        right: 12,
        zIndex: 999,
    },
    toast: {
        backgroundColor: '#111827',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    body: {
        color: '#e5e7eb',
        fontSize: 13,
        lineHeight: 18,
    },
});
