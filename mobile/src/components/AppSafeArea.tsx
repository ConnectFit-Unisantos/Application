import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { SafeAreaView as SafeAreaArea } from 'react-native-safe-area-context';

import { theme } from '../styles/theme';

type Props = ViewProps & {
  children: React.ReactNode;
};

export default function AppSafeArea({ style, children, ...rest }: Props) {
  return (
    <SafeAreaArea
      style={[styles.safeArea, style, { backgroundColor: theme.colors.dark }]}
      {...rest}
    >
      {children}
    </SafeAreaArea>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

