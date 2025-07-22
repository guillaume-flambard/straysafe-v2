import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Animated } from 'react-native';
import { DogStatus } from '@/types';
import Colors from '@/constants/colors';

interface FilterTabsProps {
  selectedFilter: DogStatus | 'all';
  onFilterChange: (filter: DogStatus | 'all') => void;
  counts: {
    all: number;
    stray: number;
    fostered: number;
    adopted: number;
    deceased: number;
  };
}

export default function FilterTabs({ selectedFilter, onFilterChange, counts }: FilterTabsProps) {
  const filters: Array<{ value: DogStatus | 'all', label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'stray', label: 'Stray' },
    { value: 'fostered', label: 'Fostered' },
    { value: 'adopted', label: 'Adopted' },
    { value: 'deceased', label: 'Deceased' }
  ];

  const FilterTab = ({ filter }: { filter: { value: DogStatus | 'all', label: string } }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const isSelected = selectedFilter === filter.value;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      onFilterChange(filter.value);
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[
            styles.tab,
            isSelected && styles.selectedTab
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Text 
            style={[
              styles.tabText,
              isSelected && styles.selectedTabText
            ]}
          >
            {filter.label}
          </Text>
          <View style={[
            styles.countContainer,
            isSelected && styles.selectedCountContainer
          ]}>
            <Text style={[
              styles.countText,
              isSelected && styles.selectedCountText
            ]}>
              {counts[filter.value]}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {filters.map((filter) => (
        <FilterTab key={filter.value} filter={filter} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Colors.background,
    minHeight: 32,
  },
  selectedTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedTabText: {
    color: 'white',
  },
  countContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  selectedCountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
  },
  selectedCountText: {
    color: 'white',
  },
});