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
              <Text style={styles.titleText}>Contact Us</Text>
              <Text style={styles.descText}>Direct consultation and support</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onFAQ}>
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>❓</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.titleText}>FAQ</Text>
              <Text style={styles.descText}>View questions</Text>
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
    paddingBottom: 16,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    width: '48%',      // 👈 2열 핵심
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  descText: {
    fontSize: 12,
    color: '#777',
  },
});
