import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
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
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView contentContainerClassName="p-4">
        <Text className="text-[22px] font-extrabold text-gray-900 mb-1">Create a Bubble</Text>
        <Text className="text-sm text-gray-500 mb-6">Describe what your community needs</Text>

        <View className="bg-surface rounded-lg p-5 shadow-sm">
          <Text className="text-[13px] font-semibold text-gray-900 mb-1.5 mt-2">Title</Text>
          <TextInput
            className="border-[1.5px] border-gray-200 rounded-md p-2 text-[15px] text-gray-900 bg-surface"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Barber clippers for Wuse II ward"
            placeholderTextColor="#9ca3af"
          />

          <Text className="text-[13px] font-semibold text-gray-900 mb-1.5 mt-2">Category</Text>
          <View className="border-[1.5px] border-gray-200 rounded-md overflow-hidden">
            <Picker selectedValue={category} onValueChange={setCategory} className="h-[50px]">
              <Picker.Item label="Tools & Equipment" value="TOOLS" />
              <Picker.Item label="Jobs & Opportunities" value="OPPORTUNITIES" />
              <Picker.Item label="Services" value="SERVICES" />
              <Picker.Item label="Local Support" value="SUPPORT" />
              <Picker.Item label="Other" value="OTHER" />
            </Picker>
          </View>

          <Text className="text-[13px] font-semibold text-gray-900 mb-1.5 mt-2">Description</Text>
          <TextInput
            className="border-[1.5px] border-gray-200 rounded-md p-2 text-[15px] text-gray-900 bg-surface min-h-[100px]"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the need, who benefits, and how it helps..."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
          />

          <Text className="text-[13px] font-semibold text-gray-900 mb-1.5 mt-2">Your Phone</Text>
          <TextInput className="border-[1.5px] border-gray-200 rounded-md p-2 text-[15px] text-gray-900 bg-surface" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text className="text-[13px] font-semibold text-gray-900 mb-1.5 mt-2">Your WhatsApp</Text>
          <TextInput className="border-[1.5px] border-gray-200 rounded-md p-2 text-[15px] text-gray-900 bg-surface" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />

          <Button variant="secondary" size="sm" onPress={pickImages} className="mb-4">
            {images.length > 0 ? `${images.length} photo(s) selected` : '📷 Add Photos (optional)'}
          </Button>

          <Button variant="primary" onPress={handleSubmit} loading={submitting}>
            Submit Bubble for Review
          </Button>

          <View className="bg-success-light rounded-md p-4 mt-4">
            <Text className="text-[13px] text-forest leading-5">
              💡 Your bubble will be reviewed by the City Boy Connect team. We'll contact you on WhatsApp to discuss the details.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

