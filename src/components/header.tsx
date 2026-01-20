import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function Header() {
    return (
        <View style={styles.header}>
            <View style={styles.headerInner}>
                {/* 로고 */}
                <Image
                    source={require('../assets/images/garam_logo.png')}
                    style={styles.logo}
                />

                {/* 제목/부제 */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Garam Postech AI Support Center</Text>
                    <Text style={styles.subtitle}>24/7 Smart Customer Support</Text>
                </View>
            </View>

            {/* 버튼 영역 */}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#f5f5f5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    headerInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 36,
        height: 36,
        marginRight: 8,
        borderRadius: 18,
        overflow: 'hidden',
    },
    titleContainer: {
        flexDirection: 'column',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 12,
        color: '#777',
    },
    // headerButtons: {
    //     flexDirection: 'row',
    // },
    // headerButton: {
    //     marginLeft: 8,
    //     padding: 6,
    // },
    // icon: {
    //     fontSize: 18,
    // },
});
