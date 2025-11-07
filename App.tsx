/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useRef } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, useColorScheme, View, Alert } from 'react-native';

import { Colors, DebugInstructions, LearnMoreLinks, ReloadInstructions, } from 'react-native/Libraries/NewAppScreen';
import Header from './src/components/header';
import Footer from './src/components/footer';
import ChatSection, { ChatSectionRef } from './src/components/chatsection';
import { SafeAreaProvider, useSafeAreaInsets, } from 'react-native-safe-area-context';


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

  const handleSend = (message: string) => {
    // ChatSection의 handleSendMessage를 직접 호출
    chatSectionRef.current?.handleSendMessage(message, true);
  };

  const handleSTT = (isActive: boolean) => {
    Alert.alert('음성 인식', isActive ? '음성 인식 종료' : '음성 인식 시작');
  };

  return (
    <View style={styles.container}>
      <Header />
      <ChatSection ref={chatSectionRef} />
      <Footer onSend={handleSend} onSTT={handleSTT} />
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
