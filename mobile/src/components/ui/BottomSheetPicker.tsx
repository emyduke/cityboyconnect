import React, { useState, useMemo } from 'react';
import { View, Text, Modal, Pressable, FlatList, TextInput, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { colors, spacing, radius, typography } from '../../theme';

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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.sheet, { maxHeight: SCREEN_HEIGHT * 0.65, paddingBottom: insets.bottom + spacing.md }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          {searchable && (
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${title.toLowerCase()}...`}
                placeholderTextColor={colors.textTertiary}
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
                style={[styles.option, item.value === value && styles.optionSelected]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                  {item.label}
                </Text>
                {item.value === value && <Text style={styles.check}>✓</Text>}
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No results found</Text>}
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h4, color: colors.text, marginBottom: spacing.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: spacing.sm },
  searchInput: { flex: 1, ...typography.body, color: colors.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionSelected: { backgroundColor: colors.background, marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  optionText: { ...typography.body, color: colors.text, flex: 1 },
  optionTextSelected: { color: colors.primary, fontFamily: 'PlusJakartaSans-SemiBold' },
  check: { fontSize: 18, color: colors.primary, fontFamily: 'PlusJakartaSans-Bold' },
  empty: { ...typography.body, color: colors.textTertiary, textAlign: 'center', paddingVertical: spacing.xl },
});
