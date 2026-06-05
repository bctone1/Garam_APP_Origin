import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RegisterFormResult {
    businessNumber: string;
    companyName: string;
    phone: string;
    address?: string;
}

interface BusinessRegisterFormProps {
    visible: boolean;
    businessNumber?: string;
    subtitle?: string;
    includeAddress?: boolean;
    companyLabel?: string;
    onSubmit: (result: RegisterFormResult) => void;
    onCancel: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FieldDef {
    key: 'businessNumber' | 'companyName' | 'phone' | 'address';
    label: string;
    required: boolean;
    placeholder: string;
    readOnly?: boolean;
    keyboardType?: 'default' | 'phone-pad' | 'number-pad';
}

export default function BusinessRegisterForm({
    visible,
    businessNumber,
    subtitle,
    includeAddress = false,
    companyLabel = '가맹점명',
    onSubmit,
    onCancel,
}: BusinessRegisterFormProps) {
    // 사업자번호는 고정(자동입력). 카테고리에 따라 주소 필드 포함 여부와 가맹점명/상호명 라벨이 달라진다.
    const fields: FieldDef[] = [
        { key: 'businessNumber', label: '사업자등록번호', required: true, placeholder: '예: 1234567890', readOnly: true },
        { key: 'companyName', label: companyLabel, required: true, placeholder: '예: 가람포스텍' },
        { key: 'phone', label: '전화번호', required: true, placeholder: '예: 01012345678', keyboardType: 'phone-pad' },
        ...(includeAddress
            ? [{ key: 'address' as const, label: '주소', required: true, placeholder: '예: 서울특별시 강남구 ...' }]
            : []),
    ];

    const buildEmptyForm = (): Record<string, string> =>
        fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {} as Record<string, string>);

    const [form, setForm] = useState<Record<string, string>>(buildEmptyForm);

    useEffect(() => {
        if (visible) {
            // 조회/입력한 사업자번호로 고정 (수정 불가)
            setForm({ ...buildEmptyForm(), businessNumber: businessNumber || '' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, businessNumber, includeAddress]);

    if (!visible) return null;

    const handleChange = (field: string) => (value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const isValid = fields
        .filter(f => f.required)
        .every(f => (form[f.key] || '').trim() !== '');

    const handleSubmit = () => {
        if (!isValid) return;
        const result: RegisterFormResult = {
            businessNumber: (form.businessNumber || '').trim(),
            companyName: (form.companyName || '').trim(),
            phone: (form.phone || '').trim(),
        };
        if (includeAddress) {
            result.address = (form.address || '').trim();
        }
        onSubmit(result);
    };

    return (
        <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Icon name="store" size={22} color="#3B82F6" />
                    <Text style={styles.title}>문의자 정보</Text>
                    <Text style={styles.subtitle}>
                        {subtitle || '사업자번호/가맹점명/전화번호 입력해주시면 연락드리겠습니다.'}
                    </Text>
                </View>

                <View style={styles.formArea}>
                    {fields.map(field => (
                        <View style={styles.field} key={field.key}>
                            <Text style={styles.label}>
                                {field.label}
                                {field.required && <Text style={styles.required}> *</Text>}
                            </Text>
                            <TextInput
                                style={[styles.input, field.readOnly && styles.inputReadonly]}
                                value={form[field.key] || ''}
                                onChangeText={handleChange(field.key)}
                                placeholder={field.placeholder}
                                placeholderTextColor="#AAA"
                                editable={!field.readOnly}
                                keyboardType={field.keyboardType || 'default'}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        activeOpacity={0.7}
                        onPress={onCancel}
                    >
                        <Text style={styles.cancelText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, isValid && styles.submitButtonActive]}
                        activeOpacity={0.7}
                        onPress={handleSubmit}
                        disabled={!isValid}
                    >
                        <Text style={styles.submitText}>확인</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 20,
        width: SCREEN_WIDTH - 48,
        maxWidth: 360,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222',
        marginTop: 8,
    },
    subtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 4,
        textAlign: 'center',
    },
    formArea: {
        width: '100%',
    },
    field: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#444',
        marginBottom: 6,
    },
    required: {
        color: '#FF4444',
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        fontSize: 15,
        color: '#222',
        backgroundColor: '#FFF',
    },
    inputReadonly: {
        backgroundColor: '#F2F2F2',
        color: '#888',
    },
    buttons: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 10,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#FFF0F0',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FF4444',
    },
    submitButton: {
        backgroundColor: '#CCCCCC',
    },
    submitButtonActive: {
        backgroundColor: '#3B82F6',
    },
    submitText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
