import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Broadcast {
  id: number;
  title: string;
  subject: string | null;
  chapter: string | null;
  event_date: string;
  event_type: string;
  description: string | null;
  student_count?: number;
}

type EventType = 'test' | 'assignment' | 'revision' | 'announcement';

// ---------------------------------------------------------------------------
// CalendarPicker (copied from goals/index.tsx pattern)
// ---------------------------------------------------------------------------

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

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
          <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700' }}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAYS.map(d => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const date = new Date(viewYear, viewMonth, day);
          const isSelected = value && date.toDateString() === value.toDateString();
          return (
            <TouchableOpacity
              key={`d-${day}`}
              style={{
                width: '14.28%',
                aspectRatio: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 100,
                backgroundColor: isSelected ? colors.primary : 'transparent',
              }}
              onPress={() => onChange(date)}
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

// ---------------------------------------------------------------------------
// Event type config
// ---------------------------------------------------------------------------

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'test', label: 'Test', color: '#EF4444' },
  { value: 'assignment', label: 'Assignment', color: '#F97316' },
  { value: 'revision', label: 'Revision', color: '#3B82F6' },
  { value: 'announcement', label: 'Announcement', color: '#22C55E' },
];

function eventTypeColor(type: string): string {
  return EVENT_TYPES.find(e => e.value === type)?.color ?? '#888';
}

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateString(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TeacherHomeScreen() {
  const { colors } = useThemeStore();
  const { user, profile, session } = useAuthStore();

  // Header
  const firstName = profile?.full_name
    ? profile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Teacher';

  const today = new Date();
  const dateString = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Teacher record
  const [teacherId, setTeacherId] = useState<number | null>(null);

  // Recent broadcasts
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(true);

  // Broadcast form visibility
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [eventType, setEventType] = useState<EventType>('test');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-populate title suggestion
  useEffect(() => {
    if (subject || chapter) {
      const typeLabel = EVENT_TYPES.find(e => e.value === eventType)?.label ?? eventType;
      const parts = [subject.trim(), chapter.trim() ? `Chapter ${chapter.trim()}` : ''].filter(Boolean);
      const suggestion = parts.length > 0 ? `${subject.trim()} ${typeLabel}: ${chapter.trim() ? 'Chapter ' + chapter.trim() : ''}`.trim() : typeLabel;
      setTitle(suggestion);
    }
  }, [eventType, subject, chapter]);

  // Fetch teacher ID and then broadcasts
  const fetchTeacherAndBroadcasts = useCallback(async () => {
    const currentUser = user ?? session?.user;
    if (!currentUser) return;

    try {
      const { data: teacher, error: teacherErr } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (teacherErr || !teacher) {
        setLoadingBroadcasts(false);
        return;
      }

      setTeacherId(teacher.id);

      // Fetch last 5 broadcasts
      const { data: broadcastRows, error: bcErr } = await supabase
        .from('teacher_broadcasts')
        .select('id, title, subject, chapter, event_date, event_type, description')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (bcErr) {
        console.error('Error fetching broadcasts:', bcErr.message);
        setLoadingBroadcasts(false);
        return;
      }

      // Fetch adjustment counts per broadcast
      const withCounts: Broadcast[] = await Promise.all(
        (broadcastRows ?? []).map(async (bc) => {
          const { count } = await supabase
            .from('broadcast_adjustments')
            .select('id', { count: 'exact', head: true })
            .eq('broadcast_id', bc.id);
          return { ...bc, student_count: count ?? 0 };
        })
      );

      setBroadcasts(withCounts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('fetchTeacherAndBroadcasts error:', msg);
    } finally {
      setLoadingBroadcasts(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchTeacherAndBroadcasts();
  }, [fetchTeacherAndBroadcasts]);

  const resetForm = () => {
    setEventType('test');
    setSubject('');
    setChapter('');
    setEventDate(null);
    setShowCalendar(false);
    setTitle('');
    setDescription('');
    setFormError(null);
  };

  const handleBroadcast = async () => {
    if (!teacherId) {
      setFormError('Teacher profile not found. Please try again.');
      return;
    }
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!eventDate) {
      setFormError('Please select an event date.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const isoDate = eventDate.toISOString().split('T')[0];

      // 1. Insert broadcast
      const { data: newBroadcast, error: insertErr } = await supabase
        .from('teacher_broadcasts')
        .insert({
          teacher_id: teacherId,
          title: title.trim(),
          subject: subject.trim() || null,
          chapter: chapter.trim() || null,
          event_date: isoDate,
          event_type: eventType,
          description: description.trim() || null,
        })
        .select('id')
        .single();

      if (insertErr || !newBroadcast) {
        throw new Error(insertErr?.message ?? 'Failed to create broadcast');
      }

      // 2. Call edge function to process adjustments with AI tips
      const currentSession = session ?? (await supabase.auth.getSession()).data.session;
      const token = currentSession?.access_token;

      if (token) {
        try {
          const fnRes = await fetch(
            'https://noivtbpsxdeuqgtlbvqe.supabase.co/functions/v1/process-broadcast',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                broadcast_id: newBroadcast.id,
                teacher_id: teacherId,
                supabase_token: token,
              }),
            }
          );

          if (!fnRes.ok) {
            const errText = await fnRes.text();
            console.error('Edge function error:', errText);
            // Non-fatal: broadcast was created, just note the issue
            Alert.alert(
              'Broadcast Sent',
              'Your broadcast was saved, but AI study tips could not be generated right now. Students will still see the announcement.',
              [{ text: 'OK' }]
            );
          }
        } catch (fnErr: unknown) {
          const msg = fnErr instanceof Error ? fnErr.message : 'Unknown';
          console.error('Edge function call failed:', msg);
          // Non-fatal
        }
      }

      resetForm();
      setShowForm(false);
      await fetchTeacherAndBroadcasts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send broadcast';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandText}>AXIOM</Text>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
          <Text style={styles.date}>{dateString}</Text>
        </View>

        {/* Broadcast Button / Toggle */}
        {!showForm ? (
          <TouchableOpacity
            style={styles.broadcastButton}
            onPress={() => setShowForm(true)}
            activeOpacity={0.8}
          >
            <View style={styles.broadcastButtonInner}>
              <Text style={styles.broadcastIcon}>📢</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.broadcastButtonTitle}>Broadcast to Class</Text>
                <Text style={styles.broadcastButtonSubtitle}>Share tests, assignments, or announcements</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#000" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            {/* Form header */}
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Broadcast</Text>
              <TouchableOpacity
                onPress={() => { resetForm(); setShowForm(false); }}
                style={styles.formCloseBtn}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Event type chips */}
            <Text style={styles.fieldLabel}>Event Type</Text>
            <View style={styles.chipRow}>
              {EVENT_TYPES.map(et => (
                <TouchableOpacity
                  key={et.value}
                  style={[
                    styles.chip,
                    eventType === et.value && { backgroundColor: et.color, borderColor: et.color },
                  ]}
                  onPress={() => setEventType(et.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    eventType === et.value && { color: '#fff', fontWeight: '700' },
                  ]}>
                    {et.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subject */}
            <Text style={styles.fieldLabel}>Subject</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Physics"
              placeholderTextColor={colors.textSecondary}
            />

            {/* Chapter */}
            <Text style={styles.fieldLabel}>Chapter</Text>
            <TextInput
              style={styles.textInput}
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. 5 or Thermodynamics"
              placeholderTextColor={colors.textSecondary}
            />

            {/* Event Date */}
            <Text style={styles.fieldLabel}>Event Date</Text>
            <TouchableOpacity
              style={[styles.textInput, styles.datePickerRow]}
              onPress={() => setShowCalendar(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={{ color: eventDate ? colors.text : colors.textSecondary, fontSize: 15 }}>
                {eventDate ? formatDate(eventDate) : 'Tap to select date'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            {showCalendar && (
              <View style={{ marginTop: 8, marginBottom: 4 }}>
                <CalendarPicker
                  value={eventDate}
                  onChange={(d) => { setEventDate(d); setShowCalendar(false); }}
                  colors={colors}
                />
              </View>
            )}

            {/* Title */}
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Physics Test: Chapter 5"
              placeholderTextColor={colors.textSecondary}
            />

            {/* Description */}
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Any additional notes for students..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Error */}
            {formError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.warning} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleBroadcast}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonIcon}>📢</Text>
                  <Text style={styles.submitButtonText}>Broadcast</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Broadcasts */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Recent Broadcasts</Text>

        {loadingBroadcasts ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : broadcasts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={36} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No broadcasts yet.{'\n'}Tap "Broadcast to Class" to get started.</Text>
          </View>
        ) : (
          broadcasts.map((bc) => (
            <View key={bc.id} style={styles.broadcastCard}>
              <View style={styles.broadcastCardTop}>
                <View style={[styles.eventBadge, { backgroundColor: eventTypeColor(bc.event_type) + '22', borderColor: eventTypeColor(bc.event_type) }]}>
                  <Text style={[styles.eventBadgeText, { color: eventTypeColor(bc.event_type) }]}>
                    {bc.event_type.charAt(0).toUpperCase() + bc.event_type.slice(1)}
                  </Text>
                </View>
                <Text style={styles.broadcastDate}>{formatDateString(bc.event_date)}</Text>
              </View>
              <Text style={styles.broadcastTitle}>{bc.title}</Text>
              {(bc.subject || bc.chapter) && (
                <Text style={styles.broadcastMeta}>
                  {[bc.subject, bc.chapter ? `Ch. ${bc.chapter}` : null].filter(Boolean).join(' · ')}
                </Text>
              )}
              <View style={styles.broadcastCardBottom}>
                <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.studentCount}>{bc.student_count ?? 0} students notified</Text>
              </View>
            </View>
          ))
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Coming soon')} activeOpacity={0.7}>
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="document-text" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Share Study Notes</Text>
              <Text style={styles.actionSubtitle}>Upload and share with your class</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Coming soon')} activeOpacity={0.7}>
          <View style={styles.actionCardLeft}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="help-circle" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Assign Practice Quiz</Text>
              <Text style={styles.actionSubtitle}>Create quizzes for your students</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
      paddingBottom: 48,
    },
    header: {
      marginTop: 8,
      marginBottom: 24,
    },
    brandText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 2,
      marginBottom: 6,
    },
    greeting: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    date: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    // Broadcast button (collapsed)
    broadcastButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      marginBottom: 4,
    },
    broadcastButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
      gap: 14,
    },
    broadcastIcon: {
      fontSize: 28,
    },
    broadcastButtonTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: '#000',
    },
    broadcastButtonSubtitle: {
      fontSize: 12,
      color: '#000',
      opacity: 0.6,
      marginTop: 2,
    },
    // Form card (expanded)
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    formCloseBtn: {
      padding: 4,
    },
    fieldLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 6,
      marginTop: 12,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 13,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    datePickerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    multilineInput: {
      minHeight: 80,
      paddingTop: 13,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.warning + '18',
      borderRadius: 8,
      padding: 10,
      marginTop: 12,
    },
    errorText: {
      color: colors.warning,
      fontSize: 13,
      flex: 1,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      marginTop: 18,
      gap: 8,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonIcon: {
      fontSize: 18,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#000',
    },
    // Section
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
    },
    loadingRow: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 28,
      alignItems: 'center',
      gap: 10,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    // Broadcast cards
    broadcastCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    broadcastCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    eventBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    eventBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    broadcastDate: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    broadcastTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    broadcastMeta: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    broadcastCardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    studentCount: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    // Quick actions
    actionCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    actionCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    actionIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    actionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    actionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
