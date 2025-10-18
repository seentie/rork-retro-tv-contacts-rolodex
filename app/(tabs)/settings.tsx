import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useContacts } from '@/hooks/contacts-store';
import { RolodexTheme } from '@/constants/rolodex-theme';
import { Tv, Trash2, UserPlus, Info, Shield, Download, Check, X } from 'lucide-react-native';
import { Contact } from '@/types/contact';

export default function SettingsScreen() {
  const { enabledTVShows, toggleTVShow, tvShows, allContacts, clearUserContacts, addContact, addMultipleContacts } = useContacts();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showBatchPicker, setShowBatchPicker] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [deviceContacts, setDeviceContacts] = useState<any[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const handleSelectContacts = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Contact selection is not available on web. Please use the mobile app.');
      return;
    }

    try {
      setIsSyncing(true);
      console.log('Opening contact picker...');
      
      const permissionResult = await Contacts.requestPermissionsAsync();
      console.log('Permission result:', permissionResult);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Denied', 'Unable to access contacts. Please grant permission in your device settings.');
        return;
      }

      const result = await Contacts.presentContactPickerAsync();
      console.log('Contact picker result:', result);
      console.log('Result type:', typeof result);
      console.log('Result keys:', result ? Object.keys(result) : 'null');

      if (!result || typeof result !== 'object') {
        console.log('User cancelled contact selection or invalid result');
        return;
      }

      if (!result.name && !result.firstName) {
        console.error('Result missing name fields:', result);
        Alert.alert('Error', 'Unable to read contact data. Please try again.');
        return;
      }

      const firstName = result.firstName || result.name?.split(' ')[0] || result.name || '';
      const lastName = result.lastName || (result.name?.split(' ').slice(1).join(' ')) || '';

      if (!firstName) {
        Alert.alert('Error', 'Selected contact has no name.');
        return;
      }

      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const existingNames = allContacts.map(c => `${c.firstName} ${c.lastName}`.toLowerCase());

      if (existingNames.includes(fullName)) {
        Alert.alert('Already Exists', 'This contact is already in your rolodex.');
        return;
      }

      const phone = result.phoneNumbers?.[0]?.number || '';
      const email = result.emails?.[0]?.email || '';
      const address = result.addresses?.[0] ? 
        `${result.addresses[0].street || ''} ${result.addresses[0].city || ''} ${result.addresses[0].region || ''} ${result.addresses[0].postalCode || ''}`.trim() : 
        '';
      const birthday = result.birthday ? 
        `${result.birthday.month}/${result.birthday.day}/${result.birthday.year || ''}` : 
        '';

      console.log('Adding contact:', firstName, lastName);

      addContact({
        firstName,
        lastName: lastName || '',
        phone,
        email,
        address,
        birthday,
        holidayCard: true,
        notes: result.note || '',
        isFictional: false,
      });

      Alert.alert('Success', `${firstName} ${lastName} has been added to your rolodex!`);
    } catch (error) {
      console.error('Error selecting contact:', error);
      Alert.alert('Error', `Failed to add contact: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadDeviceContacts = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Contact selection is not available on web. Please use the mobile app.');
      return;
    }

    try {
      setIsLoadingContacts(true);
      
      const permissionResult = await Contacts.requestPermissionsAsync();
      
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Denied', 'Unable to access contacts. Please grant permission in your device settings.');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      const existingNames = allContacts.map(c => `${c.firstName} ${c.lastName}`.toLowerCase());
      
      const filteredContacts = data.filter(contact => {
        const firstName = contact.firstName || contact.name?.split(' ')[0] || contact.name || '';
        const lastName = contact.lastName || (contact.name?.split(' ').slice(1).join(' ')) || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return firstName && !existingNames.includes(fullName);
      });

      const sortedContacts = filteredContacts.sort((a, b) => {
        const aName = (a.lastName || a.firstName || a.name || '').toLowerCase();
        const bName = (b.lastName || b.firstName || b.name || '').toLowerCase();
        return aName.localeCompare(bName);
      });

      setDeviceContacts(sortedContacts);
      setShowBatchPicker(true);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts. Please try again.');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleBatchAdd = async (size: number) => {
    setBatchSize(size);
    setSelectedContactIds(new Set());
    await loadDeviceContacts();
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContactIds);
    
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      if (newSelected.size >= batchSize) {
        Alert.alert('Limit Reached', `You can only select up to ${batchSize} contacts at a time.`);
        return;
      }
      newSelected.add(contactId);
    }
    
    setSelectedContactIds(newSelected);
  };

  const confirmBatchAdd = async () => {
    try {
      const contactsToAdd: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      selectedContactIds.forEach(contactId => {
        const contact = deviceContacts.find(c => c.id === contactId);
        if (!contact) return;

        const firstName = contact.firstName || contact.name?.split(' ')[0] || contact.name || '';
        const lastName = contact.lastName || (contact.name?.split(' ').slice(1).join(' ')) || '';
        const phone = contact.phoneNumbers?.[0]?.number || '';
        const email = contact.emails?.[0]?.email || '';
        const address = contact.addresses?.[0] ? 
          `${contact.addresses[0].street || ''} ${contact.addresses[0].city || ''} ${contact.addresses[0].region || ''} ${contact.addresses[0].postalCode || ''}`.trim() : 
          '';
        const birthday = contact.birthday ? 
          `${contact.birthday.month}/${contact.birthday.day}/${contact.birthday.year || ''}` : 
          '';

        contactsToAdd.push({
          firstName,
          lastName: lastName || '',
          phone,
          email,
          address,
          birthday,
          holidayCard: true,
          notes: contact.note || '',
          isFictional: false,
        });
      });

      if (contactsToAdd.length > 0) {
        addMultipleContacts(contactsToAdd);
        setShowBatchPicker(false);
        setSelectedContactIds(new Set());
        setDeviceContacts([]);
        Alert.alert(
          'Success', 
          `Added ${contactsToAdd.length} contact${contactsToAdd.length > 1 ? 's' : ''} to your rolodex!`
        );
      }
    } catch (error) {
      console.error('Error adding contacts:', error);
      Alert.alert('Error', 'Failed to add contacts. Please try again.');
    }
  };

  const handleClearUserContacts = () => {
    Alert.alert(
      'Clear All Contacts',
      'This will remove all manually added contacts. Literary contacts will remain. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearUserContacts();
            Alert.alert('Success', 'All user contacts have been removed');
          },
        },
      ]
    );
  };

  const handleExportContacts = async () => {
    try {
      const userContacts = allContacts.filter(c => !c.isFictional);
      
      if (userContacts.length === 0) {
        Alert.alert('No Contacts', 'You have no contacts to export.');
        return;
      }

      const exportData = JSON.stringify(userContacts, null, 2);
      const fileName = `rolodex_contacts_${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Contacts exported successfully!');
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, exportData, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Contacts',
          });
        } else {
          Alert.alert('Success', `Contacts saved to: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Error exporting contacts:', error);
      Alert.alert('Error', 'Failed to export contacts. Please try again.');
    }
  };

  const handleShowPrivacyPolicy = () => {
    setShowPrivacyPolicy(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Info size={24} color={RolodexTheme.colors.tabActive} />
          <Text style={styles.infoTitle}>How to Use</Text>
        </View>
        <Text style={styles.infoText}>
          Other apps want your contacts for their purposes - to sell, to market, to track. This is different.
        </Text>
        <Text style={styles.infoText}>
          This is your personal retro rolodex - a place to keep contacts just for you, like the paper rolodex cards from back in the day. Private, simple, and yours alone to flip through.
        </Text>
        <Text style={styles.infoText}>
          Add your own contacts using the &quot;Add&quot; tab or sync in small batches from your device. The literary contacts below are public domain characters from classic literature that you can enable or disable.
        </Text>
        <Text style={styles.infoText}>
          There are no other color palettes intentionally - just like the one that sat on your desk.
        </Text>
        <Text style={styles.infoNote}>
          Note: We can&apos;t include copyrighted TV show characters, but you&apos;re welcome to manually add whoever you want to your personal rolodex.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Tv size={20} color={RolodexTheme.colors.cardText} />
          <Text style={styles.sectionTitle}>LITERARY CONTACTS</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Choose which literary collections to include in your rolodex
        </Text>

        {tvShows.map((show) => (
          <View key={show.id} style={styles.showItem}>
            <View style={styles.showInfo}>
              <Text style={styles.showName}>{show.name}</Text>
              <View style={styles.showTags}>
                <Text style={styles.showTag}>{show.decade}</Text>
                <Text style={[styles.showTag, styles.showTypeTag]}>
                  {show.type === 'animated' ? '🎨' : '🎬'} {show.type}
                </Text>
              </View>
            </View>
            <Switch
              value={enabledTVShows.includes(show.id)}
              onValueChange={() => toggleTVShow(show.id)}
              trackColor={{ 
                false: RolodexTheme.colors.border, 
                true: RolodexTheme.colors.tabActive 
              }}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <UserPlus size={20} color={RolodexTheme.colors.tabActive} />
          <Text style={styles.sectionTitle}>ADD CONTACTS</Text>
        </View>

        <View style={styles.intentionalNote}>
          <Text style={styles.intentionalNoteText}>
            💭 This is designed to foster meaningful relationships. There&apos;s no &quot;add all&quot; button on purpose - each contact you add is an intentional connection, just like writing a name on a real rolodex card. You can add as many as you like but 1, 5, or 10 at a time.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSelectContacts}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.syncButtonText}>Select from Device Contacts</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.syncDescription}>
          Choose individual contacts to add to your rolodex.
        </Text>

        <View style={styles.batchButtonsRow}>
          <TouchableOpacity 
            style={[styles.batchButton, (isSyncing || isLoadingContacts) && styles.syncButtonDisabled]}
            onPress={() => handleBatchAdd(5)}
            disabled={isSyncing || isLoadingContacts}
          >
            {isLoadingContacts ? (
              <ActivityIndicator size="small" color={RolodexTheme.colors.tabActive} />
            ) : (
              <Text style={styles.batchButtonText}>Add 5</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.batchButton, (isSyncing || isLoadingContacts) && styles.syncButtonDisabled]}
            onPress={() => handleBatchAdd(10)}
            disabled={isSyncing || isLoadingContacts}
          >
            {isLoadingContacts ? (
              <ActivityIndicator size="small" color={RolodexTheme.colors.tabActive} />
            ) : (
              <Text style={styles.batchButtonText}>Add 10</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.syncDescription}>
          Select multiple contacts at once for faster adding.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Download size={20} color={RolodexTheme.colors.tabActive} />
          <Text style={styles.sectionTitle}>EXPORT CONTACTS</Text>
        </View>

        <TouchableOpacity 
          style={styles.exportButton}
          onPress={handleExportContacts}
        >
          <Text style={styles.exportButtonText}>Download My Contacts</Text>
        </TouchableOpacity>

        <Text style={styles.syncDescription}>
          Export your contacts as a JSON file for backup or transfer.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Trash2 size={20} color="#DC3545" />
          <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
        </View>

        <TouchableOpacity 
          style={styles.dangerButton}
          onPress={handleClearUserContacts}
        >
          <Text style={styles.dangerButtonText}>Clear All User Contacts</Text>
        </TouchableOpacity>

        <Text style={styles.warningText}>
          This action cannot be undone. Literary contacts will not be affected.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Shield size={20} color={RolodexTheme.colors.tabActive} />
          <Text style={styles.sectionTitle}>PRIVACY POLICY</Text>
        </View>

        <TouchableOpacity 
          style={styles.privacyButton}
          onPress={handleShowPrivacyPolicy}
        >
          <Text style={styles.privacyButtonText}>View Privacy Policy</Text>
        </TouchableOpacity>

        <Text style={styles.privacyDescription}>
          Last Updated: January 2025
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.appNameText}>
          My Retro Rolodex
        </Text>
        <Text style={styles.footerSubtext}>
          Bringing the 80s back, one contact at a time
        </Text>
      </View>

      <Modal
        visible={showBatchPicker}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowBatchPicker(false)}
      >
        <View style={styles.batchPickerContainer}>
          <View style={styles.batchPickerHeader}>
            <Text style={styles.batchPickerTitle}>
              Select {batchSize} Contacts
            </Text>
            <Text style={styles.batchPickerSubtitle}>
              {selectedContactIds.size} of {batchSize} selected
            </Text>
          </View>

          <FlatList
            data={deviceContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedContactIds.has(item.id);
              const firstName = item.firstName || item.name?.split(' ')[0] || item.name || '';
              const lastName = item.lastName || (item.name?.split(' ').slice(1).join(' ')) || '';
              const displayName = `${firstName} ${lastName}`.trim();
              const phone = item.phoneNumbers?.[0]?.number || '';

              return (
                <TouchableOpacity
                  style={[
                    styles.contactPickerItem,
                    isSelected && styles.contactPickerItemSelected
                  ]}
                  onPress={() => toggleContactSelection(item.id)}
                >
                  <View style={styles.contactPickerInfo}>
                    <Text style={styles.contactPickerName}>{displayName}</Text>
                    {phone && (
                      <Text style={styles.contactPickerPhone}>{phone}</Text>
                    )}
                  </View>
                  {isSelected && (
                    <Check size={24} color={RolodexTheme.colors.tabActive} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContactsList}>
                <Text style={styles.emptyContactsText}>
                  No new contacts available to add.
                </Text>
                <Text style={styles.emptyContactsSubtext}>
                  All contacts are already in your rolodex.
                </Text>
              </View>
            }
          />

          <View style={styles.batchPickerFooter}>
            <TouchableOpacity
              style={styles.batchCancelButton}
              onPress={() => {
                setShowBatchPicker(false);
                setSelectedContactIds(new Set());
                setDeviceContacts([]);
              }}
            >
              <X size={20} color={RolodexTheme.colors.cardText} />
              <Text style={styles.batchCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.batchConfirmButton,
                selectedContactIds.size === 0 && styles.batchConfirmButtonDisabled
              ]}
              onPress={confirmBatchAdd}
              disabled={selectedContactIds.size === 0}
            >
              <Check size={20} color="#FFF" />
              <Text style={styles.batchConfirmButtonText}>
                Add {selectedContactIds.size}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showPrivacyPolicy && (
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <Text style={styles.modalSubtitle}>(Last Updated: January 2025)</Text>

            <Text style={styles.modalSectionTitle}>Overview</Text>
            <Text style={styles.modalText}>
              OLD SKOOL APPS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.
            </Text>

            <Text style={styles.modalSectionTitle}>Information We Collect</Text>
            <Text style={styles.modalSubsectionTitle}>Information You Provide</Text>
            <Text style={styles.modalText}>
              • Account information (name, email address){"\n"}
              • Profile information you choose to share{"\n"}
              • Content you create or upload{"\n"}
              • Communications with us
            </Text>

            <Text style={styles.modalSubsectionTitle}>Information Automatically Collected</Text>
            <Text style={styles.modalText}>
              • Device information (device type, operating system){"\n"}
              • Usage data (how you interact with the app){"\n"}
              • Log data (app crashes, performance metrics){"\n"}
              • Location data (if you grant permission)
            </Text>

            <Text style={styles.modalSectionTitle}>How We Use Your Information</Text>
            <Text style={styles.modalText}>
              We use your information to:{"\n\n"}
              • Provide and improve our app services{"\n"}
              • Create and maintain your account{"\n"}
              • Send important updates and notifications{"\n"}
              • Respond to your questions and support requests{"\n"}
              • Analyze app usage to improve user experience{"\n"}
              • Ensure app security and prevent fraud
            </Text>

            <Text style={styles.modalSectionTitle}>Information Sharing</Text>
            <Text style={styles.modalText}>
              We do not sell your personal information. We may share your information only in these situations:{"\n\n"}
              • With your consent - When you explicitly agree{"\n"}
              • Service providers - Third parties who help us operate the app{"\n"}
              • Legal requirements - When required by law or to protect rights and safety{"\n"}
              • Business transfers - If our company is sold or merged
            </Text>

            <Text style={styles.modalSectionTitle}>Data Security</Text>
            <Text style={styles.modalText}>
              We implement appropriate security measures to protect your information, including:{"\n\n"}
              • Encryption of sensitive data{"\n"}
              • Secure data transmission{"\n"}
              • Regular security assessments{"\n"}
              • Limited access to personal information
            </Text>

            <Text style={styles.modalSectionTitle}>Your Rights</Text>
            <Text style={styles.modalText}>
              You have the right to:{"\n\n"}
              • Access your personal information{"\n"}
              • Correct inaccurate information{"\n"}
              • Delete your account and data{"\n"}
              • Opt out of marketing communications{"\n"}
              • Request data portability (where applicable){"\n\n"}
              To exercise these rights, contact us at www.oldskoolapps.com
            </Text>

            <Text style={styles.modalSectionTitle}>Children&apos;s Privacy</Text>
            <Text style={styles.modalText}>
              Our app is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we discover we have collected such information, we will delete it promptly.
            </Text>

            <Text style={styles.modalSectionTitle}>Third-Party Services</Text>
            <Text style={styles.modalText}>
              Our app may contain links to third-party services or integrate with other platforms. This privacy policy does not apply to those services. Please review their privacy policies separately.
            </Text>

            <Text style={styles.modalSectionTitle}>Changes to This Policy</Text>
            <Text style={styles.modalText}>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by:{"\n\n"}
              • Posting the updated policy in the app{"\n"}
              • Sending you an email notification{"\n"}
              • Displaying a notice when you next open the app
            </Text>

            <Text style={styles.modalSectionTitle}>Contact Us</Text>
            <Text style={styles.modalText}>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:{"\n\n"}
              Email: sarah@oldskoolapps.com{"\n"}
              Address: 2114 N Flamingo Road #867, Pembroke Pines, FL 33028{"\n"}
              Phone: (646)-540-9602{"\n\n"}
              App version: 1.0
            </Text>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPrivacyPolicy(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </ScrollView>
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
  section: {
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 13,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    opacity: 0.7,
    marginBottom: 16,
  },
  showItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RolodexTheme.colors.border,
  },
  showInfo: {
    flex: 1,
  },
  showName: {
    fontSize: 15,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 4,
  },
  showTags: {
    flexDirection: 'row',
    gap: 8,
  },
  showTag: {
    fontSize: 11,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.accent,
    backgroundColor: RolodexTheme.colors.paperTexture,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  showTypeTag: {
    color: RolodexTheme.colors.accentOrange,
  },
  syncButton: {
    backgroundColor: RolodexTheme.colors.tabActive,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  syncDescription: {
    fontSize: 12,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 12,
  },
  batchButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  batchButton: {
    flex: 1,
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderWidth: 2,
    borderColor: RolodexTheme.colors.tabActive,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  batchButtonText: {
    color: RolodexTheme.colors.tabActive,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  batchPickerContainer: {
    flex: 1,
    backgroundColor: RolodexTheme.colors.background,
  },
  batchPickerHeader: {
    backgroundColor: RolodexTheme.colors.cardBackground,
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: RolodexTheme.colors.border,
  },
  batchPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 4,
  },
  batchPickerSubtitle: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.tabActive,
  },
  contactPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: RolodexTheme.colors.border,
  },
  contactPickerItemSelected: {
    backgroundColor: RolodexTheme.colors.paperTexture,
  },
  contactPickerInfo: {
    flex: 1,
  },
  contactPickerName: {
    fontSize: 16,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 4,
  },
  contactPickerPhone: {
    fontSize: 13,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    opacity: 0.7,
  },
  emptyContactsList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContactsText: {
    fontSize: 16,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyContactsSubtext: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    opacity: 0.6,
    textAlign: 'center',
  },
  batchPickerFooter: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderTopWidth: 2,
    borderTopColor: RolodexTheme.colors.border,
    gap: 12,
  },
  batchCancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: RolodexTheme.colors.background,
    borderWidth: 2,
    borderColor: RolodexTheme.colors.border,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  batchCancelButtonText: {
    color: RolodexTheme.colors.cardText,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  batchConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: RolodexTheme.colors.tabActive,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  batchConfirmButtonDisabled: {
    opacity: 0.4,
  },
  batchConfirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  dangerButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  warningText: {
    fontSize: 12,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: '#DC3545',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  exportButton: {
    backgroundColor: RolodexTheme.colors.tabActive,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  appNameText: {
    fontSize: 16,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.tabActive,
    marginTop: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: RolodexTheme.colors.tabActive,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: '#FFF',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: '#FFF',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 13,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: '#FFF',
    lineHeight: 18,
    fontStyle: 'italic',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: RolodexTheme.colors.accentOrange,
  },
  privacyButton: {
    backgroundColor: RolodexTheme.colors.tabActive,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  privacyDescription: {
    fontSize: 12,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    textAlign: 'center',
    opacity: 0.7,
  },
  intentionalNote: {
    backgroundColor: RolodexTheme.colors.paperTexture,
    borderLeftWidth: 3,
    borderLeftColor: RolodexTheme.colors.accentOrange,
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  intentionalNoteText: {
    fontSize: 13,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
  },
  modalScrollContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.tabActive,
    marginTop: 16,
    marginBottom: 8,
  },
  modalSubsectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginTop: 12,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 13,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalCloseButton: {
    backgroundColor: RolodexTheme.colors.tabActive,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: RolodexTheme.fonts.typewriter,
  },
});