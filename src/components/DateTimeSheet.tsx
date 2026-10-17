import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';
import { BounceButton } from './BounceButton';
import { SlideUpSheet } from './SlideUpSheet';

type Mode = 'date' | 'time' | 'datetime';
type Request = { mode: Mode; value: Date; onDone: (d: Date) => void };

/**
 * Date (and time) picking that feels native on both phones.
 * Android shows its own pop-up dialogs (date, then time).
 * iPhone shows the calendar in an AutoWish bottom sheet.
 *
 * Usage: const picker = useDateTimePicker(); picker.open('date', value, setValue);
 * and render {picker.sheet} at the end of the screen.
 */
export function useDateTimePicker() {
  const [request, setRequest] = useState<Request | null>(null);

  const open = (mode: Mode, value: Date, onDone: (d: Date) => void) => {
    if (Platform.OS !== 'android') {
      setRequest({ mode, value, onDone });
      return;
    }
    // onValueChange only fires when a date is picked (not when the dialog is cancelled).
    if (mode === 'time') {
      DateTimePickerAndroid.open({ mode: 'time', value, onValueChange: (_, time) => onDone(time) });
      return;
    }
    DateTimePickerAndroid.open({
      mode: 'date',
      value,
      onValueChange: (_, date) => {
        if (mode === 'date') return onDone(date);
        DateTimePickerAndroid.open({ mode: 'time', value: date, onValueChange: (_e, time) => onDone(time) });
      },
    });
  };

  const sheet = (
    <IosSheet
      // A new key starts a fresh draft each time the sheet opens.
      key={request ? request.value.toISOString() + request.mode : 'closed'}
      request={request}
      onClose={() => setRequest(null)}
    />
  );

  return { open, sheet };
}

function IosSheet({ request, onClose }: { request: Request | null; onClose: () => void }) {
  const [draft, setDraft] = useState(request?.value ?? new Date());

  return (
    <SlideUpSheet visible={request !== null} onClose={onClose}>
      {request && (
        <DateTimePicker
          value={draft}
          mode={request.mode}
          // A calendar for dates; the familiar spinning wheels for a time on its own.
          display={request.mode === 'time' ? 'spinner' : 'inline'}
          themeVariant="light"
          accentColor={colors.blue}
          onValueChange={(_, d) => setDraft(d)}
          style={styles.picker}
        />
      )}
      <BounceButton
        title="Done"
        onPress={() => {
          request?.onDone(draft);
          onClose();
        }}
        style={styles.done}
      />
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  picker: { alignSelf: 'stretch' },
  done: { alignSelf: 'stretch', marginTop: spacing.sm },
});
