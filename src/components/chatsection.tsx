import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { REACT_APP_API_URL } from '@env';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import MenuForm from './MenuForm';
import SubMenuForm from './SubMenuForm';


interface Message {
    id: string;
    text: string;
    isUser: boolean;
}

interface Category {
    id: number;
    name: string;
    description: string;
    icon_emoji?: string;
}

interface FAQ {
    id: number;
    question: string;
    answer?: string;
}

export interface ChatSectionRef {
    handleSendMessage: (text: string, isUser?: boolean) => void;
}

const ChatSection = forwardRef<ChatSectionRef>(({ }, ref) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [newSession, setNewSession] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [sectionContent, setSectionContent] = useState<React.ReactNode[]>([]);
    const [inquiryStatus, setInquiryStatus] = useState(true);
    const [topK, setTopK] = useState(5);
    const [knowledgeId, setKnowledgeId] = useState("");

    const getCategory = () => {
        axios.get(`${REACT_APP_API_URL}/system/quick-categories`).then((res) => {
            setCategories(res.data);
            console.log(res.data);
        }).catch((err) => {
            console.log(err);
            Alert.alert('오류', '카테고리 목록을 불러오는 중 오류가 발생했습니다.');
        });
    }

    const createSession = () => {
        axios.post(`${REACT_APP_API_URL}/chat/sessions`, {
            title: "모바일 대화",
            preview: "",
            resolved: false,
            model_id: 1
        }).then((res) => {
            // Alert.alert('Session ID:', String(res.data.id));
            setNewSession(res.data.id);
        }).catch((err) => {

        });
    };

    const getSubmenu = (category: Category) => {
        axios.get(`${REACT_APP_API_URL}/faqs`, {
            params: {
                offset: 0,
                limit: 50,
                quick_category_id: category.id
            },
        }).then((res) => {
            setInquiryStatus(false);
            const faqs: FAQ[] = res.data;
            console.log(faqs);

            setSectionContent(prev => [
                ...prev,
                <SubMenuForm
                    key={`submenu-${category.id}-${Date.now()}`}
                    category={category}
                    faqs={faqs}
                    onSelectFAQ={getAnswer}
                    onBack={getFirstMenu}
                />
            ]);
        }).catch((err) => {
            console.log(err);
            Alert.alert('오류', 'FAQ 목록을 불러오는 중 오류가 발생했습니다.');
        });
    };

    const getAnswer = (category: Category, faq: FAQ) => {
        console.log('Selected FAQ:', { category, faq });
        // Alert.alert('FAQ 선택', `질문: ${faq.question}\n\n 답변: ${faq.answer}`);
        Alert.alert(`${faq.question}`, `${faq.answer}`);
    };

    const getFirstMenu = () => {
        // 첫 메뉴로 돌아가기
        setSectionContent(prev => [
            ...prev,
            <MenuForm
                key={`menu-${Date.now()}`}
                categories={categories}
                onSelectCategory={getSubmenu}
                onInquiry={() => console.log("문의하기")}
                onFAQ={() => console.log("FAQ 보기")}
            />
        ]);
    };


    useEffect(() => {
        createSession();
        getCategory();
    }, []);

    useEffect(() => {
        if (categories.length > 0) {
            getFirstMenu();
        }
    }, [categories]);

    // AI 답변 요청 함수
    const requestAssistantAnswer = React.useCallback(async (question: string) => {
        try {
            const payload = {
                question,
                top_k: Number(topK),
                knowledge_id: knowledgeId ? Number(knowledgeId) : null,
            };
            const response = await fetch(`${REACT_APP_API_URL}/llm/chat/sessions/${newSession}/qa`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            const message = await parseError(response);
            console.log(message);
            return response.json();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }, [topK, knowledgeId, newSession]);

    // 메시지를 sectionContent에 추가하는 함수
    const handleSendMessage = React.useCallback(async (text: string, isUser: boolean = true) => {
        if (!text.trim()) return;
        // const messageId = `message-${Date.now()}-${Math.random()}`;
        const messageComponent = (
            <View
                key={`message-${Date.now()}`}
                style={[
                    styles.messageContainer,
                    isUser ? styles.userMessage : styles.botMessage,
                ]}
            >
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userMessageText : styles.botMessageText,
                ]}>
                    {text}
                </Text>
            </View>
        );
        setSectionContent(prev => [...prev, messageComponent]);

        const start = performance.now();
        const latencyMs = Math.round(performance.now() - start);
        axios.post(`${REACT_APP_API_URL}/chat/sessions/${newSession}/messages`, {
            session_id: newSession,
            role: "user",
            content: text,
            response_latency_ms: latencyMs,
        }).then((res) => {
            console.log(res.data);
        }).catch((err) => {
            console.log(err);
        });


        const data = await requestAssistantAnswer(text);
        const answer = data.answer?.trim?.() ? data.answer.trim() : "응답을 가져올 수 없습니다.";
        const assistantComponent = (
            <View
                key={`message-${Date.now()}`}
                style={[
                    styles.messageContainer, styles.botMessage,
                ]}
            >
                <Text style={[
                    styles.messageText, styles.botMessageText,
                ]}>
                    {answer}
                </Text>
            </View>
        );
        setSectionContent(prev => [...prev, assistantComponent]);
    }, [requestAssistantAnswer, newSession]);

    // ref를 통해 handleSendMessage를 외부에 노출
    useImperativeHandle(ref, () => ({
        handleSendMessage,
    }), [handleSendMessage]);

    // sectionContent가 변경될 때 스크롤을 맨 아래로 이동
    useEffect(() => {
        if (scrollViewRef.current && sectionContent.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [sectionContent]);

    return (
        <ScrollView
            ref={scrollViewRef}
            style={styles.chatSection}
            contentContainerStyle={styles.chatContent}
        >
            {/* <MaskedView maskElement={<Text style={styles.gradientText}>안녕하세요! 가람포스텍 AI 지원센터입니다.</Text>}>
                <LinearGradient
                    colors={['#F3AE2F', '#AD61EF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={[styles.gradientText, { opacity: 0 }]}>dkdkdk</Text>
                </LinearGradient>
            </MaskedView> */}

            <Text style={styles.title}>안녕하세요! 가람포스텍 AI 지원센터입니다.</Text>
            <Text style={styles.desc}>POS 시스템, 키오스크 관련 문의를 선택하세요.</Text>

            {sectionContent.map((content, i) => {
                // ReactElement인 경우 key를 추출, 아니면 인덱스 사용
                const key = React.isValidElement(content) && content.key
                    ? content.key
                    : `content-${i}`;
                return <View key={key}>{content}</View>;
            })}

        </ScrollView>
    );
});

async function parseError(response: Response) {
    const fallback = `${response.status} ${response.statusText}`.trim();
    try {
        const data = await response.clone().json();
        if (typeof data === "string") return data;
        if (data.detail) {
            if (typeof data.detail === "string") return data.detail;
            if (Array.isArray(data.detail)) {
                return data.detail
                    .map((item: any) => item.msg || item.message || (typeof item === "string" ? item : JSON.stringify(item)))
                    .join(", ");
            }
            if (typeof data.detail === "object") {
                return data.detail.message || JSON.stringify(data.detail);
            }
        }
        if (data.message) return data.message;
        return JSON.stringify(data);
    } catch (error) {
        try {
            const text = await response.clone().text();
            return text || fallback;
        } catch {
            return fallback || "요청 처리에 실패했습니다.";
        }
    }
}

const styles = StyleSheet.create({
    chatSection: {
        flex: 1,
        backgroundColor: '#fff',
    },
    chatContent: {
        flexGrow: 1,
        padding: 16,
    },

    gradientText: {
        fontFamily: 'Pretendard',
        fontSize: 32, // 2rem ≒ 32px
        fontStyle: 'normal',
        fontWeight: '600',
        lineHeight: 32, // 'normal'은 보통 fontSize와 동일하게 맞춥니다
    },

    messageContainer: {
        maxWidth: '80%',
        marginBottom: 12,
        padding: 12,
        borderRadius: 12,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#f0f0f0',
    },
    messageText: {
        fontSize: 16,
    },
    userMessageText: {
        color: '#fff',
    },
    botMessageText: {
        color: '#333',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    desc: {
        color: '#666',
        marginBottom: 16,
        fontSize: 14,
    },
});

export default ChatSection;

