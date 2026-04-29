import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeStore } from '@/stores/themeStore';

export default function SyllabusScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [syllabusText, setSyllabusText] = useState('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'image/*'],
      });
      if (!result.canceled && result.assets?.length) {
        setFileName(result.assets[0].name);
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const handleContinue = () => {
    const textToPass = syllabusText.trim() || (fileName ? `[Uploaded file: ${fileName}]` : '');
    router.push({
      pathname: '/(student)/onboarding/exam-select',
      params: { syllabus_text: textToPass },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginTop: 48,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 32,
      lineHeight: 22,
    },
    uploadArea: {
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 16,
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    uploadAreaActive: {
      borderColor: colors.primary,
    },
    uploadIcon: {
      marginBottom: 12,
    },
    uploadText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    uploadFileName: {
      fontSize: 14,
      color: colors.primary,
      marginTop: 8,
      fontWeight: '600',
    },
    orText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginVertical: 20,
    },
    textInput: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      padding: 16,
      fontSize: 15,
      color: colors.text,
      minHeight: 120,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
    },
    continueButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 'auto',
      marginBottom: 32,
    },
    continueButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#000',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={styles.title}>Upload Your Syllabus</Text>
        <Text style={styles.subtitle}>
          Help Axiom create a personalized study plan tailored to your curriculum
        </Text>

        <TouchableOpacity
          style={[styles.uploadArea, fileName && styles.uploadAreaActive]}
          onPress={pickDocument}
          activeOpacity={0.7}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={48}
            color={fileName ? colors.primary : colors.textSecondary}
            style={styles.uploadIcon}
          />
          <Text style={styles.uploadText}>
            {fileName ? 'File selected' : 'Tap to upload PDF, text, or image'}
          </Text>
          {fileName && <Text style={styles.uploadFileName}>{fileName}</Text>}
        </TouchableOpacity>

        <Text style={styles.orText}>— OR paste your syllabus below —</Text>

        <TextInput
          style={styles.textInput}
          placeholder="Paste syllabus content here..."
          placeholderTextColor={colors.textSecondary}
          multiline
          value={syllabusText}
          onChangeText={setSyllabusText}
        />

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
