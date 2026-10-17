import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, touchTarget, type } from '../theme';

type Props = {
  title: string;
  /** Show a back arrow on the left. */
  showBack?: boolean;
  /** Optional button on the right. */
  right?: React.ReactNode;
};

export function ScreenHeader({ title, showBack, right }: Props) {
  const navigation = useNavigation();

  return (
    <View style={styles.row}>
      {showBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.back}
        >
          <Feather name="arrow-left" size={26} color={colors.text} />
        </Pressable>
      )}
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: spacing.xs },
  back: { width: touchTarget, height: touchTarget, justifyContent: 'center', marginLeft: -spacing.xxs },
  title: { ...type.h1, flex: 1 },
});
