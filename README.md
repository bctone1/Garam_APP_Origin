This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Dependencies Installation

프로젝트를 실행하기 전에 필요한 모든 의존성을 설치해야 합니다. 다음 순서대로 설치를 진행하세요.

## 사전 요구사항

- **Node.js**: >= 18 (프로젝트에서 요구하는 최소 버전)
- **npm** 또는 **yarn**: 패키지 관리자
- **Ruby**: >= 2.6.10 (iOS 개발용)
- **CocoaPods**: iOS 의존성 관리 (Ruby를 통해 설치)

## 1. Node.js 패키지 설치

프로젝트 루트 디렉토리에서 다음 명령어를 실행하세요:

```bash
# npm 사용 시
npm install

# 또는 yarn 사용 시
yarn install
```

이 명령어는 `package.json`에 정의된 모든 Node.js 의존성을 설치합니다.

### 주요 의존성
- **React**: 18.3.1
- **React Native**: 0.75.4
- **Axios**: HTTP 클라이언트
- **React Native Vector Icons**: 아이콘 라이브러리
- **React Native Linear Gradient**: 그라데이션 컴포넌트
- 기타 개발 의존성들

## 2. Ruby Gems 설치 (iOS 개발용)

iOS 개발을 위해서는 Ruby Gems를 설치해야 합니다:

```bash
# Bundler가 설치되어 있지 않은 경우 먼저 설치
gem install bundler

# Gemfile에 정의된 Ruby Gems 설치
bundle install
```

이 명령어는 `Gemfile`에 정의된 다음 Gems를 설치합니다:
- **CocoaPods**: >= 1.13 (1.15.0, 1.15.1 제외)
- **ActiveSupport**: >= 6.1.7.5 (7.1.0 제외)

## 3. iOS CocoaPods 의존성 설치

iOS 앱을 빌드하려면 CocoaPods 의존성을 설치해야 합니다:

```bash
# ios 디렉토리로 이동
cd ios

# CocoaPods 의존성 설치
pod install

# 프로젝트 루트로 돌아가기
cd ..
```

> **참고**: macOS에서만 실행 가능합니다. Windows에서는 Android 개발만 가능합니다.

## 4. Android 의존성

Android 의존성은 Gradle이 자동으로 관리합니다. 첫 빌드 시 자동으로 다운로드됩니다.

## 전체 설치 스크립트 (한 번에 실행)

모든 의존성을 한 번에 설치하려면 다음 명령어를 순서대로 실행하세요:

```bash
# 1. Node.js 패키지 설치
npm install
# 또는
yarn install

# 2. Ruby Gems 설치 (macOS/iOS 개발 시)
bundle install

# 3. iOS CocoaPods 설치 (macOS/iOS 개발 시)
cd ios && pod install && cd ..
```

## 의존성 업데이트

### Node.js 패키지 업데이트
```bash
npm update
# 또는
yarn upgrade
```

### iOS CocoaPods 업데이트
```bash
cd ios
pod update
cd ..
```

### Ruby Gems 업데이트
```bash
bundle update
```

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
