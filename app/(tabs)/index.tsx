import React, { useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useContacts } from '@/hooks/contacts-store';
import RolodexCard from '@/components/RolodexCard';
import AlphabetTabs from '@/components/AlphabetTabs';
import { RolodexTheme } from '@/constants/rolodex-theme';
import { Search, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RolodexScreen() {
  const { 
    contacts, 
    isLoading,
    searchQuery, 
    setSearchQuery,
    selectedLetter,
    setSelectedLetter,
    availableLetters
  } = useContacts();
  
  const flatListRef = useRef<FlatList>(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleLetterSelect = (letter: string | null) => {
    setSelectedLetter(letter);
    if (letter && contacts.length > 0) {
      const index = contacts.findIndex(c => 
        (c.lastName?.[0] || c.firstName[0]).toUpperCase() === letter
      );
      if (index >= 0) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={RolodexTheme.colors.tabActive} />
        <Text style={styles.loadingText}>Loading your rolodex...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        {showSearch ? (
          <View style={styles.searchBar}>
            <Search size={20} color={RolodexTheme.colors.cardText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setShowSearch(false);
            }}>
              <X size={20} color={RolodexTheme.colors.cardText} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setShowSearch(true)}
          >
            <Search size={20} color={RolodexTheme.colors.tabText} />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Alphabet Tabs */}
      <AlphabetTabs
        selectedLetter={selectedLetter}
        onSelectLetter={handleLetterSelect}
        availableLetters={availableLetters}
      />

      {/* Cards */}
      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No contacts found</Text>
          <Text style={styles.emptySubtext}>Add your first contact or enable character groups in settings</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RolodexCard contact={item} />}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={width}
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RolodexTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RolodexTheme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: RolodexTheme.colors.cardText,
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: RolodexTheme.colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RolodexTheme.colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: RolodexTheme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RolodexTheme.colors.tabBackground,
    borderRadius: 8,
    paddingVertical: 10,
  },
  searchButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: RolodexTheme.colors.tabText,
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  listContent: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: RolodexTheme.fonts.typewriter,
    color: RolodexTheme.colors.cardText,
    textAlign: 'center',
    opacity: 0.7,
  },
});