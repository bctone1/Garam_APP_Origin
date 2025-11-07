/**
 * react-native-vector-icons/MaterialIcons 모듈 타입 선언
 * 
 * [기존 상황]
 * - footer.jsx (JavaScript 파일)에서는 타입 체크가 없어서 오류 없이 사용 가능했음
 * - SubMenuForm.tsx (TypeScript 파일)에서 사용 시 타입 선언이 없어서 오류 발생
 *   "모듈 'react-native-vector-icons/MaterialIcons'에 대한 선언 파일을 찾을 수 없습니다"
 * 
 * [변경 내용]
 * - 프로젝트 전체의 TypeScript 파일(.ts, .tsx)에서 react-native-vector-icons를 
 *   타입 안전하게 사용할 수 있도록 전역 타입 선언 파일 생성
 * 
 * [변경 이유]
 * - TypeScript는 모든 모듈에 대한 타입 정의를 요구함
 * - @types/react-native-vector-icons 패키지가 없거나 설치하지 않았을 경우
 *   직접 타입 선언 파일을 만들어야 함
 * - 이 파일을 src/types/ 폴더에 두면 프로젝트 전체에서 자동으로 인식됨
 * 
 * [사용 방법]
 * - 모든 TypeScript 컴포넌트에서 import Icon from 'react-native-vector-icons/MaterialIcons' 사용 가능
 * - 타입 체크와 자동완성 기능 제공
 */
declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';
  import { TextProps, StyleProp, TextStyle } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }

  export default class Icon extends Component<IconProps> {}
}

