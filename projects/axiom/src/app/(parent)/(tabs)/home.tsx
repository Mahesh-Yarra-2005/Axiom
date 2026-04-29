import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';

const CHILDREN_DATA = [
  {
    id: '1',
    name: 'Arjun Sharma',
    initials: 'AS',
    studyHours: 12,
    progress: 68,
    lastActive: '2 hours ago',
    status: 'On Track',
    statusColor: 'success',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    initials: 'PS',
    studyHours: 8,
    progress: 45,
    lastActive: '5 hours ago',
    status: 'Needs Attention',
    statusColor: 'warning',
  },
];

export default function ParentHome() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const styles = makeStyles(colors);

  const handleLinkChild = () => {
    if (inviteCode.trim()) {
      // TODO: query students table by invite_code, create parent_student_link
      setInviteCode('');
      setShowLinkInput(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Parent Dashboard</Text>

        {CHILDREN_DATA.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={styles.childCard}
            onPress={() => router.push(`/(parent)/child/${child.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{child.initials}</Text>
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.lastActive}>Last active: {child.lastActive}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      child.statusColor === 'success'
                        ? colors.success + '20'
                        : colors.warning + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        child.statusColor === 'success' ? colors.success : colors.warning,
                    },
                  ]}
                >
                  {child.status}
                </Text>
              </View>
            </View>

            <Text style={styles.studyHours}>
              Study hours this week: {child.studyHours}h
            </Text>

            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${child.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{child.progress}% overall progress</Text>
          </TouchableOpacity>
        ))}

        {showLinkInput ? (
          <View style={styles.linkSection}>
            <Text style={styles.linkTitle}>Enter Invite Code</Text>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Enter child's invite code"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.linkButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLinkInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkButton} onPress={handleLinkChild}>
                <Text style={styles.linkButtonText}>Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => setShowLinkInput(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.addChildText}>Link Child</Text>
          </TouchableOpacity>
        )}
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
    childCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '30',
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    cardHeaderInfo: {
      flex: 1,
      marginLeft: 12,
    },
    childName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    lastActive: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    studyHours: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 6,
    },
    linkSection: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    linkTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    linkButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    cancelButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '500',
    },
    linkButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 10,
    },
    linkButtonText: {
      color: '#000',
      fontSize: 15,
      fontWeight: '600',
    },
    addChildButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.primary + '50',
      borderStyle: 'dashed',
    },
    addChildText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });
