import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, TouchableOpacity, Platform, PermissionsAndroid, Image } from 'react-native';
import axios from 'axios';
import { REACT_APP_API_URL } from '@env';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import MenuForm from './MenuForm';
import SubMenuForm from './SubMenuForm';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from "react-native-fs";
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';

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
    handleSendMessage: (text: string, isUser?: boolean, forceInquiry?: boolean) => void;
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
        category: "",
        businessNumber: "",
        companyName: "",
        phone: "",
        detail: "",
    });
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const hasRunRef = useRef(false);
    const audioRecorderPlayer = useRef<any>(null);
    const recordingPathRef = useRef<string | null>(null);
    const silenceTimer = useRef<NodeJS.Timeout | null>(null);
    const recordBackListener = useRef<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [filePreviews, setFilePreviews] = useState<any[]>([]);
    const inquiryDetailRenderKeyRef = useRef<string>('inquiry-detail-form');
    const filePreviewsRef = useRef<any[]>([]);
    const selectedFilesRef = useRef<any[]>([]);

    const SILENCE_THRESHOLD = 0.01;
    const SILENCE_TIMEOUT = 2000;

    useEffect(() => {
        if (hasRunRef.current) return;
        if (timerRef.current) { clearTimeout(timerRef.current); }
        timerRef.current = setTimeout(() => {
            setSectionContent(prev => [
                ...prev,
                <View style={styles.feedbackForm} key={`inquiry-${Date.now()}`}>
                    <Text style={styles.titleText}>잠깐만요!</Text>
                    <Text style={styles.feedbackText}>
                        오늘 상담이 도움이 되셨나요?{"\n"}
                        여러분의 소중한 의견을 들려주세요.
                    </Text>

                    <View style={styles.feedbackButtonContainer}>
                        <TouchableOpacity
                            style={[styles.feedbackButton, styles.reviewButton]}
                            onPress={() => handleReview("helpful")}
                        >
                            <Text style={styles.buttonText}>👍 네, 도움이 되었어요</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.feedbackButton, styles.reviewButton]}
                            onPress={() => handleReview("not_helpful")}
                        >
                            <Text style={styles.buttonText}>👎 아니요, 더 개선이 필요해요</Text>
                        </TouchableOpacity>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>처음으로</Text>
                    </TouchableOpacity>
                </View>
            ]);
            hasRunRef.current = true;
        }, 20000);
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
                    <Text style={styles.titleText}>감사합니다!</Text>
                    <Text style={styles.feedbackText}>
                        소중한 의견이 반영되었습니다!
                    </Text>

                    <View style={styles.feedbackButtonContainer}>
                        <TouchableOpacity style={[styles.feedbackButton, styles.reviewButton]}>
                            <Text style={styles.buttonText}>대표번호{"\n"}1588-1234</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.feedbackButton, styles.reviewButton]}>
                            <Text style={styles.buttonText}>기술지원 이메일{"\n"}tech@garampos.com</Text>
                        </TouchableOpacity>
                    </View>
                </View>,
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>처음으로</Text>
                    </TouchableOpacity>
                </View>
            ]);
        }).catch((err) => {
            console.error(err);
        });
    }

    const createInquiry = async (detail: string, filesToUpload: any[] = []) => {
        try {
            // filesToUpload 파라미터 확인
            console.log('createInquiry 호출 - filesToUpload:', filesToUpload.length, '개');
            console.log('filesToUpload 상세:', JSON.stringify(filesToUpload, null, 2));
            
            // ref를 사용하여 최신 파일 상태 확인
            const currentFilePreviews = filePreviewsRef.current;
            const currentSelectedFiles = selectedFilesRef.current;
            console.log('ref - selectedFiles:', currentSelectedFiles.length, '개');
            console.log('ref - filePreviews:', currentFilePreviews.length, '개');

            console.log('문의 정보:', {
                business_name: inquiryInfo.companyName,
                business_number: inquiryInfo.businessNumber,
                phone: inquiryInfo.phone,
                content: detail,
                inquiry_type: inquiryInfo.category,
                filesToUpload_count: filesToUpload.length,
                ref_filePreviews_count: currentFilePreviews.length,
                ref_selectedFiles_count: currentSelectedFiles.length
            });

            const formData = new FormData();
            formData.append("business_name", inquiryInfo.companyName || "");
            formData.append("business_number", inquiryInfo.businessNumber || "");
            formData.append("phone", inquiryInfo.phone || "");
            formData.append("content", detail || "");
            formData.append("inquiry_type", inquiryInfo.category || "");

            // 파일 추가 - 우선순위: filesToUpload > ref filePreviews > ref selectedFiles
            let files: any[] = [];
            if (filesToUpload && filesToUpload.length > 0) {
                files = filesToUpload;
                console.log('filesToUpload 사용:', files.length, '개');
            } else if (currentFilePreviews && currentFilePreviews.length > 0) {
                files = currentFilePreviews;
                console.log('ref filePreviews 사용:', files.length, '개');
            } else if (currentSelectedFiles && currentSelectedFiles.length > 0) {
                files = currentSelectedFiles;
                console.log('ref selectedFiles 사용:', files.length, '개');
            }
            
            console.log('최종 사용할 파일 배열:', files.length, '개');
            
            if (files && files.length > 0) {
                console.log(`파일 ${files.length}개 추가 시작`);
                console.log('파일 목록:', JSON.stringify(files, null, 2));
                
                files.forEach((file, index) => {
                    console.log(`파일 ${index + 1} 원본 정보:`, {
                        uri: file.uri,
                        type: file.type,
                        fileName: file.fileName,
                        fileSize: file.fileSize
                    });

                    // react-native-image-picker는 이미 올바른 URI 형식을 반환함
                    // Android: content:// 또는 file://
                    // iOS: file:// 또는 ph://
                    let fileUri = file.uri;
                    
                    if (!fileUri) {
                        console.error(`파일 ${index + 1}: URI가 없습니다`);
                        return;
                    }

                    // Android에서 content:// URI는 그대로 사용
                    // iOS에서 ph:// URI는 file://로 변환 필요할 수 있음
                    if (Platform.OS === 'ios' && fileUri.startsWith('ph://')) {
                        // ph:// URI는 그대로 사용 (react-native-image-picker가 처리)
                        console.log('iOS ph:// URI 사용');
                    }

                    // MIME 타입 확인
                    let mimeType = file.type || 'image/jpeg';
                    if (!mimeType || mimeType === '' || mimeType === 'image') {
                        // 파일명 확장자로부터 MIME 타입 추정
                        const ext = file.fileName?.split('.').pop()?.toLowerCase();
                        if (ext === 'png') mimeType = 'image/png';
                        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                        else if (ext === 'gif') mimeType = 'image/gif';
                        else mimeType = 'image/jpeg';
                    }

                    // 파일명 생성
                    const fileName = file.fileName || `image_${Date.now()}_${index}.jpg`;

                    // React Native FormData 형식 - 정확한 구조로 생성
                    // React Native에서는 uri, type, name 속성이 필요함
                    // 주의: name 속성은 필수이며, 파일명을 포함해야 함
                    const fileObject: any = {
                        uri: fileUri,
                        type: mimeType,
                        name: fileName,
                    };

                    console.log(`파일 ${index + 1} FormData 객체:`, {
                        uri: fileObject.uri,
                        type: fileObject.type,
                        name: fileObject.name
                    });

                    // FormData에 파일 추가 - React Native에서는 이 형식이 필요함
                    // 여러 파일을 추가할 때는 각각 개별적으로 추가
                    // 백엔드에서 "files" 필드명으로 받는지 확인 필요
                    formData.append("files", fileObject);
                });
                
                    console.log('모든 파일 추가 완료');
                console.log(`FormData에 ${files.length}개 파일 추가됨`);
            } else {
                console.log('추가할 파일이 없습니다');
                console.warn('경고: 파일이 선택되지 않았거나 전달되지 않았습니다.');
                console.warn('filesToUpload:', filesToUpload.length, 'filePreviews:', filePreviews.length, 'selectedFiles:', selectedFiles.length);
            }

            console.log('FormData 전송 시작');
            console.log('FormData 내용 확인:', {
                business_name: inquiryInfo.companyName,
                business_number: inquiryInfo.businessNumber,
                phone: inquiryInfo.phone,
                content: detail,
                inquiry_type: inquiryInfo.category,
                files_count: files.length || 0,
                files_added: files.length > 0
            });

            const response = await fetch(`${REACT_APP_API_URL}/inquiries/`, {
                method: "POST",
                body: formData,
                headers: {
                    // FormData 사용 시 Content-Type을 명시적으로 설정하지 않음
                    // React Native가 자동으로 multipart/form-data로 설정함
                    'Accept': 'application/json',
                },
            });

            console.log('응답 상태:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('서버 응답 오류:', errorText);
                
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('오류 상세:', errorJson);
                    Alert.alert('오류', errorJson.detail || errorJson.message || '문의 접수 실패');
                } catch {
                    Alert.alert('오류', errorText || '문의 접수 실패');
                }
                return;
            }

            const result = await response.json();
            console.log('문의 접수 성공:', result);
        } catch (error: any) {
            console.error('문의 접수 오류:', error);
            Alert.alert('오류', error.message || '문의 접수 중 오류가 발생했습니다.');
        }
    }

    const getSystemSettings = () => {
        axios.get(`${REACT_APP_API_URL}/system/setting`).then((res) => {
            setsystemSettings(res.data);
        }).catch((err) => {
            console.error(err);
        });
    }

    const buildInquiryDetailStepContent = (previews: any[]) => {
        return (
            <View key={inquiryDetailRenderKeyRef.current}>
                <View style={styles.inquiryForm}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepNumber}>4</Text>
                            <Text style={styles.stepText}>/4 단계</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>문의내용</Text>
                            <Text style={styles.question}>문의내용을 입력해주세요</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.subTitle}>
                            마지막으로, 문의내용을 입력하세요
                        </Text>
                        <Text style={styles.assistantText}>
                            (예: 카드리더기 오류로 결제가 안됩니다, POS 용지 부족으로 용지 요청드립니다)
                        </Text>

                        {/* 파일 선택 버튼 */}
                        <TouchableOpacity
                            style={styles.fileSelectButton}
                            onPress={handleFilePick}
                            disabled={previews.length >= 3}
                        >
                            <Icon name="attach-file" size={20} color="#007AFF" />
                            <Text style={styles.fileSelectText}>
                                사진 첨부 ({previews.length}/3)
                            </Text>
                        </TouchableOpacity>

                        {/* 파일 미리보기 */}
                        {previews.length > 0 && (
                            <View style={styles.filePreviewContainer}>
                                {previews.map((preview, index) => (
                                    <View key={index} style={styles.filePreviewItem}>
                                        <Image
                                            source={{ uri: preview.uri }}
                                            style={styles.filePreviewImage}
                                        />
                                        <TouchableOpacity
                                            style={styles.fileRemoveButton}
                                            onPress={() => handleFileRemove(index)}
                                        >
                                            <Icon name="close" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                        <Icon name="home" size={20} color="#333" />
                        <Text style={styles.homeText}>처음으로</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const replaceInquiryDetailStepContent = (previews: any[]) => {
        setSectionContent(prev =>
            prev.map(item => {
                if (React.isValidElement(item) && item.key === inquiryDetailRenderKeyRef.current) {
                    return buildInquiryDetailStepContent(previews);
                }
                return item;
            })
        );
    };

    // 파일 선택 핸들러
    const handleFilePick = async () => {
        const currentCount = filePreviews.length;
        if (currentCount >= 3) {
            Alert.alert('알림', '파일은 최대 3개까지 선택할 수 있습니다.');
            return;
        }

        // Android 권한 체크
        if (Platform.OS === 'android') {
            try {
                const permission =
                    (Platform.Version as number) >= 33
                        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
                        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

                const granted = await PermissionsAndroid.request(
                    permission,
                    {
                        title: '이미지 접근 권한',
                        message: '이미지를 선택하기 위해 저장소 접근 권한이 필요합니다.',
                        buttonNeutral: '나중에',
                        buttonNegative: '취소',
                        buttonPositive: '확인',
                    }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert('권한 필요', '이미지를 선택하려면 저장소 접근 권한이 필요합니다.');
                    return;
                }
            } catch (err) {
                console.warn(err);
            }
        }

        launchImageLibrary(
            {
                mediaType: 'photo',
                quality: 0.8,
                selectionLimit: 3 - currentCount, // 남은 개수만큼만 선택 가능
            },
            (response: ImagePickerResponse) => {
                if (response.didCancel) {
                    return;
                }

                if (response.errorMessage) {
                    Alert.alert('오류', response.errorMessage);
                    return;
                }

                if (response.assets && response.assets.length > 0) {
                    console.log('선택된 파일 assets:', response.assets);
                    
                    const newFiles = response.assets.map((asset: Asset, idx: number) => {
                        const fileData = {
                            uri: asset.uri || '',
                            type: asset.type || 'image/jpeg',
                            fileName: asset.fileName || `image_${Date.now()}_${idx}.jpg`,
                            fileSize: asset.fileSize || 0,
                        };
                        console.log(`파일 ${idx + 1} 매핑:`, fileData);
                        return fileData;
                    });

                    const totalCount = filePreviews.length + newFiles.length;
                    if (totalCount > 3) {
                        Alert.alert('알림', '파일은 최대 3개까지 선택할 수 있습니다.');
                        return;
                    }

                    console.log('새 파일 추가 전 - selectedFiles:', selectedFiles.length, 'filePreviews:', filePreviews.length);
                    console.log('추가할 새 파일:', newFiles);

                    setSelectedFiles(prev => {
                        const updated = [...prev, ...newFiles];
                        console.log('selectedFiles 업데이트 후:', updated.length);
                        selectedFilesRef.current = updated;
                        return updated;
                    });
                    setFilePreviews(prev => {
                        const updated = [...prev, ...newFiles];
                        console.log('filePreviews 업데이트 후:', updated.length);
                        filePreviewsRef.current = updated;
                        replaceInquiryDetailStepContent(updated);
                        return updated;
                    });
                } else {
                    console.log('선택된 파일이 없습니다');
                }
            }
        );
    };

    // 파일 삭제 핸들러
    const handleFileRemove = (index: number) => {
        setSelectedFiles(prev => {
            const updated = prev.filter((_, i) => i !== index);
            selectedFilesRef.current = updated;
            return updated;
        });
        setFilePreviews(prev => {
            const updated = prev.filter((_, i) => i !== index);
            filePreviewsRef.current = updated;
            replaceInquiryDetailStepContent(updated);
            return updated;
        });
    };

    const getCategory = () => {
        axios.get(`${REACT_APP_API_URL}/system/quick-categories`).then((res) => {
            setCategories(res.data);
        }).catch((err) => {
            console.error('API 오류 상세:', err);
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

        <View style={styles.container_inquiry}>
            <View style={styles.underline_inquiry} />

            <View style={styles.submenuWrap_inquiry}>
                <Text style={styles.submenuTitle_inquiry}>문의하기</Text>
                <Text style={styles.submenuDesc_inquiry}>번호를 입력하거나 클릭하여 카테고리를 선택하세요.</Text>

                <TouchableOpacity
                    style={styles.submenuItem_inquiry}
                    onPress={() => {
                        handleSendMessage("1", true, true);
                    }}
                >
                    <View style={styles.submenuId_inquiry}>
                        <Text style={styles.submenuIdText_inquiry}>1</Text>
                    </View>
                    <View style={styles.submenuContent_inquiry}>
                        <Text style={styles.submenuQuestion_inquiry}>용지 요청</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.submenuItem_inquiry}
                    onPress={() => {
                        handleSendMessage("2", true, true);
                    }}
                >
                    <View style={styles.submenuId_inquiry}>
                        <Text style={styles.submenuIdText_inquiry}>2</Text>
                    </View>
                    <View style={styles.submenuContent_inquiry}>
                        <Text style={styles.submenuQuestion_inquiry}>매출 내역</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.submenuItem_inquiry}
                    onPress={() => {
                        handleSendMessage("3", true, true);
                    }}
                >
                    <View style={styles.submenuId_inquiry}>
                        <Text style={styles.submenuIdText_inquiry}>3</Text>
                    </View>
                    <View style={styles.submenuContent_inquiry}>
                        <Text style={styles.submenuQuestion_inquiry}>메뉴 수정 및 추가</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.submenuItem_inquiry}
                    onPress={() => {
                        handleSendMessage("4", true, true);
                    }}
                >
                    <View style={styles.submenuId_inquiry}>
                        <Text style={styles.submenuIdText_inquiry}>4</Text>
                    </View>
                    <View style={styles.submenuContent_inquiry}>
                        <Text style={styles.submenuQuestion_inquiry}>기타</Text>
                    </View>
                </TouchableOpacity>


                <View style={styles.bottomNav_inquiry}>
                    <TouchableOpacity style={styles.backButton_inquiry} onPress={getFirstMenu}>
                        <Icon name="arrow-back" size={18} color="#007AFF" style={styles.backIcon_inquiry} />
                        <Text style={styles.backText_inquiry}>이전 메뉴 보기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
        ]);
    }

    const getFirstMenu = () => {
        setInquiryStatus(false);
        setInquiryStep(0);
        setInquiryInfo({
            category: "",
            businessNumber: "",
            companyName: "",
            phone: "",
            detail: "",
        });
        // 파일 상태 초기화
        setSelectedFiles([]);
        setFilePreviews([]);
        selectedFilesRef.current = [];
        filePreviewsRef.current = [];
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
            category: "",
            businessNumber: "",
            companyName: "",
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
        getSystemSettings();
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


    const handleSendMessage = React.useCallback(async (text: string, isUser: boolean = true, forceInquiry: boolean = false) => {
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

        // forceInquiry가 true이면 강제로 inquiry 모드로 처리
        const shouldUseInquiry = forceInquiry || inquiryStatus === true;

        if (shouldUseInquiry) {
            if (forceInquiry && !inquiryStatus) {
                setInquiryStatus(true);
            }
            if (forceInquiry && inquiryStep !== 0) {
                setInquiryStep(0);
            }

            const currentStep = forceInquiry ? 0 : inquiryStep;

            if (currentStep === 0) {
                let category = "";
                if (text === "1") {
                    category = "paper_request";
                } else if (text === "2") {
                    category = "sales_report";
                } else if (text === "3") {
                    category = "kiosk_menu_update";
                } else if (text === "4") {
                    category = "other";
                }

                setInquiryInfo((prev: any) => ({
                    ...prev,
                    category: category
                }));

                setSectionContent(prev => [...prev,
                <View style={styles.inquiryForm} key={`message-${Date.now()}`}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepNumber}>1</Text>
                            <Text style={styles.stepText}>/4 단계</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>문의 정보 수집</Text>
                            <Text style={styles.question}>사업자번호를 입력해주세요.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            안녕하세요! 문의사항을 접수해드리겠습니다.{"\n"}
                            빠른 처리를 위해 몇 가지 정보를 수집하겠습니다.
                        </Text>
                        <Text style={styles.subTitle}>
                            첫 번째로, 사업자번호를 입력하세요.
                        </Text>
                        <Text style={styles.assistantText}>
                            (예: 1234567890)
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
            } else if (currentStep === 1) {
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    businessNumber: text
                }));

                setSectionContent(prev => [...prev,
                <View style={styles.inquiryForm} key={`message-${Date.now()}`}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepNumber}>2</Text>
                            <Text style={styles.stepText}>/4 단계</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>상호명</Text>
                            <Text style={styles.question}>상호명을 입력해주세요.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.subTitle}>
                            두 번째로, 상호명을 입력하세요.
                        </Text>
                        <Text style={styles.assistantText}>
                            (예: 가람포스텍)
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
            } else if (currentStep === 2) {
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    companyName: text
                }));

                setSectionContent(prev => [...prev,
                <View style={styles.inquiryForm} key={`message-${Date.now()}`}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepNumber}>3</Text>
                            <Text style={styles.stepText}>/4 단계</Text>
                        </View>

                        <View style={styles.headerTextContainer}>
                            <Text style={styles.inquirytitle}>전화번호</Text>
                            <Text style={styles.question}>전화번호를 입력해주세요.</Text>
                        </View>
                    </View>

                    {/* Message Section */}
                    <View style={styles.messageSection}>
                        <Text style={styles.subTitle}>
                            세 번째로, 전화번호를 입력하세요.
                        </Text>
                        <Text style={styles.assistantText}>
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

                setInquiryStep(3);
            } else if (currentStep === 3) {
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    phone: text
                }));

                setSectionContent(prev => [...prev, buildInquiryDetailStepContent(filePreviews)]);
                setInquiryStep(4);
            } else if (currentStep === 4) {
                setInquiryInfo((prev: any) => ({
                    ...prev,
                    detail: text
                }));
                
                // ref를 사용하여 최신 파일 상태 가져오기 (클로저 문제 해결)
                const currentFilePreviews = filePreviewsRef.current;
                const currentSelectedFiles = selectedFilesRef.current;
                console.log('문의 제출 시점 - selectedFiles:', currentSelectedFiles.length, 'filePreviews:', currentFilePreviews.length);
                
                // filePreviews를 사용하여 파일 정보 가져오기 (더 안정적)
                const filesToUpload = currentFilePreviews.length > 0 ? currentFilePreviews : currentSelectedFiles;
                console.log('업로드할 파일:', filesToUpload);
                
                await createInquiry(text, filesToUpload);
                setSectionContent(prev => [...prev,
                <View key={`message-${Date.now()}`} style={[styles.messageContainer, styles.botMessage,]}>
                    <Text style={styles.inquirytitle}>📝문의가 접수되었습니다.</Text>
                    <View style={styles.messageSection}>
                        <Text style={styles.assistantText}>
                            접수 정보 :{"\n"}
                            • 사업자번호: {inquiryInfo.businessNumber}{"\n"}
                            • 상호명: {inquiryInfo.companyName}{"\n"}
                            • 연락처: {inquiryInfo.phone}{"\n"}
                            • 문의 내용: {text}{"\n"}
                            {filePreviews.length > 0 && (
                                <>
                                    • 첨부파일: {filePreviews.length}개{"\n"}
                                </>
                            )}
                            {"\n"}
                            귀하의 문의사항이 정상적으로 접수되었습니다.{"\n"}
                            담당자가 확인 후 영업일 기준 1-2일 내에 연락드리겠습니다.{"\n"}
                            {"\n"}
                            긴급한 사항인 경우 1588-1234로 직접 연락주시기 바랍니다.{"\n"}
                            {"\n"}
                            감사합니다! 🙏
                        </Text>
                    </View>
                </View>
                ]);
                setSectionContent(prev => [
                    ...prev,
                    <View style={styles.feedbackForm} key={`inquiry-${Date.now()}`}>
                        <Text style={styles.titleText}>잠깐만요!</Text>
                        <Text style={styles.feedbackText}>
                            오늘 상담이 도움이 되셨나요?{"\n"}
                            여러분의 소중한 의견을 들려주세요.
                        </Text>

                        <View style={styles.feedbackButtonContainer}>
                            <TouchableOpacity
                                style={[styles.feedbackButton, styles.reviewButton]}
                                onPress={() => handleReview("helpful")}
                            >
                                <Text style={styles.buttonText}>👍 네, 도움이 되었어요</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.feedbackButton, styles.reviewButton]}
                                onPress={() => handleReview("not_helpful")}
                            >
                                <Text style={styles.buttonText}>👎 아니요, 더 개선이 필요해요</Text>
                            </TouchableOpacity>
                        </View>
                    </View>,
                    <View style={styles.bottomNav}>
                        <TouchableOpacity style={styles.homeButton} onPress={getFirstMenu}>
                            <Icon name="home" size={20} color="#333" />
                            <Text style={styles.homeText}>처음으로</Text>
                        </TouchableOpacity>
                    </View>
                ]);

                setInquiryStep(0);
                setInquiryStatus(false);
                // 파일 초기화
                setSelectedFiles([]);
                setFilePreviews([]);
                selectedFilesRef.current = [];
                filePreviewsRef.current = [];
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



    /** 🟦 2. STT 시작 */
    const startSTT = async () => {
        console.log("🎤 STT 시작");

        if (!audioRecorderPlayer.current) {
            audioRecorderPlayer.current = new AudioRecorderPlayer();
        }

        /** 권한 요청 */
        if (Platform.OS === "android") {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
            ]);

            if (granted["android.permission.RECORD_AUDIO"] !== "granted") {
                Alert.alert("마이크 권한이 필요합니다.");
                return;
            }
        }

        try {
            // 🟦 Android는 앱 내부 저장소 경로 사용
            const path = Platform.OS === "android"
                ? `${RNFS.DocumentDirectoryPath}/${Date.now()}_record.mp4`
                : "record.m4a";

            const uri = await audioRecorderPlayer.current.startRecorder(path, {
                meteringEnabled: true,   // 중요!
            });

            recordingPathRef.current = uri;

            console.log("녹음 시작:", uri);

            // monitorSilence();

        } catch (error) {
            console.error("녹음 시작 오류:", error);
            Alert.alert("녹음을 시작할 수 없습니다.");
        }
    };


    /** 🟦 3. 무음 감지 */
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

    /** 🟦 4. STT 종료 + 서버 업로드 */
    const stopSTT = async () => {
        console.log("🛑 STT 종료");

        if (!audioRecorderPlayer.current) return;

        try {
            // 1) 리스너 제거
            if (recordBackListener.current) {
                audioRecorderPlayer.current.removeRecordBackListener();
                recordBackListener.current = null;
            }

            // 2) 무음 타이머 제거
            if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
                silenceTimer.current = null;
            }

            // 3) 녹음 중지
            let uri = await audioRecorderPlayer.current.stopRecorder();

            // 4) Android → stopRecorder()가 빈 문자열 반환하는 경우 fallback
            if (!uri || uri.trim() === "") {
                uri = recordingPathRef.current;
            }

            // 5) iOS는 파일 생성 지연 문제 해결
            await new Promise(res => setTimeout(res, 150));

            // 6) 서버 업로드
            uploadToServer(uri);

        } catch (error) {
            console.error("녹음 종료 오류:", error);
            Alert.alert("녹음을 종료할 수 없습니다.");
        }
    };


    /** 🟦 5. 서버에 보내고 → ChatSection에서 UI 업데이트 */
    const uploadToServer = async (uri: string) => {
        try {
            if (!uri) {
                Alert.alert("녹음 파일이 없습니다.");
                return;
            }

            const formData = new FormData();

            const fileExtension = Platform.OS === 'ios' ? 'm4a' : 'mp4';
            const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4';

            formData.append("file", {
                uri: uri,                  // Android: RNFS 경로 그대로, iOS: 상대경로 가능
                type: mimeType,
                name: `record.${fileExtension}`,
            } as any);

            formData.append("lang", "Kor");

            // 서버 URL: 모바일에서 접근 가능한 IP 혹은 도메인 사용
            const apiUrl = REACT_APP_API_URL; // 예: "http://192.168.x.x:8000"

            const res = await fetch(`${apiUrl}/llm/clova_stt`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                console.error("서버 응답 오류:", res.status, await res.text());
                Alert.alert("서버 처리 중 오류가 발생했습니다.");
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
            const answer = STTdata.answer?.trim?.() ? STTdata.answer.trim() : "응답을 가져올 수 없습니다.";
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
            console.error('서버 업로드 오류:', error);
            Alert.alert("음성 인식 처리 중 오류가 발생했습니다.");
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
    container_inquiry: {
        marginVertical: 16,
    },
    underline_inquiry: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginBottom: 16,
    },
    submenuWrap_inquiry: {
        padding: 16,
    },
    submenuTitle_inquiry: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    submenuDesc_inquiry: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    emptyText_inquiry: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
        textAlign: 'center',
        paddingVertical: 20,
    },
    submenuItem_inquiry: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    submenuId_inquiry: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    submenuIdText_inquiry: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    submenuContent_inquiry: {
        flex: 1,
    },
    submenuQuestion_inquiry: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
    bottomNav_inquiry: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    backButton_inquiry: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    backIcon_inquiry: {
        marginRight: 6,
    },
    backText_inquiry: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    fileSelectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
    },
    fileSelectText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    filePreviewContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    filePreviewItem: {
        position: 'relative',
        width: 80,
        height: 80,
        marginRight: 8,
        marginBottom: 8,
    },
    filePreviewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    fileRemoveButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },

});

export default ChatSection;

