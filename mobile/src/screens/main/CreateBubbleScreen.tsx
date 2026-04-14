import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { createBubble } from '../../api/bubbles';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

export default function CreateBubbleScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.phone || '');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      setImages(result.assets.slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (title.length < 5) return Alert.alert('Error', 'Title must be at least 5 characters');
    if (description.length < 20) return Alert.alert('Error', 'Description must be at least 20 characters');
    if (!phone) return Alert.alert('Error', 'Phone is required');
    if (!whatsapp) return Alert.alert('Error', 'WhatsApp is required');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('category', category);
      fd.append('description', description);
      fd.append('contact_phone', phone);
      fd.append('contact_whatsapp', whatsapp);
      images.forEach((img) => {
        fd.append('images', {
          uri: img.uri,
          type: img.mimeType || 'image/jpeg',
          name: img.fileName || 'photo.jpg',
        } as any);
      });
      await createBubble(fd);
      Alert.alert('Success', 'Bubble submitted for review!');
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to create bubble';
      Alert.alert('Error', msg);
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create a Bubble</Text>
        <Text style={styles.subtitle}>Describe what your community needs</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Barber clippers for Wuse II ward"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
              <Picker.Item label="Tools & Equipment" value="TOOLS" />
              <Picker.Item label="Jobs & Opportunities" value="OPPORTUNITIES" />
              <Picker.Item label="Services" value="SERVICES" />
              <Picker.Item label="Local Support" value="SUPPORT" />
              <Picker.Item label="Other" value="OTHER" />
            </Picker>
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the need, who benefits, and how it helps..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          <Text style={styles.label}>Your Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Your WhatsApp</Text>
          <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />

          <Button variant="secondary" size="sm" onPress={pickImages} style={{ marginBottom: spacing.md }}>
            {images.length > 0 ? `${images.length} photo(s) selected` : '📷 Add Photos (optional)'}
          </Button>

          <Button variant="primary" onPress={handleSubmit} loading={submitting}>
            Submit Bubble for Review
          </Button>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Your bubble will be reviewed by the City Boy Connect team. We'll contact you on WhatsApp to discuss the details.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, ...shadows.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.sm, fontSize: 15, color: colors.text, backgroundColor: colors.surface,
  },
  pickerWrap: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  picker: { height: 50 },
  infoBox: { backgroundColor: '#f0fdf4', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  infoText: { fontSize: 13, color: colors.primary, lineHeight: 20 },
});
