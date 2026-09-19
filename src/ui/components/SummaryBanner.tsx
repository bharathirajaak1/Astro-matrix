import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummaryBannerProps {
  greeting: string;
  summaryText: string;
  badgeText?: string;
}

export const SummaryBanner: React.FC<SummaryBannerProps> = ({
  greeting,
  summaryText,
  badgeText = '10-SECOND BLUEPRINT',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.badge}>{badgeText}</Text>
        <Text style={styles.greeting}>{greeting}</Text>
      </View>
      <Text style={styles.summaryText}>{summaryText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1B4B',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#4338CA',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 12,
    color: '#C7D2FE',
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#F8FAFC',
    fontWeight: '600',
  },
});