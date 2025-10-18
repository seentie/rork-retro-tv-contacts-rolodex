import React from 'react';
import { Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { RolodexTheme } from '@/constants/rolodex-theme';

interface AlphabetTabsProps {
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
  availableLetters: string[];
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function AlphabetTabs({ selectedLetter, onSelectLetter, availableLetters }: AlphabetTabsProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity
        style={[styles.tab, !selectedLetter && styles.activeTab]}
        onPress={() => onSelectLetter(null)}
      >
        <Text style={[styles.tabText, !selectedLetter && styles.activeTabText]}>ALL</Text>
      </TouchableOpacity>
      
      {ALPHABET.map(letter => {
        const isAvailable = availableLetters.includes(letter);
        const isSelected = selectedLetter === letter;
        
        return (
          <TouchableOpacity
            key={letter}
            style={[
              styles.tab,
              isSelected && styles.activeTab,
              !isAvailable && styles.disabledTab,
            ]}
            onPress={() => isAvailable && onSelectLetter(letter)}
            disabled={!isAvailable}
          >
            <Text style={[
              styles.tabText,
              isSelected && styles.activeTabText,
              !isAvailable && styles.disabledTabText,
            ]}>
              {letter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 70,
    backgroundColor: RolodexTheme.colors.background,
    borderBottomWidth: 2,
    borderBottomColor: RolodexTheme.colors.border,
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  tab: {
    backgroundColor: RolodexTheme.colors.tabBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: RolodexTheme.colors.border,
    borderBottomWidth: 0,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: RolodexTheme.colors.tabActive,
    transform: [{ translateY: -2 }],
  },
  disabledTab: {
    opacity: 0.4,
  },
  tabText: {
    color: RolodexTheme.colors.tabText,
    fontSize: 20,
    fontWeight: 'bold' as const,
    fontFamily: RolodexTheme.fonts.typewriter,
  },
  activeTabText: {
    color: '#FFF',
  },
  disabledTabText: {
    color: RolodexTheme.colors.border,
  },
});