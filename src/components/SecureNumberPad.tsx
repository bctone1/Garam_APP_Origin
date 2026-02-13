import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Keyboard,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SecureNumberPadProps {
    visible: boolean;
    onConfirm: (businessNumber: string) => void;
    onCancel: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const KEY_SIZE = Math.min(64, (SCREEN_WIDTH - 80) / 3 - 12);

const shuffleDigits = (): number[] => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const formatBusinessNumber = (raw: string): string => {
    const d = raw.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
};

export default function SecureNumberPad({ visible, onConfirm, onCancel }: SecureNumberPadProps) {
    const [digits, setDigits] = useState('');
    const [shuffledKeys, setShuffledKeys] = useState<number[]>(shuffleDigits());

    useEffect(() => {
        if (visible) {
            Keyboard.dismiss();
            setDigits('');
            setShuffledKeys(shuffleDigits());
        }
    }, [visible]);

    const handleDigitPress = (digit: number) => {
        if (digits.length < 10) {
            setDigits(prev => prev + String(digit));
        }
    };

    const handleBackspace = () => {
        setDigits(prev => prev.slice(0, -1));
    };

    const handleConfirm = () => {
        if (digits.length === 10) {
            onConfirm(digits);
        }
    };

    if (!visible) return null;

    const digitBoxes = [];
    const separatorPositions = [3, 5];
    for (let i = 0; i < 10; i++) {
        if (separatorPositions.includes(i)) {
            digitBoxes.push(
                <Text key={`sep-${i}`} style={styles.separator}>-</Text>
            );
        }
        digitBoxes.push(
            <View
                key={`digit-${i}`}
                style={[
                    styles.digitBox,
                    i < digits.length && styles.digitBoxFilled,
                ]}
            >
                <Text style={styles.digitText}>
                    {i < digits.length ? digits[i] : ''}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.overlay}>
            <View style={styles.padContainer}>
                <View style={styles.padHeader}>
                    <Icon name="lock" size={22} color="#3B82F6" />
                    <Text style={styles.padTitle}>사업자번호 입력</Text>
                    <Text style={styles.padSubtitle}>보안 키패드</Text>
                </View>

                <View style={styles.displayArea}>
                    <View style={styles.digitRow}>
                        {digitBoxes}
                    </View>
                    <Text style={styles.formatHint}>
                        {digits.length > 0 ? formatBusinessNumber(digits) : 'XXX-XX-XXXXX'}
                    </Text>
                </View>

                <View style={styles.keypadGrid}>
                    {shuffledKeys.slice(0, 9).map((digit, index) => (
                        <TouchableOpacity
                            key={`key-${index}`}
                            style={styles.keyButton}
                            activeOpacity={0.6}
                            onPress={() => handleDigitPress(digit)}
                        >
                            <Text style={styles.keyText}>{digit}</Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                        style={[styles.keyButton, styles.cancelKey]}
                        activeOpacity={0.6}
                        onPress={onCancel}
                    >
                        <Text style={styles.cancelKeyText}>취소</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        key="key-last"
                        style={styles.keyButton}
                        activeOpacity={0.6}
                        onPress={() => handleDigitPress(shuffledKeys[9])}
                    >
                        <Text style={styles.keyText}>{shuffledKeys[9]}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.keyButton, styles.backspaceKey]}
                        activeOpacity={0.6}
                        onPress={handleBackspace}
                    >
                        <Icon name="backspace" size={24} color="#555" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        digits.length === 10 && styles.confirmButtonActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={handleConfirm}
                    disabled={digits.length !== 10}
                >
                    <Text style={[
                        styles.confirmText,
                        digits.length === 10 && styles.confirmTextActive,
                    ]}>
                        확인 ({digits.length}/10)
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    padContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 20,
        width: SCREEN_WIDTH - 48,
        maxWidth: 360,
        alignItems: 'center',
    },
    padHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    padTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222',
        marginTop: 8,
    },
    padSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
    },
    displayArea: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    digitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    digitBox: {
        width: 24,
        height: 36,
        borderBottomWidth: 2,
        borderBottomColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 1,
    },
    digitBoxFilled: {
        borderBottomColor: '#3B82F6',
    },
    digitText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    separator: {
        fontSize: 20,
        color: '#999',
        marginHorizontal: 4,
    },
    formatHint: {
        fontSize: 13,
        color: '#AAA',
        marginTop: 8,
    },
    keypadGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        gap: 10,
    },
    keyButton: {
        width: KEY_SIZE,
        height: KEY_SIZE,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
    },
    cancelKey: {
        backgroundColor: '#FFF0F0',
    },
    cancelKeyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF4444',
    },
    backspaceKey: {
        backgroundColor: '#F0F0F0',
    },
    confirmButton: {
        marginTop: 16,
        width: '100%',
        height: 48,
        borderRadius: 12,
        backgroundColor: '#CCCCCC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonActive: {
        backgroundColor: '#3B82F6',
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    confirmTextActive: {
        color: '#fff',
    },
});
