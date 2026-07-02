/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import COLOR_PALETTE from '@/styles/colorPalette';
import { useSocket } from '@/context/SocketContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '@/store/appStore';
import { chatService } from '@/services/chatService';
import { userService } from '@/services/userService';
import LoadingOverlay from '@/components/LoadingOverlay';
import { coupleService } from '@/services/coupleService';
import { extractUserFromResponse, isCoupleMode } from '@/utils/userResponse';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  type: number;
}

type AiMode = 'gift' | 'address';

type AiOption = {
  id: string;
  name: string;
  description: string;
  price: string;
  raw: any;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const chatAssets = {
  button: require('../assets/button.webp'),
  cloud: require('../assets/cloud.webp'),
  butterfly: require('../assets/butterfly_light.webp'),
  rose: require('../assets/rose_light.webp'),
};

const asArray = (value: any) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)];
};

const getDisplayName = (user: any, fallback = 'You') =>
  user?.profile?.name || user?.name || user?.username || fallback;

const getBirthday = (user: any) => user?.profile?.birthday || user?.birthday;

const getAge = (birthday?: string) => {
  if (!birthday) return null;
  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age > 0 ? age : null;
};

const getGenderText = (gender: any) => {
  if (gender === 1 || gender === '1' || gender === 'female') return 'female';
  if (
    gender === 0 ||
    gender === 2 ||
    gender === '0' ||
    gender === '2' ||
    gender === 'male'
  )
    return 'male';
  return 'any';
};

const profileSummary = (currentUser: any, targetUser: any) => {
  const currentName = getDisplayName(currentUser, 'Me');
  const targetName = getDisplayName(targetUser, 'Partner');
  const currentInterests = [
    ...asArray(currentUser?.profile?.interest || currentUser?.interests),
    ...asArray(currentUser?.profile?.personalityTags),
  ];
  const targetInterests = [
    ...asArray(targetUser?.profile?.interest || targetUser?.interests),
    ...asArray(targetUser?.profile?.personalityTags),
  ];
  const interests = [...new Set([...currentInterests, ...targetInterests])];
  const currentAge = getAge(getBirthday(currentUser));
  const targetAge = getAge(getBirthday(targetUser));

  return {
    interests: interests.length ? interests.join(', ') : 'any',
    gender: `${currentName}: ${getGenderText(
      currentUser?.profile?.gender || currentUser?.gender,
    )}, ${targetName}: ${getGenderText(
      targetUser?.profile?.gender || targetUser?.gender,
    )}`,
    age: `${currentName}: ${currentAge || 'any'}, ${targetName}: ${
      targetAge || 'any'
    }`,
  };
};

const unwrapAiResponse = (value: any) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value?.data || value?.result || value?.recommendation || value;
};

const normalizeAiResponse = (value: any) => {
  if (!value) return 'No recommendation returned.';
  if (typeof value === 'string') return value;
  const preferred =
    value.recommendation ||
    value.result ||
    value.message ||
    value.data?.recommendation ||
    value.data?.result ||
    value.data?.message ||
    value.data;
  if (typeof preferred === 'string') return preferred;
  return JSON.stringify(preferred || value, null, 2);
};

const parseAiOptions = (value: any, mode: AiMode): AiOption[] => {
  const unwrapped = unwrapAiResponse(value);
  const source =
    mode === 'gift'
      ? unwrapped?.gifts || unwrapped?.data?.gifts || unwrapped
      : unwrapped?.addresses || unwrapped?.data?.addresses || unwrapped;

  if (!Array.isArray(source)) return [];

  return source.map((item: any, index: number) => {
    const fallbackName =
      mode === 'gift' ? `Gift option ${index + 1}` : `Date spot ${index + 1}`;
    const name =
      item?.name ||
      item?.title ||
      item?.giftName ||
      item?.place ||
      fallbackName;
    const description =
      item?.description ||
      item?.desc ||
      item?.reason ||
      item?.summary ||
      'No description provided.';
    const priceValue =
      item?.price ??
      item?.budget ??
      item?.priceRange ??
      item?.estimatedPrice ??
      'any';

    return {
      id: `${mode}_${index}_${name}`,
      name: String(name),
      description: String(description),
      price: String(priceValue),
      raw: item,
    };
  });
};

const formatAiCardMessage = (option: AiOption, mode: AiMode) => {
  const label = mode === 'gift' ? 'Gift idea' : 'Date address';
  return `${label}: ${option.name}\nDescription: ${option.description}\nPrice: ${option.price}`;
};

const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params || {};
  const targetUser = params.targetUser || {};
  const { socket, emit } = useSocket();
  const {
    user: currentUser,
    conversationId: globalConvId,
    setConversationId,
    setUser,
  } = useAppStore();
  const conversationId = params.conversationId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCoupleModal, setShowCoupleModal] = useState(false);
  const [fullTargetUser, setFullTargetUser] = useState(targetUser);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('gift');
  const [aiEvent, setAiEvent] = useState('');
  const [aiBudget, setAiBudget] = useState('');
  const [aiAddress, setAiAddress] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiOptions, setAiOptions] = useState<AiOption[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const aiButtonPosition = useRef(
    new Animated.ValueXY({ x: 18, y: SCREEN_HEIGHT - 128 }),
  ).current;

  const aiPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        aiButtonPosition.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: aiButtonPosition.x, dy: aiButtonPosition.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: (_, gesture) => {
        aiButtonPosition.flattenOffset();
        if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) {
          setAiModalVisible(true);
        }
      },
    }),
  ).current;

  const getTargetUserId = () =>
    fullTargetUser?._id ||
    fullTargetUser?.id ||
    targetUser._id ||
    targetUser.id ||
    targetUser.userId;

  const getLatestTargetUser = async () => {
    const targetId = getTargetUserId();

    if (!targetId) {
      throw new Error('Missing target user ID');
    }

    const targetProfileRes = await userService.getUserById(targetId);
    const latestTargetUser =
      extractUserFromResponse(targetProfileRes) || targetProfileRes?.data;

    if (latestTargetUser) {
      setFullTargetUser({
        ...fullTargetUser,
        ...latestTargetUser,
        name:
          latestTargetUser.profile?.name ||
          latestTargetUser.name ||
          fullTargetUser.name,
        avatarUrl:
          latestTargetUser.avatarUrl ||
          latestTargetUser.profile?.avatarUrl ||
          fullTargetUser.avatarUrl,
        profile: latestTargetUser.profile || fullTargetUser.profile,
      });
    }

    return latestTargetUser;
  };

  const refreshCurrentUser = async () => {
    const profileRes = await userService.getProfile();
    const userData = extractUserFromResponse(profileRes);

    if (userData) {
      await setUser(userData);
    }
  };

  const ensureTargetAvailableForCoupleMode = async () => {
    const latestTargetUser = await getLatestTargetUser();

    if (isCoupleMode(latestTargetUser)) {
      const name = getDisplayName(latestTargetUser, 'This user');
      Alert.alert(
        'Cannot enter couple mode',
        name + ' is already in couple mode.',
      );
      return false;
    }

    return true;
  };

  const handleAcceptCoupleMode = async () => {
    try {
      if (isCoupleMode(currentUser)) {
        Alert.alert(
          'Already in couple mode',
          'You are already in couple mode.',
        );
        return;
      }

      const canEnterCoupleMode = await ensureTargetAvailableForCoupleMode();
      if (canEnterCoupleMode) {
        setShowCoupleModal(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to check couple mode status',
      );
    }
  };

  const confirmAcceptCoupleMode = async () => {
    try {
      const canEnterCoupleMode = await ensureTargetAvailableForCoupleMode();

      if (!canEnterCoupleMode) {
        setShowCoupleModal(false);
        return;
      }

      await coupleService.acceptCouple(getTargetUserId());
      await refreshCurrentUser();
      setShowCoupleModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setShowCoupleModal(false);
    }
  };

  useEffect(() => {
    if (conversationId && conversationId !== globalConvId) {
      setConversationId(conversationId);
    }
  }, [
    conversationId,
    globalConvId,
    setConversationId,
    currentUser,
    targetUser,
  ]);

  useEffect(() => {
    const fetchTargetProfile = async () => {
      const targetId = targetUser._id || targetUser.id;
      if (targetId) {
        try {
          const res = await userService.getUserById(targetId);
          const userData = res.data;
          if (userData) {
            setFullTargetUser({
              ...targetUser,
              ...userData,
              name: userData.profile?.name || userData.name || targetUser.name,
              avatarUrl:
                userData.avatarUrl ||
                userData.profile?.avatarUrl ||
                targetUser.avatarUrl,
              profile: userData.profile,
            });
          }
        } catch (error) {
          console.error('[ChatScreen] Failed to fetch target profile:', error);
        }
      }
    };
    fetchTargetProfile();
  }, [targetUser]);

  useEffect(() => {
    if (params.isFirstFriendshipMessage) {
      const systemMsg: Message = {
        id: 'system_1',
        senderId: 'system',
        content: 'You and ' + targetUser.name + ' have become friends',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 0,
      };
      setMessages([systemMsg]);
    }
  }, [params.isFirstFriendshipMessage, targetUser.name]);

  const fetchMessages = useCallback(async () => {
    if (conversationId) {
      try {
        if (messages.length === 0) setLoading(true);
        const res = await chatService.getMessages(conversationId);
        const history = Array.isArray(res)
          ? res
          : res.data && Array.isArray(res.data)
          ? res.data
          : res.data?.messages && Array.isArray(res.data.messages)
          ? res.data.messages
          : res.messages || [];

        if (history.length === 0) {
          const targetId = targetUser._id;
          let interests = ['any'];
          try {
            const profileRes = await userService.getUserById(targetId);
            interests = profileRes.data?.profile?.interest || ['any'];
          } catch (err) {
            console.warn('[ChatScreen] Failed to fetch interests for AI:', err);
          }
          const aiRes = await chatService.startAIConversation(interests);
          setAiSuggestions(aiRes);
        }

        const historyMessages = history
          .map((m: any) => ({ ...m, id: m._id }))
          .reverse();

        setMessages(historyMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [conversationId, targetUser._id]);

  useEffect(() => {
    fetchMessages();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMessages();
    });
    return unsubscribe;
  }, [fetchMessages, navigation]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    emit('conversation:join', { conversationId });

    const handleNewMessage = (data: any) => {
      const newMsg = data.newMessage || data;
      setMessages(prev => {
        const msgId = newMsg.id || newMsg._id;
        if (prev.find(m => (m.id || (m as any)._id) === msgId)) return prev;
        if (newMsg.senderId !== targetUser._id) return prev;
        return [...prev, { ...newMsg, id: msgId }];
      });
      emit('message:seen', {
        messageId: newMsg.id || newMsg._id,
        conversationId,
      });
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.emit('conversation:leave', { conversationId });
    };
  }, [socket, emit, conversationId]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const currentId = currentUser?._id;
    const messageData = {
      content: inputText.trim(),
      type: 1,
      conversationId,
    };

    const tempId = 'temp_' + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      senderId: currentId,
      content: inputText.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      type: 1,
    };

    setMessages(prev => [...prev, optimisticMsg]);

    emit('message:send', messageData, (callback: any) => {
      if (callback && (callback.id || callback._id)) {
        setMessages(prev =>
          prev.map(m =>
            m.id === tempId ? { ...m, id: callback.id || callback._id } : m,
          ),
        );
      }
    });

    setInputText('');
  };

  const handleAiRecommend = async () => {
    const profile = profileSummary(currentUser, fullTargetUser);
    const basePayload = {
      interests: profile.interests,
      event: aiEvent.trim() || 'any',
      budget: aiBudget.trim() || 'any',
      gender: profile.gender,
      age: profile.age,
    };

    try {
      setAiLoading(true);
      setAiResult('');
      setAiOptions([]);
      const result =
        aiMode === 'gift'
          ? await chatService.recommendGift(basePayload)
          : await chatService.recommendEntertainmentAddress({
              ...basePayload,
              address: aiAddress.trim() || 'any',
            });
      const options = parseAiOptions(result, aiMode);
      setAiOptions(options);
      setAiResult(options.length ? '' : normalizeAiResponse(result));
    } catch (error: any) {
      Alert.alert(
        'AI Assistant',
        error.message || 'Failed to get recommendation',
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectAiOption = (option: AiOption) => {
    setInputText(formatAiCardMessage(option, aiMode));
    setAiModalVisible(false);
  };

  const formatMessageTime = (item: any) => {
    const rawDate =
      item.createdAt || item.created_at || item.timestamp || item.date;
    const dateObj = rawDate ? new Date(rawDate) : new Date();
    if (Number.isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.senderId === 'system') {
      return (
        <View style={styles.systemMessageWrapper}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    const senderId =
      item.senderId || (item as any).fromUserId || (item as any).userId;
    const isMe = senderId === currentUser?._id;

    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
        ]}
      >
        {!isMe && (
          <View style={styles.messageAvatarFrame}>
            {fullTargetUser.avatarUrl ? (
              <Image
                source={{ uri: fullTargetUser.avatarUrl }}
                style={styles.messageAvatar}
              />
            ) : (
              <Text style={styles.avatarInitial}>
                {fullTargetUser.name?.[0] || '?'}
              </Text>
            )}
          </View>
        )}
        <View
          style={
            isMe ? styles.myMessageContainer : styles.theirMessageContainer
          }
        >
          <View
            style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
          >
            <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>
              {item.content}
            </Text>
          </View>
          <Text
            style={[
              styles.timestamp,
              isMe ? styles.myTimestamp : styles.theirTimestamp,
            ]}
          >
            {formatMessageTime(item)}
          </Text>
        </View>
      </View>
    );
  };

  const profile = profileSummary(currentUser, fullTargetUser);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020001" />
      <LinearGradient
        colors={['#000000', '#030002', '#110511', '#25051C']}
        locations={[0, 0.48, 0.78, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.backgroundAssets}>
        <Image
          source={chatAssets.cloud}
          style={styles.cloudLeft}
          resizeMode="contain"
        />
        <Image
          source={chatAssets.cloud}
          style={styles.cloudRight}
          resizeMode="contain"
        />
      </View>

      <View style={styles.headerStage}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
          activeOpacity={0.82}
        >
          <Icon name="chevron-back" size={22} color={COLOR_PALETTE.pink} />
        </TouchableOpacity>

        <View style={styles.namePlate}>
          <Image
            source={chatAssets.button}
            style={styles.namePlateImage}
            resizeMode="stretch"
          />
          <Text style={styles.headerName} numberOfLines={1}>
            {fullTargetUser.name || 'Partner'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={handleAcceptCoupleMode}
          activeOpacity={0.82}
        >
          <Icon name="heart" size={18} color={COLOR_PALETTE.pink} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item =>
            item.id || (item as any)._id || Math.random().toString()
          }
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            messages.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={['#FFEFEF', COLOR_PALETTE.pink, '#D783A0']}
                  style={styles.emptyAvatarFrame}
                >
                  {fullTargetUser.avatarUrl ? (
                    <Image
                      source={{ uri: fullTargetUser.avatarUrl }}
                      style={styles.emptyAvatar}
                    />
                  ) : (
                    <Text style={styles.emptyAvatarInitial}>
                      {fullTargetUser.name?.[0] || '?'}
                    </Text>
                  )}
                </LinearGradient>
                <Text style={styles.emptySubtext}>
                  Say something to start{`\n`}the conversation.
                </Text>
              </View>
            ) : null
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {aiSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={aiSuggestions}
              keyExtractor={(item, index) => 'suggest_' + index}
              contentContainerStyle={styles.suggestionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionBubble}
                  activeOpacity={0.82}
                  onPress={() => {
                    setInputText(item);
                    setAiSuggestions(prev => prev.filter(s => s !== item));
                  }}
                >
                  <Icon
                    name="sparkles"
                    size={13}
                    color={COLOR_PALETTE.roseRed}
                  />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={styles.inputArea}>
          <View style={styles.bottomOrnamentRow}>
            <View style={styles.bottomOrnamentLine} />
            <Icon name="heart" size={10} color={COLOR_PALETTE.pink} />
            <View style={styles.bottomOrnamentLine} />
          </View>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.composerAvatar}
              onPress={() => setAiModalVisible(true)}
              activeOpacity={0.82}
            >
              <Icon name="sparkles" size={18} color={COLOR_PALETTE.roseRed} />
            </TouchableOpacity>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Say something..."
                placeholderTextColor="rgba(255, 226, 234, 0.52)"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
            </View>
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSend}
              activeOpacity={0.82}
            >
              <Icon name="heart" size={25} color={COLOR_PALETTE.pink} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Animated.View
        {...aiPanResponder.panHandlers}
        style={[
          styles.aiFloatButton,
          { transform: aiButtonPosition.getTranslateTransform() },
        ]}
      >
        <Icon name="sparkles" size={24} color={COLOR_PALETTE.roseRed} />
        <Text style={styles.aiFloatText}>AI</Text>
      </Animated.View>

      <LoadingOverlay visible={loading} message="Loading Signal..." />

      <Modal
        visible={aiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.aiModalContent}>
            <View style={styles.aiModalHeader}>
              <View>
                <Text style={styles.aiModalKicker}>DearU Assistant</Text>
                <Text style={styles.aiModalTitle}>Plan something sweet</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAiModalVisible(false)}
                style={styles.aiCloseButton}
              >
                <Icon name="close" size={20} color={COLOR_PALETTE.pink} />
              </TouchableOpacity>
            </View>

            <View style={styles.aiModeRow}>
              <TouchableOpacity
                style={[
                  styles.aiModeButton,
                  aiMode === 'gift' && styles.aiModeButtonActive,
                ]}
                onPress={() => setAiMode('gift')}
              >
                <Icon
                  name="gift-outline"
                  size={16}
                  color={
                    aiMode === 'gift'
                      ? COLOR_PALETTE.roseRed
                      : COLOR_PALETTE.pink
                  }
                />
                <Text
                  style={[
                    styles.aiModeText,
                    aiMode === 'gift' && styles.aiModeTextActive,
                  ]}
                >
                  Gift
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.aiModeButton,
                  aiMode === 'address' && styles.aiModeButtonActive,
                ]}
                onPress={() => setAiMode('address')}
              >
                <Icon
                  name="location-outline"
                  size={16}
                  color={
                    aiMode === 'address'
                      ? COLOR_PALETTE.roseRed
                      : COLOR_PALETTE.pink
                  }
                />
                <Text
                  style={[
                    styles.aiModeText,
                    aiMode === 'address' && styles.aiModeTextActive,
                  ]}
                >
                  Address
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.aiProfileBox}>
              <Text style={styles.aiProfileLabel}>Auto profile</Text>
              <Text style={styles.aiProfileText} numberOfLines={3}>
                Interests: {profile.interests}
                {'\n'}Gender: {profile.gender}
                {'\n'}Age: {profile.age}
              </Text>
            </View>

            <TextInput
              style={styles.aiInput}
              placeholder="Event, e.g. birthday, first date..."
              placeholderTextColor="rgba(255, 226, 234, 0.45)"
              value={aiEvent}
              onChangeText={setAiEvent}
            />
            <TextInput
              style={styles.aiInput}
              placeholder="Budget, e.g. 500k, under $30..."
              placeholderTextColor="rgba(255, 226, 234, 0.45)"
              value={aiBudget}
              onChangeText={setAiBudget}
            />
            {aiMode === 'address' && (
              <TextInput
                style={styles.aiInput}
                placeholder="Current address or area..."
                placeholderTextColor="rgba(255, 226, 234, 0.45)"
                value={aiAddress}
                onChangeText={setAiAddress}
              />
            )}

            <TouchableOpacity
              style={styles.aiSubmitButton}
              onPress={handleAiRecommend}
              disabled={aiLoading}
              activeOpacity={0.86}
            >
              {aiLoading ? (
                <ActivityIndicator color={COLOR_PALETTE.roseRed} />
              ) : (
                <>
                  <Icon
                    name="sparkles"
                    size={17}
                    color={COLOR_PALETTE.roseRed}
                  />
                  <Text style={styles.aiSubmitText}>Ask assistant</Text>
                </>
              )}
            </TouchableOpacity>

            {aiOptions.length > 0 && (
              <ScrollView
                style={styles.aiOptionsList}
                showsVerticalScrollIndicator={false}
              >
                {aiOptions.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.aiOptionCard}
                    activeOpacity={0.86}
                    onPress={() => handleSelectAiOption(option)}
                  >
                    <View style={styles.aiOptionHeader}>
                      <View style={styles.aiOptionIcon}>
                        <Icon
                          name={
                            aiMode === 'gift'
                              ? 'gift-outline'
                              : 'location-outline'
                          }
                          size={16}
                          color={COLOR_PALETTE.roseRed}
                        />
                      </View>
                      <Text style={styles.aiOptionName} numberOfLines={1}>
                        {option.name}
                      </Text>
                    </View>
                    <Text style={styles.aiOptionDescription} numberOfLines={3}>
                      {option.description}
                    </Text>
                    <View style={styles.aiOptionFooter}>
                      <Text style={styles.aiOptionPrice}>
                        Price: {option.price}
                      </Text>
                      <Text style={styles.aiOptionTap}>Tap to fill</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {!!aiResult && aiOptions.length === 0 && (
              <ScrollView
                style={styles.aiResultBox}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.aiResultText}>{aiResult}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCoupleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCoupleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[COLOR_PALETTE.pink, COLOR_PALETTE.amaranthPink]}
              style={styles.modalIconContainer}
            >
              <Icon name="heart" size={38} color="#FFF" />
            </LinearGradient>
            <Text style={styles.modalTitle}>Enter Couple Mode?</Text>
            <Text style={styles.modalDescription}>
              Unlock a dedicated space for you and{' '}
              {fullTargetUser.name || 'your partner'}.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCoupleModal(false)}
              >
                <Text style={styles.cancelBtnText}>Maybe Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalBtn}
                onPress={confirmAcceptCoupleMode}
              >
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020001', overflow: 'hidden' },
  backgroundAssets: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  keyboardView: { flex: 1, zIndex: 2 },
  headerStage: {
    zIndex: 3,
    paddingTop: 46,
    paddingHorizontal: 22,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.34)',
  },
  namePlate: {
    width: Math.min(SCREEN_WIDTH - 130, 240),
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  namePlateImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    transform: [{ scaleX: 1.05 }, { scaleY: 0.98 }],
  },
  headerName: {
    maxWidth: '72%',
    color: '#6C1F32',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    transform: [{ translateY: -4 }],
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 22,
  },
  emptyListContent: { justifyContent: 'center' },
  messageWrapper: { flexDirection: 'row', marginBottom: 12, maxWidth: '86%' },
  myMessageWrapper: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  theirMessageWrapper: { alignSelf: 'flex-start' },
  messageAvatarFrame: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    alignSelf: 'flex-end',
    backgroundColor: COLOR_PALETTE.mimiPink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  messageAvatar: { width: '100%', height: '100%' },
  avatarInitial: { color: '#6C1F32', fontSize: 11, fontWeight: '900' },
  myMessageContainer: { alignItems: 'flex-end' },
  theirMessageContainer: { alignItems: 'flex-start' },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 17,
    maxWidth: Math.min(SCREEN_WIDTH * 0.72, 285),
  },
  myBubble: {
    backgroundColor: 'rgba(28, 8, 20, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.66)',
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    backgroundColor: COLOR_PALETTE.mimiPink,
    borderWidth: 1,
    borderColor: '#FFDCE5',
    borderBottomLeftRadius: 6,
  },
  myMessageText: {
    color: '#FFF4F7',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  theirMessageText: {
    color: '#33121F',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  timestamp: {
    fontSize: 8,
    color: 'rgba(255, 226, 234, 0.34)',
    marginTop: 3,
    fontWeight: '700',
  },
  myTimestamp: { marginRight: 7 },
  theirTimestamp: { marginLeft: 7 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -30 }],
  },
  emptyAvatarFrame: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  emptyAvatar: { width: '100%', height: '100%', borderRadius: 49 },
  emptyAvatarInitial: { color: '#6C1F32', fontSize: 34, fontWeight: '900' },
  emptySubtext: {
    color: 'rgba(255, 226, 234, 0.54)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionsContainer: { paddingVertical: 8, zIndex: 3 },
  suggestionsList: { paddingHorizontal: 24, gap: 10 },
  suggestionBubble: {
    width: 250,
    backgroundColor: 'rgba(18, 3, 11, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.42)',
  },
  suggestionText: {
    flex: 1,
    color: '#FFF4F7',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  inputArea: {
    zIndex: 3,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingTop: 6,
  },
  bottomOrnamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bottomOrnamentLine: {
    width: 54,
    height: 1,
    backgroundColor: 'rgba(255, 194, 209, 0.34)',
  },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  composerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PALETTE.mimiPink,
    borderWidth: 1,
    borderColor: '#FFF2F4',
  },
  inputWrapper: {
    flex: 1,
    minHeight: 42,
    maxHeight: 92,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.54)',
  },
  input: {
    color: '#FFF4F7',
    fontSize: 13,
    maxHeight: 76,
    paddingTop: Platform.OS === 'ios' ? 0 : 4,
    paddingBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiFloatButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLOR_PALETTE.mimiPink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFF2F4',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 12,
  },
  aiFloatText: {
    color: COLOR_PALETTE.roseRed,
    fontSize: 10,
    fontWeight: '900',
    marginTop: -2,
  },
  systemMessageWrapper: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 194, 209, 0.1)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.2)',
  },
  systemMessageText: {
    color: COLOR_PALETTE.pink,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: 20,
  },
  aiModalContent: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#12030B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.28)',
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  aiModalKicker: {
    color: COLOR_PALETTE.amaranthPink,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 3,
  },
  aiModalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  aiCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 194, 209, 0.08)',
  },
  aiModeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  aiModeButton: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  aiModeButtonActive: {
    backgroundColor: COLOR_PALETTE.mimiPink,
    borderColor: COLOR_PALETTE.pink,
  },
  aiModeText: { color: COLOR_PALETTE.pink, fontSize: 13, fontWeight: '900' },
  aiModeTextActive: { color: COLOR_PALETTE.roseRed },
  aiProfileBox: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 194, 209, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.18)',
    marginBottom: 12,
  },
  aiProfileLabel: {
    color: COLOR_PALETTE.pink,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  aiProfileText: {
    color: 'rgba(255, 226, 234, 0.74)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  aiInput: {
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 14,
    color: '#FFF4F7',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.28)',
    marginBottom: 10,
  },
  aiSubmitButton: {
    height: 46,
    borderRadius: 18,
    backgroundColor: COLOR_PALETTE.mimiPink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  aiSubmitText: {
    color: COLOR_PALETTE.roseRed,
    fontSize: 14,
    fontWeight: '900',
  },
  aiOptionsList: { maxHeight: 260, marginTop: 12 },
  aiOptionCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 194, 209, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.24)',
  },
  aiOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiOptionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_PALETTE.mimiPink,
    marginRight: 9,
  },
  aiOptionName: { flex: 1, color: '#FFF4F7', fontSize: 15, fontWeight: '900' },
  aiOptionDescription: {
    color: 'rgba(255, 226, 234, 0.76)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  aiOptionFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiOptionPrice: { color: COLOR_PALETTE.pink, fontSize: 12, fontWeight: '900' },
  aiOptionTap: {
    color: 'rgba(255, 226, 234, 0.46)',
    fontSize: 11,
    fontWeight: '800',
  },
  aiResultBox: {
    maxHeight: 190,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.18)',
  },
  aiResultText: {
    color: '#FFF4F7',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#12030B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.28)',
  },
  modalIconContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    color: 'rgba(255, 226, 234, 0.66)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtnText: {
    color: 'rgba(255, 226, 234, 0.58)',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmModalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR_PALETTE.mimiPink,
  },
  confirmBtnText: {
    color: COLOR_PALETTE.roseRed,
    fontSize: 14,
    fontWeight: '900',
  },
  cloudLeft: {
    position: 'absolute',
    left: -70,
    bottom: -30,
    width: Math.min(SCREEN_WIDTH * 0.78, 360),
    height: 210,
    opacity: 0.28,
    transform: [{ scale: 1.8 }],
  },
  cloudRight: {
    position: 'absolute',
    right: -76,
    bottom: -26,
    width: Math.min(SCREEN_WIDTH * 0.72, 340),
    height: 210,
    opacity: 0.3,
    transform: [{ scaleX: -1.8 }, { scaleY: 1.8 }],
  },
});

export default ChatScreen;
