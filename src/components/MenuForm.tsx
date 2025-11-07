import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Category {
  id: number;
  name: string;
  description: string;
  icon_emoji?: string;
}

interface MenuFormProps {
  categories: Category[];
  onSelectCategory: (category: Category) => void;
  onInquiry: () => void;
  onFAQ: () => void;
}

export default function MenuForm({ categories, onSelectCategory, onInquiry, onFAQ }: MenuFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.buttonGrid}>
        <TouchableOpacity style={styles.button} onPress={onInquiry}>
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>💬</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.titleText}>문의하기</Text>
              <Text style={styles.descText}>직접 상담 및 지원 요청</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onFAQ}>
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>❓</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.titleText}>자주하는 질문</Text>
              <Text style={styles.descText}>질문 목록 보기</Text>
            </View>
          </View>
        </TouchableOpacity>

        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={styles.button}
            onPress={() => onSelectCategory(category)}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{category.icon_emoji || '📋'}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.titleText}>{category.name}</Text>
                <Text style={styles.descText}>{category.description}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  buttonGrid: {
    gap: 12,
  },
  button: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
  },
  iconText: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  descText: {
    fontSize: 14,
    color: '#777',
  },
});
