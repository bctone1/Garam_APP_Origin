import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

interface SubMenuFormProps {
  category: Category;
  faqs: FAQ[];
  onSelectFAQ: (faq: FAQ) => void;
  onBack: () => void;
}

export default function SubMenuForm({ category, faqs, onSelectFAQ, onBack }: SubMenuFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.underline} />

      <View style={styles.submenuWrap}>
        <Text style={styles.submenuTitle}>{category.name}</Text>

        {faqs.length === 0 ? (
          <Text style={styles.emptyText}>등록된 질문이 없습니다.</Text>
        ) : (
          <>
            <Text style={styles.submenuDesc}>번호를 입력하거나 클릭하여 세부 문제를 선택하세요.</Text>

            {faqs.map((faq, index) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.submenuItem}
                onPress={() => onSelectFAQ(faq)}
              >
                <View style={styles.submenuId}>
                  <Text style={styles.submenuIdText}>{index + 1}</Text>
                </View>
                <View style={styles.submenuContent}>
                  <Text style={styles.submenuQuestion}>{faq.question}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-back" size={18} color="#007AFF" style={styles.backIcon} />
            <Text style={styles.backText}>이전 메뉴 보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  underline: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  submenuWrap: {
    padding: 16,
  },
  submenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  submenuDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submenuId: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  submenuIdText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submenuContent: {
    flex: 1,
  },
  submenuQuestion: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  bottomNav: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  backIcon: {
    marginRight: 6,
  },
  backText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

