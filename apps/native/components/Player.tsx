import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { usePlayer } from '../context/PlayerContext';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function Player() {
  const { currentTrack, isPaused, togglePlay, nextClip, previousClip, activeClip, mode, deviceId } = usePlayer();

  if (!currentTrack) {
      return (
          <View style={styles.containerEmpty}>
              <Ionicons name="musical-notes" size={48} color="#404040" />
              <Text style={styles.textEmpty}>No track playing</Text>
              {!deviceId && <Text style={styles.subTextEmpty}>Open Spotify on a device to start.</Text>}
          </View>
      );
  }

  return (
    <View style={styles.card}>
      {/* Album Art */}
      <View style={styles.artContainer}>
          {currentTrack.image ? (
            <Image 
                source={{ uri: currentTrack.image }} 
                style={styles.art}
                resizeMode="cover"
            />
          ) : (
            <View style={[styles.art, styles.artPlaceholder]}>
                <Ionicons name="image-outline" size={64} color="#737373" />
            </View>
          )}
      </View>

      {/* Track Info */}
      <View style={styles.infoContainer}>
        <View style={styles.textGroup}>
            <Text style={styles.trackName} numberOfLines={1}>{currentTrack.name}</Text>
            <Text style={styles.artistName} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>

        {/* Mode Indicator */}
        <View style={[styles.badge, mode === 'workout' ? styles.badgeWorkout : styles.badgeChill]}>
            <Ionicons name={mode === 'workout' ? "flame" : "snow"} size={14} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>
                {mode === 'workout' ? 'Workout Mode' : 'Chill Mode'}
            </Text>
        </View>

        {/* Progress Bar (Visual Only for now) */}
        {activeClip && (
            <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{(activeClip.startTime / 1000).toFixed(0)}s</Text>
                <View style={styles.progressBar}>
                    <View style={styles.progressFill} /> 
                </View>
                <Text style={styles.timeText}>{(activeClip.endTime / 1000).toFixed(0)}s</Text>
            </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
            <TouchableOpacity onPress={previousClip} style={styles.secondaryButton}>
                 <Ionicons name="play-skip-back" size={30} color="#E5E5E5" />
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={togglePlay} 
                style={styles.primaryButton}
                activeOpacity={0.8}
            >
                 <Ionicons name={isPaused ? "play" : "pause"} size={40} color="black" style={{ marginLeft: isPaused ? 4 : 0 }} />
            </TouchableOpacity>

            <TouchableOpacity onPress={nextClip} style={styles.secondaryButton}>
                 <Ionicons name="play-skip-forward" size={30} color="#E5E5E5" />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    containerEmpty: {
        padding: 32,
        backgroundColor: '#171717',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        marginHorizontal: 16,
        gap: 16
    },
    textEmpty: {
        color: '#A3A3A3',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Lato_700Bold',
    },
    subTextEmpty: {
        color: '#525252',
        fontSize: 14,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#121212',
        borderRadius: 24,
        overflow: 'hidden',
        marginHorizontal: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#262626',
    },
    artContainer: {
        alignItems: 'center',
        paddingTop: 32,
        paddingBottom: 24,
        backgroundColor: '#181818', // Slightly lighter header
    },
    art: {
        width: 280,
        height: 280,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
    },
    artPlaceholder: {
        backgroundColor: '#262626',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContainer: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    textGroup: {
        alignItems: 'center',
        marginBottom: 24,
    },
    trackName: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'Lato_700Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    artistName: {
        color: '#B3B3B3',
        fontSize: 16,
        fontFamily: 'Lato_400Regular',
        textAlign: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        marginBottom: 32,
    },
    badgeWorkout: {
        backgroundColor: 'rgba(220, 38, 38, 0.2)', // Red tint
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    badgeChill: {
        backgroundColor: 'rgba(79, 70, 229, 0.2)', // Indigo tint
        borderWidth: 1,
        borderColor: '#4F46E5',
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 32,
        gap: 12,
    },
    timeText: {
        color: '#A3A3A3',
        fontSize: 12,
        fontFamily: 'monospace',
        width: 40,
        textAlign: 'center',
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#262626',
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'white', // Spotify style white bar
        width: '50%',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 8,
    },
    secondaryButton: {
        padding: 12,
    },
    primaryButton: {
        width: 72,
        height: 72,
        backgroundColor: '#1DB954',
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
