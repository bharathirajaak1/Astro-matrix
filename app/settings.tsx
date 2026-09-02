import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-haptics';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const [morningNotif, setMorningNotif] = useState(true);
  const [goldenNotif, setGoldenNotif] = useState(true);
  const [eveningNotif, setEveningNotif] = useState(true);
  const [traditionalRem, setTraditionalRem] = useState(true);
  const [modernRem, setModernRem] = useState(true);

  const toggleSwitch = (setter: any, val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!val);
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerSubu>CUSTOMIZATION & CONTROLS</Text>
        <Text style={styles.headerTitle}>Settings & Preferences</Text>

        { /* Notification Preferences */ }
        <Text style={styles.sectionLabel}>SMART REMINDERS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.textBox}>
              <Text style={styles.rowHintTitle}>Morning Alignment (Determined 8 AM)</Text>
              <Text style={styles.rowSubtitle}>Receive today's power color and theme</Text>
            </View>
            <Switch
              value={morningNotif}
              onValueChange={() => toggleSwitch(setMorningNotif, morningNotif)}
              trackColor={{ false: '#DEEDEE', true: '#5E7563' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.textBox}>
              <Text style={styles.rowHintTitle}>Golden Hour Alert (1:30 PM)</Text>
              <Text style={styles.rowSubtitle}>Get ready for your most focused window</Text>
            </View>
            <Switch
              value={goldenNotif}
              onValueChange={() => toggleSwitch(setGoldenNotif, goldenNotif)}
              trackColor={{ false: '#DEEDEE', true: '#5E7563' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.textBox}>
              <Text style={styles.rowHintTitle}>Evening Check-in (9 PM)</Text>
              <Text style={styles.rowSubtitle}>Check off today's quest and keep your streak</Text>
            </View>
            <Switch
              value={eveningNotif}
              onValueChange={() => toggleSwitch(setEveningNotif, eveningNotif)}
              trackColor={{ false: '#DEEDEE', true: '#5E7563' }}
            />
          </View>
        </View>

        { /* Remedy Sources */ }
        <Text style={styles.sectionLabel}>REMEEY PREFERENCES</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.textBox}>
              <Text style={styles.rowHintTitle}>Traditional Remedies</Text>
              <Text style={styles.rowSubtitle}>Classic colors, gemstones, and foods</Text>
            </View>
            <Switch
              value={traditionalRem}
              onValueChange={() => toggleSwitch(setTraditionalRem, traditionalRem)}
              trackColor={{ false: '#DEEDEE', true: '#5E7563'_B�ς�՚Y]ς��Y]��[O^��[\˜�][�ԛ��O���Y]��[O^��[\˝^��O��^�[O^��[\˜���[�]_O�[�\��ZXܛ�T]Y\���^��^�[O^��[\˜����X�]_O��M�^HX�[ۘX�HX�]�Y���^��՚Y]ς���]���[YO^�[�\���[_B�ە�[YP�[��O^�
HO����T��]�
�][�\���[K[�\���[J_B��X����܏^���[�N�	��QQQI��YN�	��QM�M���_B�ς�՚Y]ς�՚Y]ς���ʈ�X��ܚ\[ۈ	�\��Z[Y\�
��B��Y]��[O^��[\˘�\�O��^�[O^��[\˜���[�]_O�[��]\��^��^�[O^��[\˜����X�]_O���YH��\\��
Y�H]
�����Y�HX\
O�^���X�X�S�X�]B��[O^��[\˝\ܘYP�]۟B�۔�\��^�
HO�[\��[\�
	��[Z][HX��\���	�[����Έ8�,��K�[۝܈8�,�K�^K��K�B���^�[O^��[\˝\ܘYP�]ە^O�X[�Y�H�X��ܚ\[ۏ�^����X�X�S�X�]O��՚Y]ς���ʈ]X�[��\\��\��Z[Y\�
��B��Y]��[O^��[\˙\��Z[Y\���O��^�[O^��[\˙\��Z[Y\�]_O�'�&HH�[�H�[Z[�\��^��^�[O^��[\˙\��Z[Y\�^O��\�\\�H��\\����H�X\�[�YK��Hۉ���Z\�H����H[�\��؛[\���]�Hٙ�\�\�H�X[��]]�H�Y�\��[[�H�[[ݙHY[�[�����[��X�H[�\�^H�]HY�\�X\��[�\�X��\�[[X][H�\Y�H[�\�X�[ۜ�[�]]YK��IܙH�Y�\�H��Y\�[�Hۋ��՚Y]ς�՚Y]ς���ܛ��Y]ς���Y�P\�XU�Y]ς�
NB���ۜ��[\�H�[T�Y]�ܙX]J�Y�P\�XN���^�K�X��ܛ�[���܎�	�ё������K��۝Z[�\���Y[�Έ��X��ܛ�[���܎�	�ѐQ�Q���Y[�Л��N�HK�XY\��X����۝�^�N�LK��܎�	��	��۝�ZY��	͉�]\��X�[�ΈK�HK�XY\�]N�ٛ۝�^�N����۝�ZY��	�����܎�	�̐̍L���X\��[���X\��[����N�NK��X�[ۓX�[���۝�^�N�LK�۝�ZY��	�����܎�	��	�]\��X�[�ΈKX\��[����X\��[����N�K��\����X��ܛ�[���܎�	�ё�������ܙ\��Y]\ΈNY[�ΈNX\��[����N�M��ܙ\��Y�K�ܙ\���܎�	��M�ML	�K��][�ԛ�Έ��^\�X�[ێ�	ܛ����\�Y�P�۝[��	��X�KX�]�Y[��[Yے][\Έ	��[�\��Y[�ՙ\�X�[�K�^�����^�KY[�ԚY��L�K����[�]N���۝�^�N�M�۝�ZY��	͉���܎�	�̐̍L���K�����X�]N�ٛ۝�^�N�LK��܎�	�����͐��X\��[����[�RZY��M�K�\ܘYP�]ێ���X��ܛ�[���܎�	��QM�M����ܙ\��Y]\ΈL�Y[�ՙ\�X�[�L�[Yے][\Έ	��[�\��X\��[���L�K�\ܘYP�]ە^����܎�	�ё�������۝�^�N�L��۝�ZY��	���K�\��Z[Y\������X��ܛ�[���܎�	�э�Q�	��ܙ\��Y]\ΈL�Y[�ΈMX\��[���K�\��Z[Y\�]N���۝�^�N�L��۝�ZY��	�����܎�	���͍�	�X\��[����N�K�\��Z[Y\�^�ٛ۝�^�N�LK��܎�	����MP��[�RZY��M�^[Yێ�	��[�\��K�JN�