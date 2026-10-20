import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COUNTRIES, country, searchCountries, type Country } from '../data/countries';
import { SlideUpSheet } from './SlideUpSheet';
import { colors, fonts, fontSizes, radius, spacing, type } from '../theme';

// Tall enough to show several countries, short enough to leave the sheet on screen.
const LIST_HEIGHT = 340;
const ROW_HEIGHT = 56;

/**
 * The "+92" button that sits in front of a WhatsApp number box, and the country
 * list it opens.
 *
 * Returns the two pieces separately, because the list scrolls: put `field` inside
 * the number box, and `sheet` at the screen's root, OUTSIDE the ScrollView. A
 * scrolling list inside a ScrollView breaks both of them.
 */
export function useCountryCodeField({ iso, onChange }: { iso: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const chosen = country(iso);
  const list = searchCountries(query);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const pick = (c: Country) => {
    onChange(c.iso);
    close();
  };

  const field = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Country code, plus ${chosen.dial}, ${chosen.name}. Tap to change`}
      onPress={() => setOpen(true)}
      style={styles.button}
    >
      <Text style={styles.code}>+{chosen.dial}</Text>
      <Feather name="chevron-down" size={16} color={colors.textMuted} />
    </Pressable>
  );

  const sheet = (
    <SlideUpSheet visible={open} onClose={close} dragAnywhere={false}>
      <View style={styles.sheet}>
        <Text style={[type.h2, styles.center]}>Country</Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.greyBlue} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search country or code"
            placeholderTextColor={colors.greyBlue}
            autoCorrect={false}
            accessibilityLabel="Search country or code"
            style={styles.searchInput}
          />
        </View>
        {list.length === 0 ? (
          // Takes up the same space the list would, so the sheet doesn't jump about
          // while someone is typing.
          <View style={[styles.list, styles.empty]}>
            <Feather name="search" size={28} color={colors.greyBlue} />
            <Text style={[type.h3, styles.center]}>No country found</Text>
            <Text style={[type.bodyMuted, styles.center]}>{`Nothing matches "${query.trim()}". Check the spelling, or search by code like 92.`}</Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(c) => c.iso}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={12}
            // Every row is the same height, so the list can jump straight to any position.
            getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
            initialScrollIndex={query ? 0 : Math.max(0, COUNTRIES.findIndex((c) => c.iso === chosen.iso))}
            renderItem={({ item }) => {
              const selected = item.iso === chosen.iso;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.name}, plus ${item.dial}`}
                  onPress={() => pick(item)}
                  style={styles.row}
                >
                  <Text style={[styles.rowName, selected && styles.rowNameSelected]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowDial}>+{item.dial}</Text>
                  {selected && <Feather name="check" size={18} color={colors.blue} />}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </SlideUpSheet>
  );

  return { field, sheet };
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, minHeight: 44 },
  code: { fontFamily: fonts.body, fontSize: fontSizes.lg, color: colors.text },
  sheet: { alignSelf: 'stretch', gap: spacing.xs, paddingTop: spacing.md },
  center: { textAlign: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 48,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.cardLarge,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.text, paddingVertical: spacing.xs },
  list: { height: LIST_HEIGHT },
  empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  rowName: { ...type.body, flex: 1 },
  rowNameSelected: { fontFamily: fonts.bodyBold },
  rowDial: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.textMuted },
});
