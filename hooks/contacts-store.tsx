import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { Contact, TVShow } from '@/types/contact';
import { fictionalContacts, tvShows as defaultTVShows } from '@/constants/tv-contacts';

export const [ContactsProvider, useContacts] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [enabledTVShows, setEnabledTVShows] = useState<string[]>(['fairy-tales', 'greek-mythology', 'shakespeare']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Load contacts from AsyncStorage
  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem('rolodex_contacts');
        let userContacts = [];
        
        if (stored && stored !== 'null' && stored !== 'undefined') {
          try {
            userContacts = JSON.parse(stored);
            if (!Array.isArray(userContacts)) {
              console.error('Stored contacts is not an array, resetting');
              userContacts = [];
              await AsyncStorage.setItem('rolodex_contacts', JSON.stringify([]));
            }
          } catch (parseError) {
            console.error('Error parsing contacts from storage:', parseError);
            userContacts = [];
            await AsyncStorage.setItem('rolodex_contacts', JSON.stringify([]));
          }
        }
        
        // Load enabled TV shows
        const tvShowsStored = await AsyncStorage.getItem('rolodex_tv_shows');
        let enabledShows = ['fairy-tales', 'greek-mythology', 'shakespeare'];
        
        if (tvShowsStored && tvShowsStored !== 'null' && tvShowsStored !== 'undefined') {
          try {
            enabledShows = JSON.parse(tvShowsStored);
            if (!Array.isArray(enabledShows)) {
              console.error('Stored TV shows is not an array, resetting');
              enabledShows = ['fairy-tales', 'greek-mythology', 'shakespeare'];
              await AsyncStorage.setItem('rolodex_tv_shows', JSON.stringify(enabledShows));
            }
          } catch (parseError) {
            console.error('Error parsing TV shows from storage:', parseError);
            enabledShows = ['fairy-tales', 'greek-mythology', 'shakespeare'];
            await AsyncStorage.setItem('rolodex_tv_shows', JSON.stringify(enabledShows));
          }
        }
        
        setEnabledTVShows(enabledShows);
        
        // Filter fictional contacts based on enabled shows
        const filteredFictional = fictionalContacts.filter(c => {
          if (!c.tvShow) return false;
          
          // Create show ID from tvShow name to match the tvShows array IDs
          const showId = c.tvShow.toLowerCase()
            .replace(/['']/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^the-/, '')
            .replace(/-the-/, '-');
          
          return enabledShows.includes(showId);
        });
        
        return [...userContacts, ...filteredFictional];
      } catch (error) {
        console.error('Error loading contacts:', error);
        return [];
      }
    }
  });

  // Save contacts mutation
  const saveContactsMutation = useMutation({
    mutationFn: async (newContacts: Contact[]) => {
      const userContacts = newContacts.filter(c => !c.isFictional);
      await AsyncStorage.setItem('rolodex_contacts', JSON.stringify(userContacts));
      return newContacts;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });

  // Save TV show preferences
  const saveTVShowsMutation = useMutation({
    mutationFn: async (shows: string[]) => {
      await AsyncStorage.setItem('rolodex_tv_shows', JSON.stringify(shows));
      setEnabledTVShows(shows);
      return shows;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    }
  });

  useEffect(() => {
    if (contactsQuery?.data) {
      setContacts(contactsQuery.data);
    }
  }, [contactsQuery?.data]);

  const addContact = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    saveContactsMutation.mutate(updated);
  };

  const addMultipleContacts = (contactsToAdd: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const newContacts = contactsToAdd.map((contact, index) => ({
      ...contact,
      id: (Date.now() + index).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const updated = [...contacts, ...newContacts];
    setContacts(updated);
    saveContactsMutation.mutate(updated);
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    const updated = contacts.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    setContacts(updated);
    saveContactsMutation.mutate(updated);
  };

  const deleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    saveContactsMutation.mutate(updated);
  };

  const clearUserContacts = () => {
    const fictionalOnly = contacts.filter(c => c.isFictional);
    setContacts(fictionalOnly);
    saveContactsMutation.mutate(fictionalOnly);
  };

  const toggleTVShow = (showId: string) => {
    const updated = enabledTVShows.includes(showId)
      ? enabledTVShows.filter(s => s !== showId)
      : [...enabledTVShows, showId];
    saveTVShowsMutation.mutate(updated);
  };

  // Get sorted contacts by last name
  const sortedContacts = useMemo(() => {
    let filtered = [...contacts];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        // Search in multiple fields
        const searchFields = [
          c.firstName,
          c.lastName,
          `${c.firstName} ${c.lastName}`,
          `${c.lastName} ${c.firstName}`,
          c.phone,
          c.email,
          c.address,
          c.notes,
          c.tvShow
        ];
        
        return searchFields.some(field => 
          field && field.toLowerCase().includes(query)
        );
      });
    }
    
    // Filter by selected letter
    if (selectedLetter) {
      filtered = filtered.filter(c => 
        (c.lastName?.[0] || c.firstName[0]).toUpperCase() === selectedLetter
      );
    }
    
    // Sort by last name if present, otherwise by first name
    return filtered.sort((a, b) => {
      const aName = (a.lastName ? `${a.lastName} ${a.firstName}` : a.firstName).toLowerCase();
      const bName = (b.lastName ? `${b.lastName} ${b.firstName}` : b.firstName).toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [contacts, searchQuery, selectedLetter]);

  // Get available letters
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    contacts.forEach(c => {
      const letter = (c.lastName?.[0] || c.firstName[0]).toUpperCase();
      letters.add(letter);
    });
    return Array.from(letters).sort();
  }, [contacts]);

  return {
    contacts: sortedContacts,
    allContacts: contacts,
    isLoading: contactsQuery?.isLoading ?? true,
    addContact,
    addMultipleContacts,
    updateContact,
    deleteContact,
    clearUserContacts,
    searchQuery,
    setSearchQuery,
    selectedLetter,
    setSelectedLetter,
    availableLetters,
    enabledTVShows,
    toggleTVShow,
    tvShows: defaultTVShows,
  };
});

export function useFilteredContacts() {
  const { contacts } = useContacts();
  return contacts;
}