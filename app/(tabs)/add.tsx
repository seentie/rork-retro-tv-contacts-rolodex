import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useContacts } from '@/hooks/contacts-store';
import { RolodexTheme } from '@/constants/rolodex-theme';
import { Camera, Image as ImageIcon, Save, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';

export default function AddContactScreen() {
  const { addContact } = useContacts();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phone, setPhone] = useState('');

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9A-Za-z]/g, '');
    const chars = cleaned.split('');
    let formatted = '';
    
    chars.forEach((char, index) => {
      if (index === 3 || index === 6) {
        formatted += '-';
      }
      formatted += char;
    });
    
    return formatted.substring(0, 12);
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [holidayCard, setHolidayCard] = useState(true);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string>('');
  const [businessCardUri, setBusinessCardUri] = useState<string>('');

  const pickImage = async (type: 'photo' | 'businessCard') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'photo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'photo') {
        setPhotoUri(result.assets[0].uri);
      } else {
        setBusinessCardUri(result.assets[0].uri);
      }
    }
  };

  const handleSave = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }

    addContact({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      countryCode: countryCode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      birthday: birthday.trim(),
      holidayCard,
      notes: notes.trim(),
      photoUri,
      businessCardUri,
    });

    Alert.alert('Success', 'Contact added to your rolodex!', [
      { text: 'OK', onPress: () => router.push('/') }
    ]);

    // Reset form
    setFirstName('');
    setLastName('');
    setCountryCode('');
    setPhone('');
    setEmail('');
    setAddress('');
    setBirthday('');
    setHolidayCard(true);
    setNotes('');
    setPhotoUri('');
    setBusinessCardUri('');
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📇 HOW TO USE</Text>
        <Text style={styles.infoText}>
          This is designed to foster intentional and sentimental connections with real-life relationships. You can sync in small batches—1, 5, or 10 contacts at a time. There are no other color palettes intentionally—just like the one that sat on your desk.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <View style={styles.phoneRow}>
            <TextInput
              style={[styles.input, styles.countryCodeInput]}
              value={countryCode}
              onChangeText={setCountryCode}
              placeholder="+1"
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, styles.phoneInput]}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="555-ABCD or 555-1234"
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, City, State"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Birthday</Text>
          <TextInput
            style={styles.input}
            value={birthday}
            onChangeText={setBirthday}
            placeholder="MM/DD/YYYY"
          />
        </View>

        <View style={styles.switchGroup}>
          <Text style={styles.label}>Send Holiday Card?</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>{holidayCard ? 'YES' : 'NO'}</Text>
            <Switch
              value={holidayCard}
              onValueChange={setHolidayCard}
              trackColor={{ false: RolodexTheme.colors.border, true: RolodexTheme.colors.tabActive }}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes..."
            multiline
            numberOfLines={4}
          />
        </View>

        <Text style={styles.sectionTitle}>ATTACHMENTS</Text>

        <View style={styles.imageSection}>
          <TouchableOpacity 
            style={styles.imageButton}
            onPress={() => pickImage('photo')}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
            ) : (
              <>
                <Camera size={24} color={RolodexTheme.colors.tabText} />
                <Text style={styles.imageButtonText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.imageButton}
            onPress={() => pickImage('businessCard')}
          >
            {businessCardUri ? (
              <Image source={{ uri: businessCardUri }} style={styles.previewImage} />
            ) : (
              <>
                <ImageIcon size={24} color={RolodexTheme.colors.tabText} />
                <Text style={styles.imageButtonText}>Add Business Card</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {photoUri && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => setPhotoUri('')}
          >
            <Trash2 size={16} color="#FFF" />
            <Text style={styles.removeButtonText}>Remove Photo</Text>
          </TouchableOpacity>
        )}

        {businessCardUri && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => setBusinessCardUri('')}
          >
            <Trash2 size={16} color="#FFF" />
            <Text style={styles.removeButtonText}>Remove Business Card</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>Save to Rolodex</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RolodexTheme.colors.background,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderRadius: 8,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      } as any,
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: RolodexTheme.colors.border,
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 6,
  },
  input: {
    backgroundColor: RolodexTheme.colors.paperTexture,
    borderWidth: 1,
    borderColor: RolodexTheme.colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginRight: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeInput: {
    flex: 0,
    width: 70,
  },
  phoneInput: {
    flex: 1,
  },
  imageSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageButton: {
    backgroundColor: RolodexTheme.colors.tabBackground,
    width: 140,
    height: 140,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: RolodexTheme.colors.border,
  },
  imageButtonText: {
    color: RolodexTheme.colors.tabText,
    fontSize: 12,
    fontFamily: RolodexTheme.fonts.typewriter,
    marginTop: 8,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  removeButton: {
    flexDirection: 'row',
    backgroundColor: '#DC3545',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: RolodexTheme.colors.tabActive,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: RolodexTheme.colors.tabActive,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    lineHeight: 20,
  },
});