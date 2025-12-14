import { Image, StyleSheet, View, Text } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { Button } from '@repo/ui';
import { usePlayer } from '../../context/PlayerContext';
import { Player } from '../../components/Player';

export default function HomeScreen() {
  const { session, signIn, toggleMode, mode } = usePlayer();

  if (!session) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome!</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Please Sign In</ThemedText>
          <ThemedText>Connect your Spotify account to sync clips.</ThemedText>
          <Button title="Sign in with Spotify" onPress={signIn} />
        </ThemedView>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Hello, {session.user?.name || 'User'}!</ThemedText>
        <HelloWave />
      </ThemedView>
      
      {/* Player Section */}
      <Player />

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Controls</ThemedText>
        <Button 
            title={mode === 'chill' ? "Switch to Workout Mode 🔥" : "Switch to Chill Mode ❄️"} 
            onPress={toggleMode} 
        />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 20
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
