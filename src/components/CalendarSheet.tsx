import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { format, getDaysInMonth, startOfDay } from 'date-fns';
import React, { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { dateInYear, formatClock, nextOccurrence } from '../services/dates';
import { useApp } from '../state/AppContext';
import { colors, fonts, fontSizes, radius, spacing, touchTarget, type } from '../theme';
import { AppLottie } from './AppLottie';
import { BounceButton } from './BounceButton';
import { ClockPicker } from './ClockSheet';
import { SlideUpSheet } from './SlideUpSheet';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const THIS_YEAR = new Date().getFullYear();
// Birth and wedding years for the wheel: 1900 up to this year.
const PAST_YEARS = Array.from({ length: THIS_YEAR - 1899 }, (_, i) => 1900 + i);
// The year wheel: 5 rows show at a time, the middle one is the picked year.
const ROW = 48;
const VISIBLE_ROWS = 5;
const PRESET_TIMES = [
  { value: '00:00', label: 'Midnight · 12:00 AM' },
  { value: '09:00', label: '9:00 AM' },
];

export type CalendarPick = { day: number; month: number; year?: number; time?: string };

export type CalendarOptions = {
  title: string;
  subtitle: string;
  day?: number;
  month?: number;
  year?: number;
  /** Shows the "I know the year" switch (birthdays, anniversaries). Without it the year is always part of the date. */
  yearOptional?: boolean;
  /** "HH:mm". When given, the "Send at" choices show. */
  time?: string;
  /** The line above the clock for "Other", e.g. "Ahmed will get your wish at". */
  timeTitle?: string;
  /** Days before this one can't be picked (a wish can't go out in the past). */
  notBefore?: Date;
  /** Leave this special day's dot out, e.g. the one being edited. */
  skipDayId?: string;
  /** Badge in the year wheel, e.g. "Turns 30!". `years` is the age on the next occurrence. */
  yearBadge?: (years: number) => string;
  /** Line under "I know the year" once a year is set, e.g. "Born 17 Oct 1996 · Ahmed turns 30". */
  yearLine?: (date: string, years: number) => string;
  onDone: (pick: CalendarPick) => void;
};

/**
 * The AutoWish calendar in a bottom sheet: month grid, "I know the year" and "Send at".
 *
 * Usage: const calendar = useCalendarSheet(); calendar.open({ title, subtitle, ..., onDone });
 * and render {calendar.sheet} at the end of the screen.
 */
export function useCalendarSheet() {
  const [options, setOptions] = useState<CalendarOptions | null>(null);
  const [visible, setVisible] = useState(false);
  // A new key each time, so every opening starts from the value passed in.
  const [opened, setOpened] = useState(0);

  const open = (o: CalendarOptions) => {
    setOptions(o);
    setOpened((n) => n + 1);
    setVisible(true);
  };

  // The options stay after closing so the sheet can slide away with its content.
  const sheet = options && <CalendarSheet key={opened} options={options} visible={visible} onClose={() => setVisible(false)} />;
  return { open, sheet };
}

/** The year a month next comes round in, for days saved without a year. */
function occurrenceYear(month: number) {
  return month < new Date().getMonth() + 1 ? THIS_YEAR + 1 : THIS_YEAR;
}

/** "Ammi", "Ammi and Abbu", "Ali, Sara and Usman" */
function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

type SheetProps = { options: CalendarOptions; visible: boolean; onClose: () => void };

function CalendarSheet({ options, visible, onClose }: SheetProps) {
  const { specialDays, settings } = useApp();
  const { height } = useWindowDimensions();
  const today = startOfDay(new Date());
  const notBefore = options.notBefore && startOfDay(options.notBefore);

  const [yearKnown, setYearKnown] = useState(!options.yearOptional || options.year !== undefined);
  const [picked, setPicked] = useState(
    options.day && options.month ? { day: options.day, month: options.month, year: options.year } : null,
  );
  const [viewMonth, setViewMonth] = useState(options.month ?? (notBefore ?? today).getMonth() + 1);
  const [viewYear, setViewYear] = useState(
    options.year ?? (options.yearOptional ? occurrenceYear(viewMonth) : (notBefore ?? today).getFullYear()),
  );
  const [time, setTime] = useState(options.time);
  const [choosingMonth, setChoosingMonth] = useState(false);
  // The year in the "Pick a year" wheel while it's open, or null when it's closed.
  const [wheelYear, setWheelYear] = useState<number | null>(null);
  // "Other" swaps the calendar for the clock in the same sheet.
  const [clockOpen, setClockOpen] = useState(false);

  const monthIndex = (y: number, m: number) => y * 12 + m;
  const beforeLimit = (y: number, m: number) =>
    notBefore !== undefined && monthIndex(y, m) < monthIndex(notBefore.getFullYear(), notBefore.getMonth() + 1);

  // Monday comes first. Without a year, February always shows the 29th (leap-year birthdays).
  const daysInView = !yearKnown && viewMonth === 2 ? 29 : getDaysInMonth(new Date(viewYear, viewMonth - 1, 1));
  const offset = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInView }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  // Coral dots for saved special days this month, a blue dot for the user's own birthday.
  const coralDays = new Map<number, string[]>();
  for (const d of specialDays) {
    if (d.id === options.skipDayId) continue;
    const date = dateInYear(d, viewYear);
    if (date.getMonth() + 1 !== viewMonth) continue;
    coralDays.set(date.getDate(), [...(coralDays.get(date.getDate()) ?? []), d.name]);
  }
  const blueDay = settings.userBirthday?.month === viewMonth ? settings.userBirthday.day : undefined;

  const step = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) [m, y] = [12, y - 1];
    if (m > 12) [m, y] = [1, y + 1];
    setViewMonth(m);
    setViewYear(yearKnown ? y : occurrenceYear(m));
  };

  const chooseYear = (y: number) => {
    setViewYear(y);
    // Keep the picked day, now in that year (29 Feb becomes 28 Feb if needed).
    if (picked) setPicked({ ...picked, year: y, day: Math.min(picked.day, getDaysInMonth(new Date(y, picked.month - 1, 1))) });
  };

  const switchYear = (on: boolean) => {
    setYearKnown(on);
    if (on) {
      // Open the year wheel. Without a saved year, start around a typical age.
      setChoosingMonth(false);
      setWheelYear(picked?.year ?? (options.year ?? THIS_YEAR - 25));
    } else {
      setWheelYear(null);
      setViewYear(occurrenceYear(viewMonth));
      if (picked) setPicked({ ...picked, year: undefined });
    }
  };

  // How old (or how many years) on the next time the day comes round.
  const nextYear = picked ? nextOccurrence({ occasion: 'birthday', month: picked.month, day: picked.day }).getFullYear() : occurrenceYear(viewMonth);
  const yearsOn = (y: number) => nextYear - y;
  const plural = (n: number) => `${n} ${n === 1 ? 'year' : 'years'}`;
  const yearCardHint =
    yearKnown && picked?.year
      ? (options.yearLine ?? ((date, n) => `${date} · ${plural(n)}`))(format(new Date(picked.year, picked.month - 1, picked.day), 'd MMM yyyy'), yearsOn(picked.year))
      : yearKnown
        ? 'Pick a day, then tap here to change the year'
        : "Not sure? We'll remind you every year";

  // The date the "Set" button names. Without a year: the next time that day comes round.
  const pickedDate = picked
    ? yearKnown && picked.year
      ? new Date(picked.year, picked.month - 1, picked.day)
      : nextOccurrence({ occasion: 'birthday', month: picked.month, day: picked.day })
    : null;
  const doneTitle = pickedDate
    ? `Set ${format(pickedDate, yearKnown && options.yearOptional ? 'd MMM yyyy' : 'EEE, d MMM')}${time ? ` · ${formatClock(time)}` : ''}`
    : 'Pick a day';
  // The year shows in the year card for birthdays; elsewhere only when it's not this year.
  const showPillYear = !options.yearOptional && viewYear !== THIS_YEAR;
  const isPreset = PRESET_TIMES.some((p) => p.value === time);

  const done = () => {
    if (!picked) return;
    options.onDone({ day: picked.day, month: picked.month, year: yearKnown ? picked.year : undefined, time });
    onClose();
  };

  return (
    <SlideUpSheet visible={visible} onClose={onClose} dragAnywhere={false}>
      {clockOpen && time !== undefined ? (
        <ClockPicker
          title={options.timeTitle ?? 'Your wish goes out at'}
          value={time}
          wishHint
          onDone={(hhmm) => {
            setTime(hhmm);
            setClockOpen(false);
          }}
          onCancel={() => setClockOpen(false)}
        />
      ) : (
      <ScrollView style={[styles.scroll, { maxHeight: height * 0.86 }]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <AppLottie source={require('../../assets/animations/autowish_reminder_gift.json')} delayMs={300} style={styles.gift} />
          <View style={styles.titleText}>
            <Text style={styles.title} accessibilityRole="header">
              {options.title}
            </Text>
            <Text style={styles.subtitle}>{options.subtitle}</Text>
          </View>
        </View>

        <View style={styles.calendarArea}>
          <View style={styles.monthRow}>
            <RoundButton icon="chevron-left" label="Previous month" disabled={beforeLimit(viewYear, viewMonth - 1)} onPress={() => step(-1)} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${MONTHS[viewMonth - 1]}${showPillYear ? ` ${viewYear}` : ''}. Choose month`}
              onPress={() => setChoosingMonth(!choosingMonth)}
              style={styles.monthPill}
            >
              <Text style={styles.monthText}>
                {MONTHS[viewMonth - 1]}
                {showPillYear ? ` ${viewYear}` : ''}
              </Text>
              <Feather name={choosingMonth ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text} />
            </Pressable>
            <RoundButton icon="chevron-right" label="Next month" onPress={() => step(1)} />
          </View>

          {choosingMonth ? (
            <View style={styles.chooser}>
              <View style={styles.monthGrid}>
                {MONTHS.map((m, i) => {
                  const disabled = beforeLimit(viewYear, i + 1);
                  return (
                    <Pressable
                      key={m}
                      accessibilityRole="button"
                      accessibilityLabel={m}
                      accessibilityState={{ selected: i + 1 === viewMonth, disabled }}
                      disabled={disabled}
                      onPress={() => {
                        setViewMonth(i + 1);
                        if (!yearKnown) setViewYear(occurrenceYear(i + 1));
                        setChoosingMonth(false);
                      }}
                      style={[styles.monthCell, i + 1 === viewMonth && styles.chipOn, disabled && styles.disabled]}
                    >
                      <Text style={styles.chipText}>{m.slice(0, 3)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.week}>
                {WEEKDAYS.map((d, i) => (
                  <Text key={i} style={styles.weekday}>
                    {d}
                  </Text>
                ))}
              </View>
              <View style={styles.grid}>
                {cells.map((d, i) => {
                  if (d === null) return <View key={`empty-${i}`} style={styles.cell} />;
                  const selected = picked?.month === viewMonth && picked.day === d && (!yearKnown || picked.year === viewYear);
                  const isToday = viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1 && d === today.getDate();
                  const disabled = notBefore !== undefined && new Date(viewYear, viewMonth - 1, d) < notBefore;
                  const names = coralDays.get(d);
                  return (
                    <Pressable
                      key={d}
                      accessibilityRole="button"
                      accessibilityLabel={`${d} ${MONTHS[viewMonth - 1]}${isToday ? ', today' : ''}${names ? `, ${joinNames(names)}` : ''}`}
                      accessibilityState={{ selected, disabled }}
                      disabled={disabled}
                      onPress={() => setPicked({ day: d, month: viewMonth, year: yearKnown ? viewYear : undefined })}
                      style={styles.cell}
                    >
                      <View style={[styles.day, isToday && !selected && styles.today, selected && styles.daySelected]}>
                        <Text style={[styles.dayText, selected && styles.dayTextSelected, disabled && styles.dayTextDisabled]}>{d}</Text>
                      </View>
                      {selected && (
                        <MaterialCommunityIcons name="star-four-points" size={18} color={colors.sparkle} style={styles.sparkle} />
                      )}
                      <View style={styles.dots}>
                        {names && <View style={[styles.dot, styles.dotCoral]} />}
                        {blueDay === d && <View style={[styles.dot, styles.dotBlue]} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {wheelYear !== null && (
            <View style={styles.yearPopup}>
              <View style={styles.yearPopupHeader}>
                <Text style={styles.yearPopupTitle}>Pick a year</Text>
                {yearsOn(wheelYear) > 0 && (
                  <Text style={styles.badge}>{options.yearBadge?.(yearsOn(wheelYear)) ?? `${plural(yearsOn(wheelYear))}!`}</Text>
                )}
              </View>
              <YearWheel years={PAST_YEARS} start={Math.max(0, PAST_YEARS.indexOf(wheelYear))} onChange={setWheelYear} />
              <BounceButton
                title="Done"
                onPress={() => {
                  chooseYear(wheelYear);
                  setViewYear(wheelYear);
                  setWheelYear(null);
                }}
              />
            </View>
          )}
        </View>

        {options.yearOptional && (
          <View style={styles.yearCard}>
            <Pressable
              accessibilityRole={yearKnown ? 'button' : undefined}
              accessibilityLabel={yearKnown ? `${yearCardHint}. Change the year` : undefined}
              disabled={!yearKnown}
              onPress={() => setWheelYear(picked?.year ?? viewYear)}
              style={styles.yearCardText}
            >
              <Text style={styles.yearTitle}>I know the year</Text>
              <Text style={styles.yearHint}>{yearCardHint}</Text>
            </Pressable>
            <Switch
              value={yearKnown}
              onValueChange={switchYear}
              accessibilityLabel="I know the year"
              trackColor={{ false: colors.outline, true: colors.blue }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.outline}
            />
          </View>
        )}

        {time !== undefined && (
          <>
            <Text style={styles.sendLabel}>Send at</Text>
            <View style={styles.times}>
              {PRESET_TIMES.map((p) => (
                <Pressable
                  key={p.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: time === p.value }}
                  onPress={() => setTime(p.value)}
                  style={[styles.timeChip, time === p.value && styles.timeChipOn]}
                >
                  <Text style={styles.timeText} numberOfLines={1} adjustsFontSizeToFit>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isPreset ? 'Other time' : `Other time, ${formatClock(time)}. Change`}
                accessibilityState={{ selected: !isPreset }}
                onPress={() => setClockOpen(true)}
                style={[styles.timeChip, styles.otherChip, !isPreset && styles.timeChipOn]}
              >
                <Text style={styles.timeText} numberOfLines={1} adjustsFontSizeToFit>
                  {isPreset ? 'Other' : formatClock(time)}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        <BounceButton title={doneTitle} disabled={!picked} onPress={done} style={styles.done} />
      </ScrollView>
      )}
    </SlideUpSheet>
  );
}

type WheelProps = { years: number[]; start: number; onChange: (year: number) => void };

/** Years in a scrolling column that snaps to a row. The row in the middle is the picked one. */
function YearWheel({ years, start, onChange }: WheelProps) {
  const ref = useRef<ScrollView>(null);
  const [picked, setPicked] = useState(start);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.min(years.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    if (index !== picked) {
      setPicked(index);
      onChange(years[index]);
    }
  };

  return (
    <View style={styles.wheel}>
      {/* The pink band behind the middle row shows what's picked. */}
      <View style={styles.band} pointerEvents="none">
        <MaterialCommunityIcons name="star-four-points" size={18} color={colors.sparkle} style={styles.bandSparkle} />
      </View>
        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW}
          decelerationRate="fast"
          nestedScrollEnabled
          scrollEventThrottle={16}
          onScroll={onScroll}
          // Jump to the starting year once the wheel has its size.
          onLayout={() => ref.current?.scrollTo({ y: start * ROW, animated: false })}
          // Empty space above and below so the first and last years can reach the middle.
          contentContainerStyle={{ paddingVertical: ROW * Math.floor(VISIBLE_ROWS / 2) }}
          accessibilityLabel={`Year, ${years[picked]}`}
        >
          {years.map((y, i) => {
            const away = Math.abs(i - picked);
            return (
              <Pressable key={y} onPress={() => ref.current?.scrollTo({ y: i * ROW, animated: true })} style={styles.wheelRow}>
                <Text style={[styles.wheelYear, away === 0 && styles.wheelYearPicked, away >= 2 && styles.wheelYearFar]}>{y}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
    </View>
  );
}

type RoundButtonProps = { icon: 'chevron-left' | 'chevron-right'; label: string; disabled?: boolean; onPress: () => void };

function RoundButton({ icon, label, disabled, onPress }: RoundButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.round, disabled && styles.disabled]}
    >
      <Feather name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { alignSelf: 'stretch' },
  content: { gap: spacing.sm, paddingTop: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  gift: { width: 84, height: 84 },
  titleText: { flex: 1 },
  title: { ...type.h1, fontSize: 26 },
  subtitle: { ...type.bodyMuted, fontSize: 17 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  round: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPill: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  monthText: { fontFamily: fonts.heading, fontSize: fontSizes.xl, color: colors.text },
  week: { flexDirection: 'row', marginTop: spacing.xxs },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 50, alignItems: 'center', justifyContent: 'center' },
  day: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.blueLight },
  daySelected: { backgroundColor: colors.orange, boxShadow: `0 4px 14px ${colors.orangeGlow}` },
  dayText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.lg, color: colors.text },
  dayTextSelected: { fontFamily: fonts.heading },
  dayTextDisabled: { color: colors.greyBlue },
  sparkle: { position: 'absolute', top: -2, right: 0 },
  dots: { position: 'absolute', bottom: -1, flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotCoral: { backgroundColor: colors.heart },
  dotBlue: { backgroundColor: colors.blue },
  chooser: { gap: spacing.sm, paddingVertical: spacing.xs },
  calendarArea: { gap: spacing.sm, zIndex: 1 },
  yearPopup: {
    position: 'absolute',
    top: -spacing.xs,
    left: spacing.md,
    right: spacing.md,
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.cardLarge,
    borderWidth: 1.5,
    borderColor: colors.outline,
    boxShadow: `0 10px 30px ${colors.scrim}`,
  },
  yearPopupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  yearPopupTitle: { ...type.h2 },
  badge: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.md,
    color: colors.text,
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
  },
  wheel: { height: ROW * VISIBLE_ROWS },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ROW * Math.floor(VISIBLE_ROWS / 2) - 2,
    height: ROW + 4,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkLight,
    justifyContent: 'center',
  },
  bandSparkle: { position: 'absolute', right: spacing.xl, top: spacing.xs },
  wheelRow: { height: ROW, alignItems: 'center', justifyContent: 'center' },
  wheelYear: { fontFamily: fonts.headingSemiBold, fontSize: fontSizes.xl, color: colors.textMuted, opacity: 0.75 },
  wheelYearPicked: { fontFamily: fonts.heading, fontSize: 32, color: colors.text, opacity: 1 },
  wheelYearFar: { fontSize: fontSizes.lg, color: colors.greyBlue, opacity: 0.6 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  monthCell: {
    width: '31.5%',
    minHeight: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.blueMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.orange },
  chipText: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.text },
  disabled: { opacity: 0.4 },
  yearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.pinkLight,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  yearCardText: { flex: 1 },
  yearTitle: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.lg, color: colors.text },
  yearHint: { ...type.bodyMuted },
  sendLabel: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.lg, color: colors.text, marginTop: spacing.xxs },
  times: { flexDirection: 'row', gap: spacing.xs },
  timeChip: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: touchTarget,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.blueMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherChip: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.outline },
  timeChipOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  timeText: { fontFamily: fonts.bodyExtraBold, fontSize: fontSizes.sm, color: colors.text },
  done: { alignSelf: 'stretch', marginTop: spacing.xs },
});
