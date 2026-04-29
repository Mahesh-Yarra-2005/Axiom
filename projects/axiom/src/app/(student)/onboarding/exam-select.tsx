import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const EXAMS = [
  { id: 'jee_main', label: 'JEE Main', icon: '⚡' },
  { id: 'jee_advanced', label: 'JEE Advanced', icon: '🔬' },
  { id: 'neet', label: 'NEET', icon: '🩺' },
  { id: 'cbse_12', label: 'CBSE Board 12th', icon: '📖' },
  { id: 'cbse_10', label: 'CBSE Board 10th', icon: '📝' },
  { id: 'college', label: 'College / University', icon: '🎓' },
  { id: 'custom', label: 'Custom', icon: '✏️' },
];

const COLLEGE_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const COLLEGE_BRANCHES = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Mining Engineering',
  'Metallurgical & Materials Engineering',
  'Biotechnology',
  'Biomedical Engineering',
  'Electronics & Telecommunication Engineering',
  'Data Science & Artificial Intelligence',
  'Mathematics & Computing',
  'Engineering Physics',
  'Production & Industrial Engineering',
  'Aerospace Engineering',
  'Architecture',
  'Other',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarPicker({ value, onChange, colors }: {
  value: Date | null;
  onChange: (d: Date) => void;
  colors: any;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAYS.map(d => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const date = new Date(viewYear, viewMonth, day);
          const isPast = date < today && !(date.toDateString() === today.toDateString());
          const isSelected = value && date.toDateString() === value.toDateString();
          return (
            <TouchableOpacity
              key={day}
              style={{
                width: '14.28%',
                aspectRatio: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 100,
                backgroundColor: isSelected ? colors.primary : 'transparent',
                opacity: isPast ? 0.3 : 1,
              }}
              onPress={() => !isPast && onChange(date)}
              disabled={isPast}
            >
              <Text style={{
                color: isSelected ? '#000' : colors.text,
                fontSize: 14,
                fontWeight: isSelected ? '700' : '400',
              }}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function ExamSelectScreen() {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { syllabus_text } = useLocalSearchParams<{ syllabus_text?: string }>();
  const { user, session } = useAuthStore();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // College-specific state
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showBranchPicker, setShowBranchPicker] = useState(false);

  const currentUser = user ?? session?.user;

  const handleGenerate = async () => {
    if (!selectedExam || !currentUser) {
      Alert.alert('Error', 'Please select an exam.');
      return;
    }
    setIsSaving(true);
    try {
      // Convert date to ISO format for Supabase
      const isoDate = selectedDate ? selectedDate.toISOString().split('T')[0] : null;

      const gradeLevel = selectedExam === 'college' && selectedBranch
        ? `${selectedYear} - ${selectedBranch}`
        : null;

      const { error } = await supabase
        .from('students')
        .update({
          exam_type: selectedExam,
          target_date: isoDate,
          grade_level: gradeLevel,
        })
        .eq('user_id', currentUser.id);
      if (error) throw error;

      router.push({
        pathname: '/(student)/onboarding/study-plan',
        params: {
          syllabus_text: syllabus_text || '',
          exam_type: selectedExam,
          target_date: isoDate || '',
          college_year: selectedYear || '',
          college_branch: selectedBranch || '',
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (d: Date) =>
    `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 24 }}>
          What are you preparing for?
        </Text>
        <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8, marginBottom: 32 }}>
          Select your target exam
        </Text>

        {/* Exam grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {EXAMS.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={{
                width: '48%',
                backgroundColor: selectedExam === exam.id ? colors.card : colors.surface,
                borderRadius: 14,
                padding: 20,
                alignItems: 'center',
                marginBottom: 14,
                borderWidth: 2,
                borderColor: selectedExam === exam.id ? colors.primary : colors.border,
              }}
              onPress={() => setSelectedExam(exam.id)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{exam.icon}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
                {exam.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* College pickers — shown only when 'college' is selected */}
        {selectedExam === 'college' && (
          <View style={{ marginTop: 8, marginBottom: 8 }}>
            {/* Year picker */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 8 }}>
                Year
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: showYearPicker ? colors.primary : colors.border,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowYearPicker(v => !v);
                  setShowBranchPicker(false);
                }}
              >
                <Text style={{ fontSize: 15, color: selectedYear ? colors.text : colors.textSecondary }}>
                  {selectedYear || 'Select year'}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 16 }}>
                  {showYearPicker ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {showYearPicker && (
                <View style={{
                  marginTop: 4,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: 'hidden',
                }}>
                  {COLLEGE_YEARS.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={{
                        padding: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        backgroundColor: selectedYear === year ? colors.primary + '20' : 'transparent',
                      }}
                      onPress={() => {
                        setSelectedYear(year);
                        setShowYearPicker(false);
                      }}
                    >
                      <Text style={{
                        fontSize: 15,
                        color: selectedYear === year ? colors.primary : colors.text,
                        fontWeight: selectedYear === year ? '600' : '400',
                      }}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Branch picker */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 8 }}>
                Branch
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: showBranchPicker ? colors.primary : colors.border,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowBranchPicker(v => !v);
                  setShowYearPicker(false);
                }}
              >
                <Text style={{ fontSize: 15, color: selectedBranch ? colors.text : colors.textSecondary, flex: 1, marginRight: 8 }}>
                  {selectedBranch || 'Select branch'}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 16 }}>
                  {showBranchPicker ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {showBranchPicker && (
                <ScrollView
                  style={{
                    marginTop: 4,
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    maxHeight: 260,
                  }}
                  nestedScrollEnabled
                >
                  {COLLEGE_BRANCHES.map((branch, idx) => (
                    <TouchableOpacity
                      key={branch}
                      style={{
                        padding: 14,
                        borderBottomWidth: idx < COLLEGE_BRANCHES.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                        backgroundColor: selectedBranch === branch ? colors.primary + '20' : 'transparent',
                      }}
                      onPress={() => {
                        setSelectedBranch(branch);
                        setShowBranchPicker(false);
                      }}
                    >
                      <Text style={{
                        fontSize: 15,
                        color: selectedBranch === branch ? colors.primary : colors.text,
                        fontWeight: selectedBranch === branch ? '600' : '400',
                      }}>
                        {branch}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* Date picker */}
        <View style={{ marginTop: 24, marginBottom: 32 }}>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 10 }}>
            Tentative exam date (optional)
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: showCalendar ? colors.primary : colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onPress={() => setShowCalendar(v => !v)}
          >
            <Text style={{ fontSize: 15, color: selectedDate ? colors.text : colors.textSecondary }}>
              {selectedDate ? formatDate(selectedDate) : 'Pick a date'}
            </Text>
            <Text style={{ color: colors.primary, fontSize: 18 }}>📅</Text>
          </TouchableOpacity>

          {showCalendar && (
            <View style={{ marginTop: 12 }}>
              <CalendarPicker
                value={selectedDate}
                onChange={(d) => { setSelectedDate(d); setShowCalendar(false); }}
                colors={colors}
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 32,
            opacity: (selectedExam && !isSaving) ? 1 : 0.5,
          }}
          onPress={handleGenerate}
          activeOpacity={0.8}
          disabled={!selectedExam || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>Generate Study Plan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
