import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, TouchableOpacity, Platform, PermissionsAndroid } from 'react-native';
import axios from 'axios';
import { REACT_APP_API_URL } from '@env';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import MenuForm from './MenuForm';
import SubMenuForm from './SubMenuForm';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from "react-native-fs";

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
    startSTT: () => void;
    stopSTT: () => void;
}

const ChatSection = forwardRef<ChatSectionRef>(({ }, ref) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [newSession, setNewSession] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [systemSettings, setsystemSettings] = useState<any>({
        welcome_title: "",
        welcome_message: "",
        emergency_phone: "",
        emergency_email: "",
        operating_hours: "",
        file_upload_mode: "",
        session_duration: "",
        max_messages: ""
    });
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
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const hasRunRef = useRef(false);
    const audioRecorderPlayer = useRef<any>(null);
    const recordingPathRef = useRef<string | null>(null);
    const silenceTimer = useRef<NodeJS.Timeout | null>(null);
    const recordBackListener = useRef<any>(null);

    const SILENCE_THRESHOLD = 0.01;
    const SILENCE_TIMEOUT = 2000;

    useEffect(() => {
        if (hasRunRef.current) return;
        if (timerRef.current) { clearTimeout(timerRef.current); }
        timerRef.current = setTimeout(() => {
            setSectionContent(prev => [
                ...prev,
                <View style={styles.feedbackForm} key={`inquiry-${Date.now()}`}>
                    <Text style={styles.titleText}>Wait a moment!</Text>
                    <Text style={styles.feedbackText}>
                        Was today's consultation helpful?{"\n"}
                        Please share your valuable feedback.
                    </Text>

                    <View style={styles.feedbackButtonContainer}>
                        <TouchableOpacity
                            style={[styles.feedbackButton, styles.reviewButton]}
                            onPress={() => handleReview("helpful")}
                        >
                            <Text style={styles.buttonText}>👍 Yes, it was helpful</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.feedbackButton, styles.reviewButton]}
                            onPress={() => handleReview("not_helpful")}
                        >
                            <Text style={styles.buttonText}>👎 No, needs improvement</Text>
                        </TouchableOpacity>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>Home</Text>
                    </TouchableOpacity>
                </View>
            ]);
            hasRunRef.current = true;
        }, 5000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [sectionContent]);


    const handleReview = (result: string) => {
        axios.post(`${REACT_APP_API_URL}/chat/feedback`, {
            rating: result,
            session_id: newSession
        }).then((res) => {
            console.log(res.data);
            setSectionContent(prev => [
                ...prev,
                <View style={styles.feedbackForm} key={`inquiry-${Date.now()}`}>
                    <Text style={styles.titleText}>Thank you!</Text>
                    <Text style={styles.feedbackText}>
                        Your valuable feedback has been recorded!
                    </Text>

                    <View style={styles.feedbackButtonContainer}>
                        <TouchableOpacity style={[styles.feedbackButton, styles.reviewButton]}>
                            <Text style={styles.buttonText}>Main Number{"\n"}1588-1234</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.feedbackButton, styles.reviewButton]}>
                            <Text style={styles.buttonText}>Technical Support Email{"\n"}tech@garampos.com</Text>
                        </TouchableOpacity>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>Home</Text>
                    </TouchableOpacity>
                </View>
            ]);
        }).catch((err) => {
            console.error(err);
        });
    }

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

    const getSystemSettings = () => {
        axios.get(`${REACT_APP_API_URL}/system/setting`).then((res) => {
            setsystemSettings(res.data);
        }).catch((err) => {
            console.error(err);
        });
    }

    const getCategory = () => {
        axios.get(`${REACT_APP_API_URL}/system/quick-categories`).then((res) => {
            setCategories(res.data);
        }).catch((err) => {
            console.error('API error details:', err);
            Alert.alert('Error', 'An error occurred while loading the category list.');
        });
    }

    const createSession = () => {
        axios.post(`${REACT_APP_API_URL}/chat/sessions`, {
            title: "Mobile Chat",
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
        setInquiryStep(0);
        setInquiryStatus(false);
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
            Alert.alert('Error', 'An error occurred while loading the FAQ list.');
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
                    <Text style={styles.stepText}>/5 Step</Text>
                </View>

                <View style={styles.headerTextContainer}>
                    <Text style={styles.inquirytitle}>Inquiry Information Collection</Text>
                    <Text style={styles.question}>Please provide your name</Text>
                </View>
            </View>

            {/* Message Section */}
            <View style={styles.messageSection}>
                <Text style={styles.subTitle}>Start Inquiry</Text>

                <Text style={styles.assistantText}>
                    Hello! We will process your inquiry.{"\n"}
                    We will collect some information for quick processing.
                </Text>

                <Text style={styles.assistantBold}>First, please provide your name.</Text>
                <Text style={styles.assistantText}>(e.g., John Doe)</Text>
            </View>
        </View>,
        <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                <Icon name="home" size={20} color="#333" />
                <Text style={styles.homeText}>Home</Text>
            </TouchableOpacity>
        </View>
        ]);
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
        // Return to first menu
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

        axios.get(`${REACT_APP_API_URL}/faqs`, {
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
                    category={{ id: 0, name: "FAQ", description: "Frequently Asked Questions" }}
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
        getSystemSettings();
    }, []);

    useEffect(() => {
        if (categories.length > 0) {
            getFirstMenu();
        }
    }, [categories]);

    // AI answer request function
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
                            <Text style={styles.stepText}>/5 Step</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>Company Information Collection</Text>
                            <Text style={styles.question}>Please provide your company name.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.subTitle}>Hello, {text}!</Text>

                        <Text style={styles.assistantText}>
                            Second, please provide your company name.{"\n"}
                            For personal inquiries, please enter "Personal".{"\n"}
                            (e.g., Garam POS Tech, Personal)
                        </Text>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>Home</Text>
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
                            <Text style={styles.stepText}>/5 Step</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>Contact</Text>
                            <Text style={styles.question}>Please enter your contact information.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            Third, please enter your contact information.{"\n"}
                            This is required for quick processing.{"\n"}
                            (e.g., 010-1234-5678)
                        </Text>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>Home</Text>
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
                            <Text style={styles.stepText}>/5 Step</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>Inquiry Details</Text>
                            <Text style={styles.question}>Please enter your inquiry details.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            Please provide specific inquiry details.{"\n"}
                            The more detailed your description, the more accurate support we can provide.{"\n"}
                            (e.g., Card reader error preventing payment, POS paper shortage - paper request)
                        </Text>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>Home</Text>
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
                            <Text style={styles.stepText}>/5 Step</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>Email</Text>
                            <Text style={styles.question}>Please enter your email.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            Please enter your email.{"\n"}
                            (e.g., bct@bctone.kr)
                        </Text>
                    </View>
                </View>,

                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>Home</Text>
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
                    <Text style={styles.inquirytitle}>📝 Inquiry has been submitted.</Text>
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            Submission Information:{"\n"}
                            • Name: {inquiryInfo.name}{"\n"}
                            • Company: {inquiryInfo.group}{"\n"}
                            • Contact: {inquiryInfo.phone}{"\n"}
                            • Email: {text}{"\n"}
                            • Inquiry Details: {inquiryInfo.detail}{"\n"}
                            {"\n"}
                            Your inquiry has been successfully submitted.{"\n"}
                            Our team will contact you within 1-2 business days after review.{"\n"}
                            {"\n"}
                            For urgent matters, please contact us directly at 1588-1234.{"\n"}
                            {"\n"}
                            Thank you! 🙏
                        </Text>
                    </View>
                </View>
                ]);
                setSectionContent(prev => [
                    ...prev,
                    <View style={styles.feedbackForm} key={`inquiry-${Date.now()}`}>
                        <Text style={styles.titleText}>Wait a moment!</Text>
                        <Text style={styles.feedbackText}>
                            Was today's consultation helpful?{"\n"}
                            Please share your valuable feedback.
                        </Text>

                        <View style={styles.feedbackButtonContainer}>
                            <TouchableOpacity
                                style={[styles.feedbackButton, styles.reviewButton]}
                                onPress={() => handleReview("helpful")}
                            >
                                <Text style={styles.buttonText}>👍 Yes, it was helpful</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.feedbackButton, styles.reviewButton]}
                                onPress={() => handleReview("not_helpful")}
                            >
                                <Text style={styles.buttonText}>👎 No, needs improvement</Text>
                            </TouchableOpacity>
                        </View>
                    </View>,
                    <View style={styles.bottomNav}>
                        <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                            <Icon name="home" size={20} color="#333" />
                            <Text style={styles.homeText}>Home</Text>
                        </TouchableOpacity>
                    </View>
                ]);

                setInquiryStep(0);
                setInquiryStatus(false);
            }
        } else {
            const start = performance.now();
            const latencyMs = Math.round(performance.now() - start);
            // axios.post(`${REACT_APP_API_URL}/chat/sessions/${newSession}/messages`, {
            //     session_id: newSession,
            //     role: "user",
            //     content: text,
            //     response_latency_ms: latencyMs,
            // }).then((res) => {
            //     console.log(res.data);
            // }).catch((err) => {
            //     console.log(err);
            // });
            const data = await requestAssistantAnswer(text);
            const answer = data.answer?.trim?.() ? data.answer.trim() : "Unable to retrieve response.";
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



    /** 🟦 2. Start STT */
    const startSTT = async () => {
        console.log("🎤 Starting STT");

        if (!audioRecorderPlayer.current) {
            audioRecorderPlayer.current = new AudioRecorderPlayer();
        }

        /** Request permissions */
        if (Platform.OS === "android") {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
            ]);

            if (granted["android.permission.RECORD_AUDIO"] !== "granted") {
                Alert.alert("Microphone permission is required.");
                return;
            }
        }

        try {
            // 🟦 Android uses app internal storage path
            const path = Platform.OS === "android"
                ? `${RNFS.DocumentDirectoryPath}/${Date.now()}_record.mp4`
                : "record.m4a";

            const uri = await audioRecorderPlayer.current.startRecorder(path, {
                meteringEnabled: true,   // Important!
            });

            recordingPathRef.current = uri;

            console.log("Recording started:", uri);

            // monitorSilence();

        } catch (error) {
            console.error("Recording start error:", error);
            Alert.alert("Unable to start recording.");
        }
    };


    /** 🟦 3. Silence detection */
    const monitorSilence = () => {
        if (!audioRecorderPlayer.current) return;

        recordBackListener.current = audioRecorderPlayer.current.addRecordBackListener((e: any) => {
            const currentMetering = e.currentMetering || 0;
            const rms = Math.abs(currentMetering / 160);

            if (rms < SILENCE_THRESHOLD) {
                if (!silenceTimer.current) {
                    silenceTimer.current = setTimeout(() => {
                        stopSTT();
                    }, SILENCE_TIMEOUT);
                }
            } else {
                if (silenceTimer.current) {
                    clearTimeout(silenceTimer.current);
                    silenceTimer.current = null;
                }
            }
        });
    };

    /** 🟦 4. Stop STT + Upload to server */
    const stopSTT = async () => {
        console.log("🛑 Stopping STT");

        if (!audioRecorderPlayer.current) return;

        try {
            // 1) Remove listener
            if (recordBackListener.current) {
                audioRecorderPlayer.current.removeRecordBackListener();
                recordBackListener.current = null;
            }

            // 2) Remove silence timer
            if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
                silenceTimer.current = null;
            }

            // 3) Stop recording
            let uri = await audioRecorderPlayer.current.stopRecorder();

            // 4) Android → fallback if stopRecorder() returns empty string
            if (!uri || uri.trim() === "") {
                uri = recordingPathRef.current;
            }

            // 5) iOS file creation delay fix
            await new Promise(res => setTimeout(res, 150));

            // 6) Upload to server
            uploadToServer(uri);

        } catch (error) {
            console.error("Recording stop error:", error);
            Alert.alert("Unable to stop recording.");
        }
    };


    /** 🟦 5. Send to server → Update UI in ChatSection */
    const uploadToServer = async (uri: string) => {
        try {
            if (!uri) {
                Alert.alert("Recording file not found.");
                return;
            }

            const formData = new FormData();

            const fileExtension = Platform.OS === 'ios' ? 'm4a' : 'mp4';
            const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';

            formData.append("file", {
                uri: uri,                  // Android: RNFS path as is, iOS: relative path possible
                type: mimeType,
                name: `record.${fileExtension}`,
            } as any);

            formData.append("lang", "Kor");

            // Server URL: Use IP or domain accessible from mobile
            const apiUrl = REACT_APP_API_URL; // e.g., "http://192.168.x.x:8000"

            const res = await fetch(`${apiUrl}/llm/clova_stt`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                console.error("Server response error:", res.status, await res.text());
                Alert.alert("An error occurred while processing on the server.");
                return;
            }

            const data = await res.json();

            setSectionContent(prev => [
                ...prev,
                <View
                    key={`message-${Date.now()}`}
                    style={[
                        styles.messageContainer,
                        styles.userMessage
                    ]}
                >
                    <Text style={[
                        styles.messageText,
                        styles.userMessageText
                    ]}>
                        {data.text}
                    </Text>
                </View>
            ]);

            const STTdata = await requestAssistantAnswer(data.text);
            const answer = STTdata.answer?.trim?.() ? STTdata.answer.trim() : "Unable to retrieve response.";
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



        } catch (error) {
            console.error('Server upload error:', error);
            Alert.alert("An error occurred while processing speech recognition.");
        }
    };


    useImperativeHandle(ref, () => ({
        handleSendMessage,
        startSTT,
        stopSTT,
    }), [handleSendMessage, startSTT, stopSTT]);

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
            <Text style={styles.title}>{systemSettings.welcome_title}</Text>
            <Text style={styles.desc}>{systemSettings.welcome_message}</Text>

            {sectionContent.map((content, i) => {
                // Extract key if ReactElement, otherwise use index
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
            return fallback || "Failed to process request.";
        }
    }
}

const styles = StyleSheet.create({
    feedbackForm: {
        backgroundColor: "#e8f5ff",
        padding: 20,
        marginVertical: 10,
        borderRadius: 12,
        alignItems: "center",
    },
    titleText: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
        color: '#333',
    },
    feedbackText: {
        fontSize: 16,
        color: "#2a3a5f",
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 22,
    },
    feedbackButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    feedbackButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        alignItems: "center",
        marginHorizontal: 5,
    },

    reviewButton: {
        borderColor: "#9E9E9E",
        backgroundColor: "#FFFFFF",
    },
    buttonText: {
        fontSize: 12,
        color: "#323232",
        // fontWeight: "500",
    },


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
        lineHeight: 32, // 'normal' is usually the same as fontSize
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

