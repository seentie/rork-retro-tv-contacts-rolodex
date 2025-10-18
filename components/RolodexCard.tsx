import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Platform, TouchableOpacity, TextInput, ScrollView, Alert, Switch, KeyboardAvoidingView } from 'react-native';
import { Contact } from '@/types/contact';
import { RolodexTheme } from '@/constants/rolodex-theme';
import { Phone, Mail, MapPin, Calendar, Gift, Edit2, Save, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useContacts } from '@/hooks/contacts-store';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const MAX_CARD_HEIGHT = height - 120;

interface RolodexCardProps {
  contact: Contact;
}

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

export default function RolodexCard({ contact }: RolodexCardProps) {
  const { updateContact, deleteContact } = useContacts();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact>(contact);

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setEditedContact({ ...editedContact, phone: formatted });
  };

  const pickImage = async (type: 'photo' | 'businessCard') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'photo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'photo') {
        setEditedContact({ ...editedContact, photoUri: result.assets[0].uri });
      } else {
        setEditedContact({ ...editedContact, businessCardUri: result.assets[0].uri });
      }
    }
  };

  const handleSave = () => {
    if (!editedContact.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }
    updateContact(contact.id, editedContact);
    setIsEditing(false);
    Alert.alert('Success', 'Contact updated!');
  };

  const handleCancel = () => {
    setEditedContact(contact);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteContact(contact.id);
            Alert.alert('Success', 'Contact deleted!');
          }
        }
      ]
    );
  };

  if (isEditing && !contact.isFictional) {
    return (
      <KeyboardAvoidingView 
        style={styles.cardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.editCard} contentContainerStyle={{ padding: 20 }}>
          <View style={styles.editHeader}>
            <Text style={styles.editTitle}>Edit Contact</Text>
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <X size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveEditButton}>
                <Save size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>First Name *</Text>
            <TextInput
              style={styles.editInput}
              value={editedContact.firstName}
              onChangeText={(text) => setEditedContact({ ...editedContact, firstName: text })}
            />
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>Last Name</Text>
            <TextInput
              style={styles.editInput}
              value={editedContact.lastName}
              onChangeText={(text) => setEditedContact({ ...editedContact, lastName: text })}
            />
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>Phone</Text>
            <View style={styles.phoneRow}>
              <TextInput
                style={[styles.editInput, styles.countryCodeInput]}
                value={editedContact.countryCode}
                onChangeText={(text) => setEditedContact({ ...editedContact, countryCode: text })}
                placeholder="+1"
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.editInput, styles.phoneInput]}
                value={editedContact.phone}
                onChangeText={handlePhoneChange}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>Email</Text>
            <TextInput
              style={styles.editInput}
              value={editedContact.email}
              onChangeText={(text) => setEditedContact({ ...editedContact, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>Address</Text>
            <TextInput
              style={[styles.editInput, styles.multilineInput]}
              value={editedContact.address}
              onChangeText={(text) => setEditedContact({ ...editedContact, address: text })}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>Birthday</Text>
            <TextInput
              style={styles.editInput}
              value={editedContact.birthday}
              onChangeText={(text) => setEditedContact({ ...editedContact, birthday: text })}
            />
          </View>

          <View style={styles.switchGroup}>
            <Text style={styles.editLabel}>Send Holiday Card?</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{editedContact.holidayCard ? 'YES' : 'NO'}</Text>
              <Switch
                value={editedContact.holidayCard}
                onValueChange={(value) => setEditedContact({ ...editedContact, holidayCard: value })}
                trackColor={{ false: RolodexTheme.colors.border, true: RolodexTheme.colors.tabActive }}
              />
            </View>
          </View>

          <View style={styles.editInputGroup}>
            <Text style={styles.editLabel}>Notes</Text>
            <TextInput
              style={[styles.editInput, styles.notesInput]}
              value={editedContact.notes}
              onChangeText={(text) => setEditedContact({ ...editedContact, notes: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <Text style={styles.editSectionTitle}>ATTACHMENTS</Text>

          <View style={styles.imageEditSection}>
            <View style={styles.imageEditContainer}>
              <TouchableOpacity onPress={() => pickImage('photo')} style={styles.imageEditButton}>
                {editedContact.photoUri ? (
                  <Image source={{ uri: editedContact.photoUri }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imageEditText}>Add Photo</Text>
                )}
              </TouchableOpacity>
              {editedContact.photoUri && (
                <TouchableOpacity 
                  style={styles.deleteImageButton}
                  onPress={() => setEditedContact({ ...editedContact, photoUri: '' })}
                >
                  <Trash2 size={16} color="#FFF" />
                  <Text style={styles.deleteImageText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.imageEditContainer}>
              <TouchableOpacity onPress={() => pickImage('businessCard')} style={styles.imageEditButton}>
                {editedContact.businessCardUri ? (
                  <Image source={{ uri: editedContact.businessCardUri }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imageEditText}>Add Business Card</Text>
                )}
              </TouchableOpacity>
              {editedContact.businessCardUri && (
                <TouchableOpacity 
                  style={styles.deleteImageButton}
                  onPress={() => setEditedContact({ ...editedContact, businessCardUri: '' })}
                >
                  <Trash2 size={16} color="#FFF" />
                  <Text style={styles.deleteImageText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.deleteContactButton} onPress={handleDelete}>
            <Trash2 size={20} color="#FFF" />
            <Text style={styles.deleteContactText}>Delete Contact</Text>
          </TouchableOpacity>

          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.cancelBottomButton} onPress={handleCancel}>
              <X size={20} color="#FFF" />
              <Text style={styles.bottomButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBottomButton} onPress={handleSave}>
              <Save size={20} color="#FFF" />
              <Text style={styles.bottomButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Tab with letter */}
        <View style={styles.tab}>
          <Text style={styles.tabLetter}>
            {(contact.lastName?.[0] || contact.firstName[0]).toUpperCase()}
          </Text>
        </View>

        {/* Edit button - only for non-fictional contacts */}
        {!contact.isFictional && (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Edit2 size={20} color={RolodexTheme.colors.tabText} />
          </TouchableOpacity>
        )}

        {/* Card content */}
        <ScrollView style={styles.cardContent} contentContainerStyle={styles.cardContentInner} showsVerticalScrollIndicator={true}>
          {/* Name section */}
          <View style={styles.nameSection}>
            <Text style={styles.firstName}>{contact.firstName}</Text>
            <Text style={styles.lastName}>{contact.lastName}</Text>
            {contact.tvShow && (
              <Text style={styles.tvShow}>★ {contact.tvShow}</Text>
            )}
          </View>

          {/* Photo and/or business card */}
          {contact.photoUri && (
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: contact.photoUri }}
                style={styles.photo}
              />
              <View style={styles.tapeLeft} />
              <View style={styles.tapeRight} />
            </View>
          )}

          {contact.businessCardUri && (
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: contact.businessCardUri }}
                style={styles.businessCard}
              />
              <View style={styles.tapeLeft} />
              <View style={styles.tapeRight} />
            </View>
          )}

          {/* Contact details */}
          <View style={styles.detailsSection}>
            {contact.phone && (
              <View style={styles.detailRow}>
                <Phone size={16} color={RolodexTheme.colors.cardText} />
                <Text style={styles.detailText}>
                  {contact.countryCode ? `${contact.countryCode} ` : ''}{contact.phone}
                </Text>
              </View>
            )}
            
            {contact.email && (
              <View style={styles.detailRow}>
                <Mail size={16} color={RolodexTheme.colors.cardText} />
                <Text style={styles.detailText}>{contact.email}</Text>
              </View>
            )}
            
            {contact.address && (
              <View style={styles.detailRow}>
                <MapPin size={16} color={RolodexTheme.colors.cardText} />
                <Text style={styles.detailText}>{contact.address}</Text>
              </View>
            )}
            
            {contact.birthday && (
              <View style={styles.detailRow}>
                <Calendar size={16} color={RolodexTheme.colors.cardText} />
                <Text style={styles.detailText}>Birthday: {contact.birthday}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Gift size={16} color={RolodexTheme.colors.cardText} />
              <Text style={styles.detailText}>
                Holiday Card: {contact.holidayCard ? 'YES ✓' : 'NO ✗'}
              </Text>
            </View>
          </View>

          {/* Notes section */}
          {contact.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>NOTES:</Text>
              <Text style={styles.notesText}>{contact.notes}</Text>
            </View>
          )}

          {/* Card lines for authentic look */}
          <View style={styles.cardLines}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.line} />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    maxHeight: MAX_CARD_HEIGHT,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  card: {
    flex: 1,
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '2px 4px 6px rgba(0,0,0,0.3)',
      } as any,
    }),
  },
  tab: {
    position: 'absolute',
    top: -10,
    right: 30,
    backgroundColor: RolodexTheme.colors.tabBackground,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    zIndex: 1,
  },
  tabLetter: {
    color: RolodexTheme.colors.tabText,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  cardContent: {
    flex: 1,
  },
  cardContentInner: {
    padding: 24,
    paddingTop: 24,
  },
  nameSection: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: RolodexTheme.colors.border,
    paddingBottom: 12,
    marginTop: 30,
  },
  firstName: {
    fontSize: 24,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
  },
  lastName: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginTop: 4,
  },
  tvShow: {
    fontSize: 14,
    color: RolodexTheme.colors.accentOrange,
    fontStyle: 'italic',
    marginTop: 8,
  },
  photoContainer: {
    alignSelf: 'center',
    marginVertical: 15,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 4,
    transform: [{ rotate: '-2deg' }],
  },
  businessCard: {
    width: 200,
    height: 120,
  },
  tapeLeft: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 40,
    height: 20,
    backgroundColor: 'rgba(255, 255, 200, 0.7)',
    transform: [{ rotate: '-15deg' }],
  },
  tapeRight: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 40,
    height: 20,
    backgroundColor: 'rgba(255, 255, 200, 0.7)',
    transform: [{ rotate: '15deg' }],
  },
  detailsSection: {
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    flex: 1,
  },
  notesSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: RolodexTheme.colors.paperTexture,
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    lineHeight: 18,
  },
  cardLines: {
    marginTop: 20,
    marginBottom: 10,
  },
  line: {
    height: 1,
    backgroundColor: RolodexTheme.colors.border,
    marginVertical: 8,
    opacity: 0.3,
  },
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: RolodexTheme.colors.tabActive,
    borderRadius: 20,
    padding: 8,
    zIndex: 2,
  },
  editCard: {
    flex: 1,
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '2px 4px 6px rgba(0,0,0,0.3)',
      } as any,
    }),
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: RolodexTheme.colors.border,
    paddingBottom: 10,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#DC3545',
    borderRadius: 20,
    padding: 10,
  },
  saveEditButton: {
    backgroundColor: RolodexTheme.colors.tabActive,
    borderRadius: 20,
    padding: 10,
  },
  editInputGroup: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 6,
  },
  editInput: {
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
  editSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginTop: 10,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: RolodexTheme.colors.border,
    paddingBottom: 8,
  },
  imageEditSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  imageEditContainer: {
    alignItems: 'center',
  },
  imageEditButton: {
    backgroundColor: RolodexTheme.colors.tabBackground,
    width: 140,
    height: 140,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: RolodexTheme.colors.border,
  },
  imageEditText: {
    color: RolodexTheme.colors.tabText,
    fontSize: 12,
    fontFamily: RolodexTheme.fonts.typewriter,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  deleteImageButton: {
    flexDirection: 'row',
    backgroundColor: '#DC3545',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  deleteImageText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: RolodexTheme.fonts.typewriter,
    marginLeft: 6,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelBottomButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#DC3545',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBottomButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: RolodexTheme.colors.tabActive,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold' as const,
    fontFamily: RolodexTheme.fonts.typewriter,
    marginLeft: 8,
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
  deleteContactButton: {
    flexDirection: 'row',
    backgroundColor: '#DC3545',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  deleteContactText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold' as const,
    fontFamily: RolodexTheme.fonts.typewriter,
    marginLeft: 8,
  },
});