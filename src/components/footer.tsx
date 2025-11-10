import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface FooterProps {
    onSend?: (message: string) => void;
    onSTT?: (isActive: boolean) => void;
}

export default function Footer({ onSend, onSTT }: FooterProps) {
    const [messageInput, setMessageInput] = useState<string>('');
    const [plusmenu, setPlusmenu] = useState<boolean>(false);
    const [micStatus, setMicStatus] = useState<boolean>(false);

    const handleSend = () => {
        if (messageInput.trim()) {
            onSend?.(messageInput);
            setMessageInput('');
        }
    };

    const handleSTT = () => {
        setMicStatus((prev) => !prev);
        onSTT?.(micStatus);
    };

    return (
        <View style={styles.footer}>
            <View style={styles.inputBox}>
                <TextInput
                    style={styles.inputMessage}
                    placeholder="메시지를 입력하세요..."
                    placeholderTextColor="#999"
                    value={messageInput}
                    onChangeText={setMessageInput}
                    multiline
                    onSubmitEditing={handleSend}
                />
                <View style={styles.inputTools}>
                    <View style={styles.inputToolsLeft}>
                        {plusmenu && (
                            <View style={styles.plusMenu}>
                                <View style={styles.menuSection}>
                                    <TouchableOpacity style={styles.menuItem}>
                                        <View style={styles.menuItemIcon}>
                                            <Icon name="attach-file" size={20} color="#333" />
                                        </View>
                                        <View style={styles.menuItemText}>
                                            <Text style={styles.menuItemTitle}>사진 및 파일 첨부</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.inputToolsRight}>
                        {/* <TouchableOpacity
                            style={[
                                styles.inputButton,
                                styles.micButton,
                                micStatus && styles.inputButtonActive,
                            ]}
                            onPress={handleSTT}
                        >
                            <Icon
                                name="mic"
                                size={20}
                                color={micStatus ? '#fff' : '#333'}
                            />
                        </TouchableOpacity> */}
                        <TouchableOpacity
                            style={[styles.inputButton, styles.sendButton]}
                            onPress={handleSend}
                        >
                            <Icon name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    footer: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    inputBox: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor:'#3b82f6',
        // React Native에서는 boxShadow 대신 shadowColor, shadowOffset 등을 사용
        // boxShadow: '0 4px 12px 2px rgba(0, 0, 0, 0.1)',
    },
    inputMessage: {
        minHeight: 40,
        maxHeight: 100,
        fontSize: 16,
        color: '#333',
        paddingVertical: 8,
    },
    inputTools: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    inputToolsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputToolsRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    inputButtonActive: {
        backgroundColor: '#007AFF',
    },
    micButton: {
        // 마이크 버튼 스타일
    },
    sendButton: {
        backgroundColor: '#007AFF',
    },
    plusMenu: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 200,
    },
    menuSection: {
        // 메뉴 섹션 스타일
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    menuItemIcon: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 14,
        color: '#333',
    },
});

