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
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppStore } from '@/store/appStore';
import { coupleService } from '@/services/coupleService';
import { momentService } from '@/services/momentService';
import { chatService } from '@/services/chatService';
import COLOR_PALETTE from '@/styles/colorPalette';

const { width: SW, height: SH } = Dimensions.get('window');
const COLUMN_WIDTH = (SW - 56) / 3; // 3 columns with margins

const LoveHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user: currentUser } = useAppStore();

  const [partner, setPartner] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Full screen preview state
  const [selectedMoment, setSelectedMoment] = useState<any | null>(null);

  const fetchAllData = async () => {
    try {
      // 1. Fetch couple details
      const coupleInfo = await coupleService.getCoupleInfo();
      setPartner(coupleInfo.partner);

      // 2. Fetch all shared moments
      const res = await momentService.getMomentHistory();
      setHistory(res.moments || []);

      // 3. Pre-fetch conversation for chat navigation
      if (coupleInfo.partner && currentUser) {
        const currentId =
          currentUser._id || currentUser.id || currentUser.userId;
        const partnerId =
          coupleInfo.partner._id ||
          coupleInfo.partner.id ||
          coupleInfo.partner.userId;

        try {
          const conv = await chatService.getOrCreateConversation(
            currentId,
            partnerId,
          );
          const cid =
            conv?._id ||
            conv?.id ||
            conv?.data?._id ||
            conv?.data?.id ||
            conv?.conversation?._id;
          setConversationId(cid || 'fallback');
        } catch (err) {
          console.warn('Failed to pre-fetch conversation:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching love history data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchAllData();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Navigate to Chat Screen
  const handleChatPress = () => {
    if (!partner) {
      Alert.alert('Oops!', 'Không tìm thấy thông tin đối phương');
      return;
    }
    const targetUserId = partner._id || partner.id || partner.userId;
    const cid = conversationId || 'fallback';

    navigation.navigate('Chat', {
      targetUser: {
        _id: targetUserId,
        name: partner.profile?.name || partner.name || 'Partner',
        avatarUrl: partner.avatarUrl || partner.profile?.avatarUrl,
      },
      conversationId: cid,
    });
  };

  // Format date display for photos
  const formatDateText = (isoString: string) => {
    const d = new Date(isoString);
    const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
    const hours = d.getHours().toString().padStart(2, '0');
    return `${hours}:00 - ${dateStr}`;
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Love history</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Grid Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLOR_PALETTE.brightPink} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item._id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.rowSpacing}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItemBorder}
              onPress={() => setSelectedMoment(item)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(255,178,197,0.4)', 'rgba(255,78,114,0.1)']}
                style={styles.gridItemGradient}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.gridItemImage}
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon
                name="folder-open-outline"
                size={60}
                color="rgba(255,226,234,0.3)"
              />
              <Text style={styles.emptyText}>Chưa có ảnh lịch sử nào</Text>
            </View>
          }
        />
      )}

      {/* Full Screen Image Preview Modal */}
      {selectedMoment && (
        <Modal
          visible={!!selectedMoment}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMoment(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setSelectedMoment(null)}
            />

            <View style={styles.modalContentBorder}>
              <LinearGradient
                colors={['#FFC0D3', '#E04A76']}
                style={styles.modalContentGradient}
              >
                <View style={styles.modalContent}>
                  {/* Close button */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedMoment(null)}
                  >
                    <Icon name="close" size={24} color="#FFF" />
                  </TouchableOpacity>

                  {/* Photo */}
                  <Image
                    source={{ uri: selectedMoment.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  {/* Overlay Details */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.modalTextOverlay}
                  />

                  <View style={styles.modalTexts}>
                    <Text style={styles.modalDate}>
                      {formatDateText(selectedMoment.createdAt)}
                    </Text>
                    <Text style={styles.modalCaption}>
                      {selectedMoment.caption || 'Một khoảnh khắc tuyệt vời'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {/* Premium Bottom Tab Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Left: History Grid Button (Active) */}
        <TouchableOpacity
          style={styles.navButtonActive}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Icon name="images" size={28} color={COLOR_PALETTE.brightPink} />
        </TouchableOpacity>

        {/* Center: Rose Camera Button */}
        <TouchableOpacity
          style={styles.roseButtonContainer}
          onPress={() => navigation.navigate('MomentTaking')}
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

        {/* Right: Messages Chat Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleChatPress}
          activeOpacity={0.7}
        >
          <Icon name="chatbubble-outline" size={28} color="#FFE0EA" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoveHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
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
    fontSize: 18,
    fontFamily: 'Serif',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  rowSpacing: {
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  gridItemBorder: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gridItemGradient: {
    flex: 1,
    padding: 1,
  },
  gridItemImage: {
    flex: 1,
    borderRadius: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyText: {
    color: 'rgba(255,226,234,0.4)',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalContentBorder: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF4E72',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  modalContentGradient: {
    padding: 1.5,
    borderRadius: 28,
  },
  modalContent: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#120206',
    height: SH * 0.6,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalTextOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  modalTexts: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  modalDate: {
    color: 'rgba(255, 178, 197, 0.8)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalCaption: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
    lineHeight: 24,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(18, 4, 9, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 178, 197, 0.15)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  navButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  navButtonActive: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255, 78, 114, 0.12)',
  },
  roseButtonContainer: {
    width: 86,
    height: 86,
    transform: [{ translateY: -20 }],
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
