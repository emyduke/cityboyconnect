import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    <View className="flex-1 overflow-hidden relative" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
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
          <Pressable
            key={idx}
            className="justify-center items-center"
            style={{ height: ITEM_HEIGHT }}
            onPress={() => {
              onSelect(idx);
              scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
            }}
          >
            <Text className={idx === selectedIndex ? 'text-[17px] font-display-semibold text-gray-900' : 'text-[15px] font-body leading-[22px] text-gray-400'}>
              {renderItem(item)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 border-t border-b border-gray-200"
        style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
      />
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
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <View
          className="bg-surface rounded-t-xl px-6"
          style={{ paddingBottom: insets.bottom + 16 }}
          onStartShouldSetResponder={() => true}
        >
          <View className="flex-row justify-between items-center py-4 border-b border-gray-100">
            <Pressable onPress={onClose}>
              <Text className="text-[15px] font-body leading-[22px] text-gray-500">Cancel</Text>
            </Pressable>
            <Text className="text-[17px] font-display-semibold text-gray-900">Date of Birth</Text>
            <Pressable onPress={handleDone}>
              <Text className="text-[15px] font-body-semibold text-forest">Done</Text>
            </Pressable>
          </View>

          <View className="flex-row py-4">
            <WheelColumn items={days} selectedIndex={dayIdx} onSelect={setDayIdx} renderItem={(d) => String(d)} />
            <WheelColumn items={MONTHS} selectedIndex={monthIdx} onSelect={setMonthIdx} renderItem={(m) => m} />
            <WheelColumn items={years} selectedIndex={yearIdx} onSelect={setYearIdx} renderItem={(y) => String(y)} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
