/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useRef, useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View, Alert, Modal } from 'react-native';

import { Colors, DebugInstructions, LearnMoreLinks, ReloadInstructions, } from 'react-native/Libraries/NewAppScreen';
import Header from './src/components/header';
import Footer from './src/components/footer';
import ChatSection, { ChatSectionRef } from './src/components/chatsection';
import SecureNumberPad from './src/components/SecureNumberPad';
import NoticeToast, { ToastData } from './src/components/NoticeToast';
import { SafeAreaProvider, useSafeAreaInsets, } from 'react-native-safe-area-context';
import { initPush, setPushDeepLinkHandler, setPushToastHandler } from './src/utill/push';


function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const chatSectionRef = useRef<ChatSectionRef>(null);

  // 🟩 스트리밍 STT 모드 전환 플래그 (true: 스트리밍, false: 기존 백엔드 STT)
  const USE_STREAMING_STT = true;
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(false);
  const [showSecureNumPad, setShowSecureNumPad] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    setPushDeepLinkHandler((notice) => {
      chatSectionRef.current?.openNoticeDetail(notice);
    });
    setPushToastHandler(({ title, body, onPress }) => {
      setToast({ id: Date.now(), title, body, onPress });
    });
    initPush();
    return () => {
      setPushDeepLinkHandler(null);
      setPushToastHandler(null);
    };
  }, []);

  //부모 컴포넌트에서 자식 컴포넌트의 handleSendMessage를 정의
  const handleSend = (message: string) => {
    chatSectionRef.current?.handleSendMessage(message, true);
  };

  const handleSTT = (isActive: boolean) => {
    if (USE_STREAMING_STT) {
      // 🟩 스트리밍 STT 모드
      if (!isActive) {
        setIsStreamingActive(true);
        setStreamingText('');
        chatSectionRef.current?.startStreamingSTT();
      } else {
        setIsStreamingActive(false);
        chatSectionRef.current?.stopStreamingSTT();
      }
    } else {
      // 🟦 기존 백엔드 STT 모드 (변경 없음)
      if (!isActive) {
        chatSectionRef.current?.startSTT();
      } else {
        chatSectionRef.current?.stopSTT();
      }
    }
  };

  const handleStreamingResult = (text: string) => {
    setStreamingText(text);
  };

  const handleStreamingEnd = () => {
    setIsStreamingActive(false);
  };

  const handleSecureNumberConfirm = (businessNumber: string) => {
    setShowSecureNumPad(false);
    chatSectionRef.current?.handleSendMessage(businessNumber, true);
  };

  const handleSecureNumberCancel = () => {
    setShowSecureNumPad(false);
    chatSectionRef.current?.getFirstMenu();
  };

  return (
    <View style={styles.container}>
      <Header />
      <ChatSection
        ref={chatSectionRef}
        onStreamingSTTResult={handleStreamingResult}
        onStreamingSTTEnd={handleStreamingEnd}
        onRequestSecureNumPad={() => setShowSecureNumPad(true)}
      />

      {/* 정의한 handleSend를 자식(Footer)에 전달 */}
      <Footer
        onSend={handleSend}
        onSTT={handleSTT}
        streamingText={streamingText}
        isStreamingActive={isStreamingActive}
      />

      <Modal
        visible={showSecureNumPad}
        transparent={true}
        animationType="slide"
        onRequestClose={handleSecureNumberCancel}
      >
        <SecureNumberPad
          visible={showSecureNumPad}
          onConfirm={handleSecureNumberConfirm}
          onCancel={handleSecureNumberCancel}
        />
      </Modal>

      <NoticeToast toast={toast} onDismiss={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
