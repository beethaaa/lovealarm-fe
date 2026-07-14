import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera } from 'react-native-image-picker';
import { momentService } from '@/services/momentService';
import COLOR_PALETTE from '@/styles/colorPalette';

const { width: SW, height: SH } = Dimensions.get('window');

const MomentTakingScreen = () => {
  const navigation = useNavigation<any>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // Trigger camera selfie capture
  const takeSelfie = () => {
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'front',
        quality: 0.8,
        saveToPhotos: false,
      },
      (response) => {
        if (response.didCancel) {
          if (!imageUri) {
            navigation.goBack();
          }
        } else if (response.errorCode) {
          Alert.alert('Lỗi máy ảnh', response.errorMessage || 'Không thể mở máy ảnh');
          if (!imageUri) {
            navigation.goBack();
          }
        } else if (response.assets && response.assets.length > 0) {
          setImageUri(response.assets[0].uri || null);
        }
      }
    );
  };

  useEffect(() => {
    takeSelfie();
  }, []);

  const handleShare = async () => {
    if (!imageUri) {
      Alert.alert('Oops!', 'Vui lòng chụp một bức ảnh trước!');
      return;
    }

    setUploading(true);
    try {
      await momentService.createMoment(imageUri, caption);
      Alert.alert('Thành công', 'Khoảnh khắc của bạn đã được chia sẻ!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('LoveMoment');
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi chia sẻ', err.message || 'Không thể gửi ảnh');
    } finally {
      setUploading(false);
    }
  };

  // Get current hour text (e.g. 10:00)
  const getCurrentHourText = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    return `${hours}:00`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Ornate Plaque Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#FFC0D3', '#FFA0B8', '#E04A76']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBorder}
        >
          <View style={styles.headerInner}>
            <Text style={styles.headerTitle}>Share your moment</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            {/* The Image Preview Card */}
            <View style={styles.momentCardBorder}>
              <LinearGradient
                colors={['#FFB2C5', 'rgba(255, 78, 114, 0.2)', '#FFB2C5']}
                style={styles.momentCardGradient}
              >
                <View style={styles.momentCardInner}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.momentImage}
                    resizeMode="cover"
                  />

                  {/* Dark overlay for text readability */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0, 0, 0, 0.75)']}
                    style={styles.imageOverlay}
                  />

                  {/* Overlaid Time info */}
                  <View style={styles.timeTag}>
                    <Text style={styles.timeText}>{getCurrentHourText()}</Text>
                  </View>

                  {/* Caption Input field overlaid inside the image card */}
                  <View style={styles.captionInputContainer}>
                    <TextInput
                      style={styles.captionInput}
                      placeholder="Viết chú thích..."
                      placeholderTextColor="rgba(255, 228, 235, 0.5)"
                      value={caption}
                      onChangeText={setCaption}
                      maxLength={40}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Retake Camera Button */}
            <TouchableOpacity style={styles.retakeButton} onPress={takeSelfie}>
              <Icon name="camera-reverse-outline" size={18} color="#FF9DB2" />
              <Text style={styles.retakeButtonText}>Chụp lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLOR_PALETTE.brightPink} />
          </View>
        )}
      </ScrollView>

      {/* Share / Rose Button at bottom */}
      {imageUri && (
        <View style={styles.bottomContainer}>
          {uploading ? (
            <ActivityIndicator size="large" color={COLOR_PALETTE.brightPink} style={{ marginBottom: 30 }} />
          ) : (
            <TouchableOpacity
              style={styles.roseButtonContainer}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FFEAF0', '#FFB2C5', '#FF4E72', '#B31A3D']}
                style={styles.roseOuterRing}
              >
                <LinearGradient
                  colors={['#FFF6F8', '#FFB8CD', '#FF6B8B']}
                  style={styles.roseInnerRing}
                >
                  <Icon name="rose" size={32} color="#8A0F2B" />
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default MomentTakingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: SH * 0.5,
  },
  header: {
    marginTop: 64,
    alignSelf: 'center',
    width: SW * 0.72,
    height: 52,
    zIndex: 3,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  headerBorder: {
    padding: 1.5,
    borderRadius: 25,
  },
  headerInner: {
    backgroundColor: '#1C060D',
    borderRadius: 23,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFD3DF',
    fontSize: 17,
    fontFamily: 'Serif',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  previewContainer: {
    paddingHorizontal: 30,
    marginTop: 32,
    alignItems: 'center',
  },
  momentCardBorder: {
    borderRadius: 28,
    width: '100%',
    shadowColor: '#FF4E72',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  momentCardGradient: {
    padding: 1.5,
    borderRadius: 28,
  },
  momentCardInner: {
    borderRadius: 26,
    overflow: 'hidden',
    height: SH * 0.5,
    backgroundColor: '#120206',
  },
  momentImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  timeTag: {
    position: 'absolute',
    top: 24,
    left: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  captionInputContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  captionInput: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 78, 114, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 78, 114, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  retakeButtonText: {
    color: '#FF9DB2',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roseButtonContainer: {
    width: 86,
    height: 86,
    shadowColor: '#FF4E72',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
  roseOuterRing: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roseInnerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
