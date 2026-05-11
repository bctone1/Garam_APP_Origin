/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// 백그라운드/종료 상태에서 메시지 수신 시 호출 (OS가 알림은 자동 표시)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('[FCM] 백그라운드 메시지:', remoteMessage?.notification?.title);
});

AppRegistry.registerComponent(appName, () => App);
