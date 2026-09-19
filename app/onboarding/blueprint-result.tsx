import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/features/profile/store';
import { buildNumerologyReport } from '@/core/numerology';
import {
  LIFE_PATH_ARCHETYPES,
  DESTINY_ARCHETYPES,
  SOUL_URGE_ARCHETYPES,
} from '@/core/archetypes';
import { Screen, Txt, Card, Button } from '@/ui/components';
import { spacing, useTheme } from '@/ui/theme';

export default function BlueprintResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);

  const report = profile
    ? buildNumerologyReport({
        id: (profile as any).id ?? 'default',
        createdAt: (profile as any).createdAt ?? new Date().toISOString(),
        fullName: profile.fullName,
        dob: (profile as any).dob || (profile as any).birthDate || '2000-01-01',
        system: profile.system || 'pythagorean',
      })
    : null;

  const firstName = profile?.fullName?.trim().split(' ')[0] || 'Seeker';
  const fullName = profile?.fullName?.trim() || 'Seeker';
  const birthDate = (profile as any)?.dob || (profile as any)?.birthDate || '2000-01-01';

  const lp = (report?.lifePath ?? 7) as number;
  const dest = (report?.destiny ?? 5) as number;
  const su = (report?.soulUrge ?? 8) as number;

  const lifePathInfo = LIFE_PATH_ARCHETYPES[lp] || LIFE_PATH_ARCHETYPES[9] || {
    title: 'The Seeker',
    archetype: 'The Seeker',
    description: 'A journey of inner wisdom, discovery, and uncovering higher truths.',
  };
  const destinyInfo = DESTINY_ARCHETYPES[dest] || DESTINY_ARCHETYPES[3] || {
    title: 'The Catalyst',
    archetype: 'The Catalyst',
    description: 'Bridging ideas and inspiring transformation in your circle.',
  };
  const soulUrgeInfo = SOUL_URGE_ARCHETYPES[su] || SOUL_URGE_ARCHETYPES[3] || {
    title: 'The Sovereign',
    archetype: 'The Sovereign',
    description: 'Craving personal independence, leadership, and purposeful impact.',
  };

  const [expanded, setExpanded] = useState({
    lifePath: false,
    destiny: false,
    soulUrge: false,
  });

  const [explored, setExplored] = useState({
    lifePath: false,
    destiny: false,
    soulUrge: false,
  });

  const toggleSection = (key: 'lifePath' | 'destiny' | 'soulUrge') => {
    void Haptics.selectionAsync();
    setExpanded((prev) => {
      const nextState = !prev[key];
      if (nextState) {
        setExplored((e) => ({ ...e, [key]: true }));
      }
      return { ...prev, [key]: nextState };
    });
  };

  const markExplored = (key: 'lifePath' | 'destiny' | 'soulUrge') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExplored((prev) => ({ ...prev, [key]: true }));
    setExpanded((prev) => ({ ...prev, [key]: false }));
  };

  const exploredCount = [explored.lifePath, explored.destiny, explored.soulUrge].filter(Boolean).length;
  const allExplored = explored.lifePath && explored.destiny && explored.soulUrge;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: spacing.md,
          paddingTop: 56,
          paddingBottom: spacing.xxl,
        }}
      >
        {/* Navigation & Header */}
        <View style={{ gap: spacing.xs }}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Txt variant="label" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                ← Back
              </Txt>
            </TouchableOpacity>
            <Txt variant="label" color="textMuted">
              STEP 1 OF 3: YOUR BLUEPRINT
            </Txt>
          </View>
          <Txt variant="heading">Core Identity Revealed</Txt>
        </View>

        {/* Calculation Info Card */}
        <Card style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <Txt variant="caption" color="textMuted" style={{ lineHeight: 18 }}>
            ✨ Calculated using your full birth name (
            <Txt variant="caption" style={{ fontWeight: '700', color: theme.colors.text }}>{fullName}</Txt>) and date of birth (
            <Txt variant="caption" style={{ fontWeight: '700', color: theme.colors.text }}>{birthDate}</Txt>).
          </Txt>
        </Card>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Txt variant="display" color="primary" center>
              {lp}
            </Txt>
            <Txt variant="caption" color="textMuted" center>
              Life Path
            </Txt>
          </Card>
          <Card style={styles.metricCard}>
            <Txt variant="display" color="primary" center>
              {dest}
            </Txt>
            <Txt variant="caption" color="textMuted" center>
              Destiny
            </Txt>
          </Card>
          <Card style={styles.metricCard}>
            <Txt variant="display" color="primary" center>
              {su}
            </Txt>
            <Txt variant="caption" color="textMuted" center>
              Soul Urge
            </Txt>
          </Card>
        </View>

        {/* Instructions & Progress Indicator */}
        <Card style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', gap: spacing.xs }}>
          <View style={styles.badgeRow}>
            <Txt variant="label" style={{ color: '#3730A3', fontWeight: '800' }}>
              TAP TO REVEAL YOUR BLUEPRINT
            </Txt>
            <View style={styles.pillBadge}>
              <Txt variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 11 }}>
                {exploredCount} of 3 explored
              </Txt>
            </View>
          </View>
          <Txt variant="body" style={{ color: '#4338CA', fontSize: 13, lineHeight: 18 }}>
            Expand each section below to uncover what your numbers mean. Your personalized Summary will unlock once all three are explored.
          </Txt>
        </Card>

        {/* Accordions */}
        <Card style={{ gap: spacing.md, padding: 16 }}>
          <Txt variant="label" color="textMuted">
            WHAT YOUR CORE NUMBERS MEAN
          </Txt>

          {/* Life Path Accordion */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.7}
              onPress={() => toggleSection('lifePath')}
            >
              <Txt variant="heading" style={{ fontSize: 15, flex: 1 }}>
                {expanded.lifePath ? '▲' : '▼'} 🧭 LIFE PATH {lp}: {lifePathInfo.title}
              </Txt>
              {explored.lifePath && (
                <Txt variant="body" style={{ color: '#16A34A', fontWeight: '800' }}>✓</Txt>
              )}
            </TouchableOpacity>

            {expanded.lifePath && (
              <View style={styles.accordionBody}>
                <Txt variant="body" color="textMuted" style={{ fontSize: 13, lineHeight: 20 }}>
                  {lifePathInfo.description}
                </Txt>

                {!explored.lifePath && (
                  <TouchableOpacity
                    style={styles.readButton}
                    onPress={() => markExplored('lifePath')}
                  >
                    <Txt variant="caption" style={{ color: '#166534', fontWeight: '700' }}>
                      ✅ I've explored this
                    </Txt>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {/* Destiny Accordion */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.7}
              onPress={() => toggleSection('destiny')}
            >
              <Txt variant="heading" style={{ fontSize: 15, flex: 1 }}>
                {expanded.destiny ? '▲' : '▼'} 🎯 DESTINY {dest}: {destinyInfo.title}
              </Txt>
              {explored.destiny && (
                <Txt variant="body" style={{ color: '#16A34A', fontWeight: '800' }}>✓</Txt>
              )}
            </TouchableOpacity>

            {expanded.destiny && (
              <View style={styles.accordionBody}>
                <Txt variant="body" color="textMuted" style={{ fontSize: 13, lineHeight: 20 }}>
                  {destinyInfo.description}
                </Txt>

                {!explored.destiny && (
                  <TouchableOpacity
                    style={styles.readButton}
                    onPress={() => markExplored('destiny')}
                  >
                    <Txt variant="caption" style={{ color: '#166534', fontWeight: '700' }}>
                      ✅ I've explored this
                    </Txt>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={{ height: 1, backgroundColor: theme.colors.border }} />

          {/* Soul Urge Accordion */}
          <View style={styles.accordionContainer}>
            <TouchableOpacity
              style={styles.accordionHeader}
              activeOpacity={0.7}
              onPress={() => toggleSection('soulUrge')}
            >
              <Txt variant="heading" style={{ fontSize: 15, flex: 1 }}>
                {expanded.soulUrge ? '▲' : '▼'} 💖 SOUL URGE {su}: {soulUrgeInfo.title}
              </Txt>
              {explored.soulUrge && (
                <Txt variant="body" style={{ color: '#16A34A', fontWeight: '800' }}>✓</Txt>
              )}
            </TouchableOpacity>

            {expanded.soulUrge && (
              <View style={styles.accordionBody}>
                <Txt variant="body" color="textMuted" style={{ fontSize: 13, lineHeight: 20 }}>
                  {soulUrgeInfo.description}
                </Txt>

                {!explored.soulUrge && (
                  <TouchableOpacity
                    style={styles.readButton}
                    onPress={() => markExplored('soulUrge')}
                  >
                    <Txt variant="caption" style={{ color: '#166534', fontWeight: '700' }}>
                      ✅ I've explored this
                    </Txt>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Card>

        {/* Payoff & Matrix Transition (Reveals ONLY when all 3 are explored) */}
        {allExplored && (
          <>
            <Card style={styles.darkCard}>
              <Txt variant="label" color="textMuted" style={{ color: '#A5B4FC' }}>
                10-SECOND BLUEPRINT • {firstName} ✨
              </Txt>
              <Txt variant="body" style={{ color: '#FFFFFF', marginTop: spacing.xs, lineHeight: 22 }}>
                You lead with <Txt variant="body" style={{ color: '#FCD34D', fontWeight: '700' }}>{lifePathInfo.archetype || lifePathInfo.title}</Txt> wisdom (Life Path {lp}) and are driven by <Txt variant="body" style={{ color: '#FCD34D', fontWeight: '700' }}>{soulUrgeInfo.archetype || soulUrgeInfo.title}</Txt> yearning (Soul Urge {su}).
              </Txt>
              <Txt variant="caption" style={{ color: '#C7D2FE', marginTop: spacing.xs }}>
                {destinyInfo.title}: Guided toward authentic self-mastery.
              </Txt>
            </Card>

            <Card style={styles.darkCard}>
              <Txt variant="label" color="textMuted" style={{ color: '#A5B4FC' }}>
                ANCIENT SACRED MATRIX
              </Txt>
              <Txt variant="heading" style={{ color: '#FFFFFF', marginTop: spacing.xs }}>
                Your Matrix Has Been Unlocked
              </Txt>
              <Txt variant="body" style={{ color: '#E2E8F0', marginTop: spacing.xs, lineHeight: 20 }}>
                Your core numbers reveal who you are. The 3,000-year-old Chinese Lo Shu Matrix reveals where your energy flows freely and where it is blocked.
              </Txt>
              <View style={{ marginTop: spacing.md }}>
                <Button
                  label="See My Lo Shu Grid →"
                  onPress={() => router.push('/onboarding/loshu-reveal')}
                />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  accordionContainer: {
    paddingVertical: 4,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  accordionBody: {
    paddingTop: 8,
    gap: 10,
  },
  readButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  darkCard: {
    backgroundColor: '#1E1B4B',
    borderColor: '#312E81',
  },
});