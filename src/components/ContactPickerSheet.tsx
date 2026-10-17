import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { ContactPhone, loadContactPhones } from '../services/contacts';
import { contactsAllowed, requestContacts } from '../services/permissions';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';
import { Avatar } from './Avatar';
import { BounceButton } from './BounceButton';
import { SlideUpSheet } from './SlideUpSheet';

type Status = 'loading' | 'no_permission' | 'error' | 'ready';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** phone is digits with the country code, e.g. "923001234567". */
  onPick: (contact: { name: string; phone: string }) => void;
};

/** "923001234567" -> "+92 300 1234567" */
function showNumber(phone: string) {
  const m = phone.match(/^92(\d{3})(\d+)$/);
  return m ? `+92 ${m[1]} ${m[2]}` : `+${phone}`;
}

/**
 * A bottom sheet listing the phone's contacts with a search box.
 * Asks for contacts permission the first time it opens. Render it at the screen root.
 */
export function ContactPickerSheet({ visible, onClose, onPick }: Props) {
  const { height } = useWindowDimensions();
  const [status, setStatus] = useState<Status>('loading');
  const [items, setItems] = useState<ContactPhone[]>([]);
  const [search, setSearch] = useState('');
  const [attempt, setAttempt] = useState(0);

  // Read contacts each time the sheet opens, so new contacts show up.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const allowed = (await contactsAllowed()) || (await requestContacts());
        if (cancelled) return;
        if (!allowed) return setStatus('no_permission');
        const list = await loadContactPhones();
        if (cancelled) return;
        setItems(list);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, attempt]);

  const close = () => {
    setSearch('');
    onClose();
  };

  const retry = () => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  };

  // Search by name or by digits in the number.
  const query = search.trim().toLowerCase();
  const digits = query.replace(/\D/g, '');
  const shown = query
    ? items.filter((c) => c.name.toLowerCase().includes(query) || (digits.length > 2 && c.phone.includes(digits)))
    : items;

  return (
    <SlideUpSheet visible={visible} onClose={close}>
      <View style={[styles.body, { height: height * 0.75 }]}>
        <Text style={[type.h2, styles.title]}>Pick a contact</Text>

        {status === 'loading' && <ActivityIndicator color={colors.blue} style={styles.center} />}

        {status === 'no_permission' && (
          <Message
            title="AutoWish needs your contacts"
            text="Allow access to contacts to pick a number. They stay on your phone."
            action="Open phone settings"
            onAction={() => Linking.openSettings()}
            secondary="Try again"
            onSecondary={retry}
          />
        )}

        {status === 'error' && (
          <Message title="Couldn't read your contacts" text="Something went wrong. Please try again." action="Try again" onAction={retry} />
        )}

        {status === 'ready' && (
          <>
            <View style={styles.search}>
              <Feather name="search" size={20} color={colors.greyBlue} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name or number"
                placeholderTextColor={colors.greyBlue}
                accessibilityLabel="Search contacts"
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>
            <FlatList
              data={shown}
              keyExtractor={(c) => c.key}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={[type.bodyMuted, styles.empty]}>
                  {items.length === 0 ? 'None of your contacts have a phone number saved.' : 'No contacts match your search.'}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${showNumber(item.phone)}`}
                  onPress={() => {
                    onPick({ name: item.name, phone: item.phone });
                    close();
                  }}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  <Avatar name={item.name} photoUri={item.photoUri} size={44} />
                  <View style={styles.rowText}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={type.caption} numberOfLines={1}>
                      {showNumber(item.phone)}
                      {item.label ? ` · ${item.label}` : ''}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.greyBlue} />
                </Pressable>
              )}
            />
          </>
        )}
      </View>
    </SlideUpSheet>
  );
}

type MessageProps = { title: string; text: string; action: string; onAction: () => void; secondary?: string; onSecondary?: () => void };

function Message({ title, text, action, onAction, secondary, onSecondary }: MessageProps) {
  return (
    <View style={styles.message}>
      <Text style={[type.h3, styles.centerText]}>{title}</Text>
      <Text style={[type.bodyMuted, styles.centerText]}>{text}</Text>
      <BounceButton title={action} onPress={onAction} />
      {secondary && onSecondary && <BounceButton title={secondary} variant="text" onPress={onSecondary} />}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.xs },
  title: { textAlign: 'center' },
  center: { marginTop: spacing.xxl },
  search: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.text, paddingVertical: spacing.xs },
  list: { paddingBottom: spacing.lg },
  empty: { textAlign: 'center', marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.card },
  pressed: { backgroundColor: colors.surfaceMuted },
  rowText: { flex: 1 },
  name: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  message: { gap: spacing.sm, marginTop: spacing.xl },
  centerText: { textAlign: 'center' },
});
