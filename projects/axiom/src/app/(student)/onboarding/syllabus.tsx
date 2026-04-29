import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useThemeStore } from '@/stores/themeStore';

export default function SyllabusScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [reading, setReading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setFileName(asset.name);
      setReading(true);

      try {
        // Read text files directly
        const isText = asset.mimeType?.includes('text') || asset.name.endsWith('.txt');
        if (isText && asset.uri) {
          const content = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          setSyllabusText(content.slice(0, 8000)); // cap at 8k chars
        } else {
          // For PDFs/images: use filename as context hint, prompt user to paste
          Alert.alert(
            'PDF Uploaded',
            'For best results, also paste your syllabus topics in the text box below. PDF text extraction is limited on mobile.',
          );
          setSyllabusText(`[File: ${asset.name}]\n\n`);
        }
      } catch (readErr) {
        console.log('Could not read file content:', readErr);
        setSyllabusText(`[File: ${asset.name}]\n\n`);
      } finally {
        setReading(false);
      }
    } catch (err) {
      setReading(false);
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>Upload Your Syllabus</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Help Axiom create a personalized study plan tailored to your curriculum
        </Text>

        <TouchableOpacity
          style={[
            styles.uploadArea,
            { borderColor: fileName ? colors.primary : colors.border, backgroundColor: colors.surface },
          ]}
          onPress={pickDocument}
          activeOpacity={0.7}
        >
          {reading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={48}
                color={fileName ? colors.primary : colors.textSecondary}
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                {fileName ? 'File selected — tap to change' : 'Tap to upload PDF or text file'}
              </Text>
              {fileName && (
                <Text style={[styles.uploadFileName, { color: colors.primary }]}>{fileName}</Text>
              )}
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.orText, { color: colors.textSecondary }]}>— OR paste your syllabus below —</Text>

        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.inputBg ?? colors.surface,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Paste syllabus content or key topics here..."
          placeholderTextColor={colors.textSecondary}
          multiline
          value={syllabusText}
          onChangeText={setSyllabusText}
        />

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 48 },
  subtitle: { fontSize: 16, marginTop: 8, marginBottom: 32, lineHeight: 22 },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { fontSize: 16, textAlign: 'center' },
  uploadFileName: { fontSize: 14, marginTop: 8, fontWeight: '600' },
  orText: { fontSize: 14, textAlign: 'center', marginVertical: 20 },
  textInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  continueButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
