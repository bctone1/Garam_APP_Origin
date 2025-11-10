import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { REACT_APP_API_URL } from '@env';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import MenuForm from './MenuForm';
import SubMenuForm from './SubMenuForm';
import Icon from 'react-native-vector-icons/MaterialIcons';


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
    const [inquiryStatus, setInquiryStatus] = useState(false);
    const [inquiryStep, setInquiryStep] = useState(0);
    const [topK, setTopK] = useState(5);
    const [knowledgeId, setKnowledgeId] = useState("");
    const [inquiryInfo, setInquiryInfo] = useState({
        name: "",
        email: "",
        group: "",
        phone: "",
        detail: "",
    });

    const createInquiry = (email: string) => {
        axios.post(`${REACT_APP_API_URL}/inquiries/`, {
            customer_name: inquiryInfo.name,
            email: email,
            company: inquiryInfo.group,
            phone: inquiryInfo.phone,
            content: inquiryInfo.detail,
            status: "new",
            assignee_admin_id: 0,
        }).then((res) => {
            console.log(res.data);
        });
    }


    const getCategory = () => {
        axios.get(`${REACT_APP_API_URL}/system/quick-categories`).then((res) => {
            setCategories(res.data);
        }).catch((err) => {
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
            const faqs: FAQ[] = res.data;
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

    const getAnswer = (faq: FAQ) => {
        Alert.alert(`${faq.question}`, `${faq.answer}`);
    };

    const onInquiry = () => {
        setInquiryStatus(true);
        setInquiryStep(0);
        setSectionContent(prev => [...prev,
        <View style={styles.inquiryForm} key={`message-${Date.now()}`}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.stepContainer}>
                    <Text style={styles.stepNumber}>1</Text>
                    <Text style={styles.stepText}>/5 단계</Text>
                </View>

                <View style={styles.headerTextContainer}>
                    <Text style={styles.inquirytitle}>문의 정보 수집</Text>
                    <Text style={styles.question}>성함을 알려주세요</Text>
                </View>
            </View>

            {/* Message Section */}
            <View style={styles.messageSection}>
                <Text style={styles.subTitle}>문의하기 시작</Text>

                <Text style={styles.assistantText}>
                    안녕하세요! 문의사항을 접수해드리겠습니다.{"\n"}
                    빠른 처리를 위해 몇 가지 정보를 수집하겠습니다.
                </Text>

                <Text style={styles.assistantBold}>첫 번째로, 성함을 알려주세요.</Text>
                <Text style={styles.assistantText}>(예: 홍길동)</Text>
            </View>
        </View>,
        <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                <Icon name="home" size={20} color="#333" />
                <Text style={styles.homeText}>처음으로</Text>
            </TouchableOpacity>
        </View>
        ]);
        // setInquiryStep(1);
    }

    const getFirstMenu = () => {
        setInquiryStatus(false);
        setInquiryStep(0);
        setInquiryInfo({
            name: "",
            email: "",
            group: "",
            phone: "",
            detail: "",
        });
        // 첫 메뉴로 돌아가기
        setSectionContent(prev => [
            ...prev,
            <MenuForm
                key={`menu-${Date.now()}`}
                categories={categories}
                onSelectCategory={getSubmenu}
                onInquiry={onInquiry}
                onFAQ={loadFAQList}
            />
        ]);
    };
    const loadFAQList = () => {
        setInquiryStatus(false);
        setInquiryStep(0);
        setInquiryInfo({
            name: "",
            email: "",
            group: "",
            phone: "",
            detail: "",
        });
        
        axios.get(`${process.env.REACT_APP_API_URL}/faqs`, {
            params: {
                offset: 0,
                limit: 3,
                order_by: "views"
            },
        }).then((res) => {
            const faqs: FAQ[] = res.data;
            console.log(faqs);
            setSectionContent(prev => [
                ...prev,
                <SubMenuForm
                    key={`submenu-${Date.now()}`}
                    category={{ id: 0, name: "자주하는 질문", description: "자주하는 질문" }}
                    faqs={faqs}
                    onSelectFAQ={getAnswer}
                    onBack={getFirstMenu}
                />
            ]);
        }).catch((err) => {
            console.log(err);
        });
    }


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


    const handleSendMessage = React.useCallback(async (text: string, isUser: boolean = true) => {
        if (!text.trim()) return;
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

        if (inquiryStatus === true) {
            if (inquiryStep === 0) {
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    name: text
                }));

                setSectionContent(prev => [...prev,
                <View style={styles.inquiryForm} key={`message-${Date.now()}`}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepNumber}>2</Text>
                            <Text style={styles.stepText}>/5 단계</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>회사 정보 수집</Text>
                            <Text style={styles.question}>회사명을 알려주세요.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.subTitle}>{text}님, 안녕하세요!</Text>

                        <Text style={styles.assistantText}>
                            두 번째로, 거래처(회사명)을 알려주세요.{"\n"}
                            개인 문의인 경우 "개인"이라고 입력해주세요.{"\n"}
                            (예: 가람포스텍, 개인)
                        </Text>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>처음으로</Text>
                    </TouchableOpacity>
                </View>
                ]);
                setInquiryStep(1);
            } else if (inquiryStep === 1) {
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    group: text
                }));

                setSectionContent(prev => [...prev,
                <View style={styles.inquiryForm} key={`message-${Date.now()}`}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepNumber}>3</Text>
                            <Text style={styles.stepText}>/5 단계</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>연락처</Text>
                            <Text style={styles.question}>연락처를 기입해주세요.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            세 번째로, 연락처를 기입해주세요.{"\n"}
                            빠른 처리를 위해 필요합니다.{"\n"}
                            (예: 010-1234-5678)
                        </Text>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>처음으로</Text>
                    </TouchableOpacity>
                </View>
                ]);
                setInquiryStep(2);
            } else if (inquiryStep === 2) {
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    phone: text
                }));

                setSectionContent(prev => [...prev,
                <View style={styles.inquiryForm} key={`message-${Date.now()}`}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepNumber}>4</Text>
                            <Text style={styles.stepText}>/5 단계</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>문의 내용</Text>
                            <Text style={styles.question}>문의내용을 입력해주세요.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            구체적인 문의 내용을 알려주세요.{"\n"}
                            자세히 설명해주실수록 더 정확한 지원이 가능합니다.{"\n"}
                            (예: 카드리더기 오류로 결제가 안됩니다, POS 용지 부족으로 용지 요청드립니다)
                        </Text>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>처음으로</Text>
                    </TouchableOpacity>
                </View>
                ]);

                setInquiryStep(3);
            } else if (inquiryStep === 3) {
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    detail: text
                }));

                setSectionContent(prev => [...prev,
                <View style={styles.inquiryForm} key={`message-${Date.now()}`}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepNumber}>5</Text>
                            <Text style={styles.stepText}>/5 단계</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>이메일</Text>
                            <Text style={styles.question}>이메일을 입력해주세요.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            이메일을 입력해주세요.{"\n"}
                            (예: bct@bctone.kr)
                        </Text>
                    </View>
                </View>,

                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>처음으로</Text>
                    </TouchableOpacity>
                </View>
                ]);
                setInquiryStep(4);
            } else if (inquiryStep === 4) {
                createInquiry(text);
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    email: text
                }));
                setSectionContent(prev => [...prev,
                <View key={`message-${Date.now()}`} style={[styles.messageContainer, styles.botMessage,]}>
                    <Text style={styles.inquirytitle}>📝문의가 접수되었습니다.</Text>
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            접수 정보 :{"\n"}
                            • 작성자: {inquiryInfo.name}{"\n"}
                            • 거래처: {inquiryInfo.group}{"\n"}
                            • 연락처: {inquiryInfo.phone}{"\n"}
                            • 이메일: {text}{"\n"}
                            • 문의 내용: {inquiryInfo.detail}{"\n"}
                            {"\n"}
                            귀하의 문의사항이 정상적으로 접수되었습니다.{"\n"}
                            담당자가 확인 후 영업일 기준 1-2일 내에 연락드리겠습니다.{"\n"}
                            {"\n"}
                            긴급한 사항인 경우 1588-1234로 직접 연락주시기 바랍니다.{"\n"}
                            {"\n"}
                            감사합니다! 🙏
                        </Text>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={10} color="#333" />
                        <Text style={styles.homeText}>처음으로</Text>
                    </TouchableOpacity>
                </View>
                ]);
                setInquiryStep(0);
                setInquiryStatus(false);
            }
        } else {
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
                <View key={`message-${Date.now()}`} style={[styles.messageContainer, styles.botMessage,]}>
                    <Text style={[
                        styles.messageText, styles.botMessageText,
                    ]}>
                        {answer}
                    </Text>
                </View>
            );
            setSectionContent(prev => [...prev, assistantComponent]);
        }
    }, [requestAssistantAnswer, newSession, inquiryStatus, inquiryStep, inquiryInfo]);

    useImperativeHandle(ref, () => ({
        handleSendMessage,
    }), [handleSendMessage]);

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
    inquiryForm: {
        backgroundColor: "#fff",
        // padding: 6,
        borderRadius: 12,
        marginVertical: 8,
        // elevation: 2, // shadow for Android
        // shadowColor: "#000", // shadow for iOS
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.2,
        // shadowRadius: 2,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },
    stepContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F5FF",
        padding: 8,
        borderRadius: 15,
    },
    stepNumber: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#3B82F6"
    },
    stepText: {
        fontSize: 14,
        marginLeft: 4,
        color: "#3B82F6"
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    inquirytitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
    },
    question: {
        fontSize: 14,
        color: "#444",
        marginTop: 4,
    },
    messageSection: {
        marginTop: 16,
    },
    subTitle: {
        fontSize: 15,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#000",

    },
    assistantText: {
        fontSize: 14,
        color: "#555",
        marginBottom: 8,
        lineHeight: 20,
    },
    assistantBold: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000",
        marginBottom: 4,
    },
    bottomNav: {
        alignItems: "flex-start",
        marginBottom: 10,
    },
    homeButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f2f2f2",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    homeText: {
        marginLeft: 6,
        fontSize: 14,
        color: "#333",
    },
});

export default ChatSection;

