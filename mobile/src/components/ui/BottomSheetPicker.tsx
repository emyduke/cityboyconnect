import React, { useState, useMemo } from 'react';
import { View, Text, Modal, Pressable, FlatList, TextInput, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface Option {
  label: string;
  value: number | string;
}

interface BottomSheetPickerProps {
  visible: boolean;
  options: Option[];
  value: number | string | null;
  onSelect: (value: number | string, label: string) => void;
  onClose: () => void;
  title: string;
  searchable?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function BottomSheetPicker({ visible, options, value, onSelect, onClose, title, searchable = true }: BottomSheetPickerProps) {
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const handleSelect = (opt: Option) => {
    onSelect(opt.value, opt.label);
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.duration(200)}
          className="bg-surface rounded-t-xl pt-2 px-6"
          style={{ maxHeight: SCREEN_HEIGHT * 0.65, paddingBottom: insets.bottom + 16 }}
          onStartShouldSetResponder={() => true}
        >
          <View className="w-10 h-1 rounded-[2px] bg-gray-200 self-center mb-4" />
          <Text className="text-[17px] font-display-semibold text-gray-900 mb-4">{title}</Text>

          {searchable && (
            <View className="flex-row items-center bg-background rounded-md px-4 mb-4 h-11">
              <Text className="text-sm mr-2">🔍</Text>
              <TextInput
                className="flex-1 text-[15px] font-body leading-[22px] text-gray-900"
                placeholder={`Search ${title.toLowerCase()}...`}
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <Pressable
                className={`flex-row items-center justify-between py-4 border-b border-gray-100 ${item.value === value ? 'bg-background -mx-6 px-6' : ''}`}
                onPress={() => handleSelect(item)}
              >
                <Text className={`text-[15px] font-body leading-[22px] flex-1 ${item.value === value ? 'text-forest font-body-semibold' : 'text-gray-900'}`}>
                  {item.label}
                </Text>
                {item.value === value && <Text className="text-lg text-forest font-body-bold">✓</Text>}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text className="text-[15px] font-body leading-[22px] text-gray-400 text-center py-8">
                No results found
              </Text>
            }
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
