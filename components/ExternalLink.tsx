import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform, Pressable, Text } from 'react-native';

export function ExternalLink(
  props: React.ComponentProps<typeof Pressable> & { href: string; children: React.ReactNode }
) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      // Open the link in an in-app browser on native.
      WebBrowser.openBrowserAsync(props.href);
    } else {
      // On web, open in new tab
      window.open(props.href, '_blank');
    }
  };

  return (
    <Pressable
      {...props}
      onPress={handlePress}
    >
      {props.children}
    </Pressable>
  );
}
