import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const LINKED_CHILDREN = [
  { id: '1', name: 'Arjun Sharma', exam: 'JEE Advanced 2025' },
  { id: '2', name: 'Priya Sharma', exam: 'NEET 2025' },
];

export default function ParentProfile() {
  const { colors, toggleTheme, scheme } = useThemeStore();
  const isDark = scheme === 'dark';
  const router = useRouter();

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RS</Text>
          </View>
          <Text style={styles.name}>Rajesh Sharma</Text>
          <Text style={styles.email}>rajesh.sharma@email.com</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Children</Text>
          {LINKED_CHILDREN.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={styles.childRow}
              onPress={() => router.push(`/(parent)/child/${child.id}`)}
            >
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>
                  {child.name.split(' ').map((n) => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childExam}>{child.exam}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
            <View style={styles.settingLeft}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={22}
                color={colors.primary}
              />
              <Text style={styles.settingText}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                { backgroundColor: isDark ? colors.primary : colors.border },
              ]}
            >
              <View
                style={[
                  styles.toggleDot,
                  { alignSelf: isDark ? 'flex-end' : 'flex-start' },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 24,
      marginTop: 12,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '30',
      borderWidth: 3,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
    },
    name: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.text,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    childRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    childAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    childAvatarText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    childInfo: {
      flex: 1,
      marginLeft: 12,
    },
    childName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    childExam: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    toggle: {
      width: 44,
      height: 24,
      borderRadius: 12,
      padding: 3,
      justifyContent: 'center',
    },
    toggleDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#fff',
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.error + '30',
      marginTop: 8,
    },
    signOutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
      marginLeft: 8,
    },
  });
