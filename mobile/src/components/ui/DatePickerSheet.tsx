import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme';

interface DatePickerSheetProps {
  visible: boolean;
  value: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const currentYear = new Date().getFullYear();
const MIN_YEAR = 1940;
const MAX_YEAR = currentYear - 18;

function generateDays() {
  return Array.from({ length: 31 }, (_, i) => i + 1);
}
function generateYears() {
  const years: number[] = [];
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) years.push(y);
  return years;
}

function WheelColumn({ items, selectedIndex, onSelect, renderItem }: {
  items: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderItem: (item: any) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    if (idx >= 0 && idx < items.length && idx !== selectedIndex) {
      onSelect(idx);
    }
  }, [items.length, selectedIndex, onSelect]);

  return (
    <View style={wheelStyles.column}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
      >
        {items.map((item, idx) => (
          <Pressable key={idx} style={wheelStyles.item} onPress={() => {
            onSelect(idx);
            scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
          }}>
            <Text style={[wheelStyles.itemText, idx === selectedIndex && wheelStyles.selectedText]}>
              {renderItem(item)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={wheelStyles.highlight} />
    </View>
  );
}

export default function DatePickerSheet({ visible, value, onSelect, onClose }: DatePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const days = generateDays();
  const years = generateYears();

  const initial = value || new Date(2000, 0, 1);
  const [dayIdx, setDayIdx] = useState(initial.getDate() - 1);
  const [monthIdx, setMonthIdx] = useState(initial.getMonth());
  const [yearIdx, setYearIdx] = useState(Math.max(0, years.indexOf(initial.getFullYear())));

  const handleDone = () => {
    const y = years[yearIdx] || 2000;
    const m = monthIdx;
    const maxDay = new Date(y, m + 1, 0).getDate();
    const d = Math.min(days[dayIdx] || 1, maxDay);
    onSelect(new Date(y, m, d));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={dateStyles.backdrop} onPress={onClose}>
        <View style={[dateStyles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
          onStartShouldSetResponder={() => true}>
          <View style={dateStyles.header}>
            <Pressable onPress={onClose}><Text style={dateStyles.cancel}>Cancel</Text></Pressable>
            <Text style={dateStyles.title}>Date of Birth</Text>
            <Pressable onPress={handleDone}><Text style={dateStyles.done}>Done</Text></Pressable>
          </View>

          <View style={dateStyles.wheels}>
            <WheelColumn items={days} selectedIndex={dayIdx} onSelect={setDayIdx} renderItem={(d) => String(d)} />
            <WheelColumn items={MONTHS} selectedIndex={monthIdx} onSelect={setMonthIdx} renderItem={(m) => m} />
            <WheelColumn items={years} selectedIndex={yearIdx} onSelect={setYearIdx} renderItem={(y) => String(y)} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const wheelStyles = StyleSheet.create({
  column: { flex: 1, height: ITEM_HEIGHT * VISIBLE_ITEMS, overflow: 'hidden', position: 'relative' },
  item: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  itemText: { ...typography.body, color: colors.textTertiary },
  selectedText: { ...typography.h4, color: colors.text },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
});

const dateStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: { ...typography.h4, color: colors.text },
  cancel: { ...typography.body, color: colors.textSecondary },
  done: { ...typography.button, color: colors.primary },
  wheels: { flexDirection: 'row', paddingVertical: spacing.md },
});
