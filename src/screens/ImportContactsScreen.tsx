import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { BounceButton } from '../components/BounceButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { OCCASION_LABELS } from '../data/labels';
import type { RootScreenProps } from '../navigation/types';
import { ContactDay, loadContactDays } from '../services/contacts';
import { formatShortDate } from '../services/dates';
import { contactsAllowed, requestContacts } from '../services/permissions';
import { newId, useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, screenPadding, spacing, touchTarget, type } from '../theme';
import type { SpecialDay } from '../types';

type Status = 'loading' | 'no_permission' | 'error' | 'ready';
type ReadResult = { status: 'ready'; items: ContactDay[] } | { status: 'no_permission' | 'error' };

/** Asks for contacts permission if needed, then reads the birthdays. */
async function readContacts(): Promise<ReadResult> {
  try {
    const allowed = (await contactsAllowed()) || (await requestContacts());
    if (!allowed) return { status: 'no_permission' };
    return { status: 'ready', items: await loadContactDays() };
  } catch {
    return { status: 'error' };
  }
}

export default function ImportContactsScreen({ navigation }: RootScreenProps<'ImportContacts'>) {
  const { specialDays, settings, addMany } = useApp();
  const [status, setStatus] = useState<Status>('loading');
  const [items, setItems] = useState<ContactDay[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Already in AutoWish: same name, occasion and date.
  const alreadyAdded = useCallback(
    (c: ContactDay) =>
      specialDays.some((d) => d.name === c.name && d.occasion === c.occasion && d.month === c.month && d.day === c.day),
    [specialDays],
  );
  const canImport = (c: ContactDay) => c.phone !== null && !alreadyAdded(c);

  // Shows the result of reading contacts. Everything that can be imported starts ticked.
  const apply = (result: ReadResult) => {
    setStatus(result.status);
    if (result.status !== 'ready') return;
    setItems(result.items);
    setSelected(new Set(result.items.filter((c) => c.phone !== null && !alreadyAdded(c)).map((c) => c.key)));
  };

  // Read contacts once when the screen opens.
  useEffect(() => {
    readContacts().then(apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setStatus('loading');
    readContacts().then(apply);
  };

  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const importSelected = async () => {
    const now = new Date().toISOString();
    const days: SpecialDay[] = items
      .filter((c) => selected.has(c.key) && canImport(c))
      .map((c) => ({
        id: newId(),
        name: c.name,
        phone: c.phone!,
        occasion: c.occasion,
        month: c.month,
        day: c.day,
        year: c.year,
        relationship: 'friend',
        photoUri: c.photoUri,
        remindDaysBefore: settings.defaultRemindDaysBefore,
        createdAt: now,
      }));
    await addMany(days);
    navigation.goBack();
  };

  const count = items.filter((c) => selected.has(c.key) && canImport(c)).length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <ScreenHeader title="Import birthdays" showBack />
      </View>

      {status === 'loading' && <ActivityIndicator color={colors.blue} style={styles.center} />}

      {status === 'no_permission' && (
        <Message
          title="AutoWish needs your contacts"
          text="Allow access to contacts so we can find the birthdays saved in them. They stay on your phone."
          action="Open phone settings"
          onAction={() => Linking.openSettings()}
          secondary="Try again"
          onSecondary={retry}
        />
      )}

      {status === 'error' && (
        <Message
          title="Couldn't read your contacts"
          text="Something went wrong while reading contacts. Please try again."
          action="Try again"
          onAction={retry}
        />
      )}

      {status === 'ready' && items.length === 0 && (
        <Message
          title="No birthdays found"
          text="None of your contacts have a birthday saved. You can add special days yourself on Home."
          action="Back to Home"
          onAction={() => navigation.goBack()}
        />
      )}

      {status === 'ready' && items.length > 0 && (
        <>
          <FlatList
            data={items}
            keyExtractor={(c) => c.key}
            contentContainerStyle={styles.list}
            ListHeaderComponent={<Text style={type.bodyMuted}>Pick who to add. You can edit each one later.</Text>}
            renderItem={({ item }) => {
              const added = alreadyAdded(item);
              const disabled = !canImport(item);
              const checked = selected.has(item.key) && !disabled;
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked, disabled }}
                  accessibilityLabel={`${item.name}, ${OCCASION_LABELS[item.occasion]}`}
                  disabled={disabled}
                  onPress={() => toggle(item.key)}
                  style={[styles.row, disabled && styles.rowDisabled]}
                >
                  <Avatar name={item.name} photoUri={item.photoUri} size={44} />
                  <View style={styles.rowText}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.meta}>
                      {OCCASION_LABELS[item.occasion]} · {formatShortDate(new Date(2000, item.month - 1, item.day))}
                      {added ? ' · Already added' : item.phone === null ? ' · No phone number' : ''}
                    </Text>
                  </View>
                  {!disabled && (
                    <Feather name={checked ? 'check-circle' : 'circle'} size={24} color={checked ? colors.blue : colors.greyBlue} />
                  )}
                </Pressable>
              );
            }}
          />
          <View style={styles.footer}>
            <BounceButton
              title={count === 1 ? 'Import 1 special day' : `Import ${count} special days`}
              disabled={count === 0}
              onPress={importSelected}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

type MessageProps = {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
  secondary?: string;
  onSecondary?: () => void;
};

function Message({ title, text, action, onAction, secondary, onSecondary }: MessageProps) {
  return (
    <View style={styles.message}>
      <Text style={[type.h2, styles.textCenter]}>{title}</Text>
      <Text style={[type.bodyMuted, styles.textCenter]}>{text}</Text>
      <BounceButton title={action} onPress={onAction} style={styles.messageButton} />
      {secondary && <BounceButton title={secondary} variant="text" onPress={onSecondary} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: screenPadding + spacing.xs },
  center: { flex: 1 },
  list: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.xs },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.sm,
    minHeight: touchTarget + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowDisabled: { opacity: 0.55 },
  rowText: { flex: 1 },
  name: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.md, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.textMuted },
  footer: { paddingHorizontal: screenPadding + spacing.xs, paddingTop: spacing.xs, paddingBottom: spacing.xs },
  message: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.sm },
  messageButton: { marginTop: spacing.md },
  textCenter: { textAlign: 'center' },
});
