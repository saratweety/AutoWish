import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLottie } from '../components/AppLottie';
import { BounceButton } from '../components/BounceButton';
import { colors, screenPadding, spacing, type } from '../theme';
import { DailyGameCard } from '../components/DailyGameCard';
import { HomeHeader } from '../components/HomeHeader';

// Shown inside the Home tab when no special days are saved.
export default function HomeEmptyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <HomeHeader />
        <View style={styles.center}>
          <View style={styles.circle}>
            <AppLottie source={require('../../assets/animations/autowish_empty_state.json')} loop style={styles.animation} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            No special days yet
          </Text>
          <Text style={styles.text}>{"Add your first special day and we'll remind you before it comes."}</Text>
        </View>
        <BounceButton title="+ Add your first special day" onPress={() => navigation.navigate('AddSpecialDay')} />
        <View style={styles.game}>
          <DailyGameCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: screenPadding + spacing.xs, paddingTop: spacing.xs, gap: spacing.xs },
  center: { alignItems: 'center', marginBottom: spacing.xl },
  circle: { width: 260, height: 260, borderRadius: 130, backgroundColor: colors.blueMist, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  animation: { width: 300, height: 300 },
  title: { ...type.h1, textAlign: 'center', marginBottom: spacing.xs },
  text: { ...type.bodyMuted, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  game: { marginTop: spacing.md },
});
