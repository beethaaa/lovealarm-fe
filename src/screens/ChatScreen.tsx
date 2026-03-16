/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
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
import { Alert } from 'react-native';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  type: number;
}

const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { targetUser } = route.params;
  const { socket, emit } = useSocket();
  const {
    user: currentUser,
    conversationId: globalConvId,
    setConversationId,
  } = useAppStore();
  const conversationId = route.params?.conversationId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCoupleModal, setShowCoupleModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleAcceptCoupleMode = () => {
    setShowCoupleModal(true);
  };

  const confirmAcceptCoupleMode = async () => {
    try {
      await coupleService.acceptCouple(targetUser._id);
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

  const [fullTargetUser, setFullTargetUser] = useState(targetUser);

  useEffect(() => {
    const fetchTargetProfile = async () => {
      const targetId = targetUser._id || targetUser.id;
      if (targetId) {
        try {
          console.log(
            '[ChatScreen] Fetching full target profile for ID:',
            targetId,
          );
          const res = await userService.getUserById(targetId);
          const userData = res.data;
          if (userData) {
            console.log(
              '[ChatScreen] Fetched Target Profile:',
              JSON.stringify(userData),
            );
            setFullTargetUser({
              ...targetUser,
              name: userData.profile?.name,
              avatarUrl: userData.avatarUrl,
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
    if (route.params.isFirstFriendshipMessage) {
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
  }, [route.params.isFirstFriendshipMessage, targetUser.name]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (conversationId) {
        console.log('conversation: ', conversationId);

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
            console.log(
              '[ChatScreen] First conversation detected, starting AI...',
            );
            const targetId = targetUser._id;
            let interests = ['any'];
            try {
              const profileRes = await userService.getUserById(targetId);
              interests = profileRes.data?.profile?.interest || ['any'];
            } catch (err) {
              console.warn(
                '[ChatScreen] Failed to fetch interests for AI:',
                err,
              );
            }
            const aiRes = await chatService.startAIConversation(interests);
            setAiSuggestions(aiRes);
          }
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id || (m as any)._id));
            const newHistory = history
              .map((m: any) => ({
                ...m,
                id: m._id,
              }))
              .filter((m: any) => !existingIds.has(m.id));
            return [...newHistory.reverse(), ...prev];
          });
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    emit('conversation:join', { conversationId: conversationId });

    const handleNewMessage = (data: any) => {
      console.log('[ChatScreen] Received message:new:', data);
      const newMsg = data.newMessage || data;
      setMessages(prev => {
        const msgId = newMsg.id || newMsg._id;
        if (prev.find(m => (m.id || (m as any)._id) === msgId)) return prev;
        return [...prev, { ...newMsg, id: msgId }];
      });
      console.log('conversationIdddddddđ', conversationId);
      emit(
        'message:seen',
        {
          messageId: newMsg.id || newMsg._id,
          conversationId: conversationId,
        },
        (callback: any) => {
          console.log('[ChatScreen] message:seen callback:', callback);
        },
      );
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.emit('conversation:leave', { conversationId: conversationId });
    };
  }, [socket, emit, conversationId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    console.log('currentUserrrrrrrrrrrrr', conversationId);

    const currentId = currentUser._id;
    const messageData = {
      content: inputText.trim(),
      type: 1,
      conversationId: conversationId,
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
      console.log('[ChatScreen] message:send callback:', callback);
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

  const formatMessageTime = (item: any) => {
    const rawDate =
      item.createdAt || item.created_at || item.timestamp || item.date;
    const dateObj = rawDate ? new Date(rawDate) : new Date();

    if (isNaN(dateObj.getTime())) {
      return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

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
    const isMe = senderId === currentUser._id;
    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
        ]}
      >
        {!isMe && (
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: fullTargetUser.avatarUrl }}
              style={styles.messageAvatar}
            />
          </View>
        )}
        <View
          style={
            isMe ? styles.myMessageContainer : styles.theirMessageContainer
          }
        >
          {isMe ? (
            <View style={[styles.bubble, styles.myBubble]}>
              <Text style={styles.myMessageText}>{item.content}</Text>
            </View>
          ) : (
            <View style={[styles.bubble, styles.theirBubble]}>
              <Text style={styles.theirMessageText}>{item.content}</Text>
            </View>
          )}
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <LinearGradient
        colors={['rgba(13, 13, 13, 0.95)', 'rgba(13, 13, 13, 0.8)']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatarWrapper}>
            <LinearGradient
              colors={[COLOR_PALETTE.pink, COLOR_PALETTE.amaranthPink]}
              style={styles.headerAvatarGlow}
            >
              <View style={styles.headerAvatarContainer}>
                {fullTargetUser.avatarUrl ? (
                  <Image
                    source={{ uri: fullTargetUser.avatarUrl }}
                    style={styles.headerAvatar}
                  />
                ) : (
                  <View style={styles.headerAvatarPlaceholder}>
                    <Text style={styles.headerInitials}>
                      {fullTargetUser.name?.[0]}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </View>
          <View>
            <Text style={styles.headerName}>{fullTargetUser.name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerStatus}>Active Now</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.radarBtn}
          onPress={handleAcceptCoupleMode}
        >
          <Icon name="heart" size={20} color={COLOR_PALETTE.pink} />
        </TouchableOpacity>
      </LinearGradient>

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
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyAvatarContainer}>
                <Image
                  source={{ uri: fullTargetUser.avatarUrl }}
                  style={styles.emptyAvatar}
                />
              </View>
              <Text style={styles.emptyText}>{fullTargetUser.name}</Text>
              <Text style={styles.emptySubtext}>
                Say something to start the conversation.
              </Text>
            </View>
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
                  onPress={() => {
                    setInputText(item);
                    setAiSuggestions(prev => prev.filter(s => s !== item));
                  }}
                >
                  <View style={styles.botIconWrapper}>
                    <Icon name="sparkles" size={12} color="#FFF" />
                  </View>
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Say something..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Icon name="paper-plane" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={loading} message="Loading Signal..." />

      <Modal
        visible={showCoupleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCoupleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
            style={styles.modalBackdrop}
          >
            <View style={styles.modalContent}>
              <LinearGradient
                colors={[COLOR_PALETTE.pink, COLOR_PALETTE.amaranthPink]}
                style={styles.modalIconContainer}
              >
                <Icon name="heart" size={40} color="#FFF" />
              </LinearGradient>

              <Text style={styles.modalTitle}>Enter Couple Mode?</Text>
              <Text style={styles.modalDescription}>
                By entering Couple Mode with {fullTargetUser.name}, you'll
                unlock exclusive features and a dedicated space for just the two
                of you.
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
                  <LinearGradient
                    colors={[COLOR_PALETTE.pink, COLOR_PALETTE.amaranthPink]}
                    style={styles.confirmGradient}
                  >
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
  },
  backBtn: {
    marginRight: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatarGlow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInitials: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#0D0D0D',
  },
  headerName: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  headerStatus: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  radarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 194, 209, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.2)',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    flexGrow: 1,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  theirMessageWrapper: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  myBubble: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderBottomRightRadius: 4,
    borderColor: 'rgba(255, 194, 209, 0.4)',
    boxShadow: 'inset 0px 1px 3px 0px #FFB2C5',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  theirBubble: {
    backgroundColor: COLOR_PALETTE.pink,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
    boxShadow: 'inset 0px 1px 3px 0px #000',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 2,
  },
  myMessageText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    textShadowColor: 'rgba(255, 194, 209, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  theirMessageText: {
    color: '#1A1A1A',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 4,
    fontWeight: '600',
  },
  myTimestamp: {
    marginRight: 4,
  },
  theirTimestamp: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255, 194, 209, 0.2)',
    padding: 5,
    marginBottom: 20,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  emptyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionsContainer: {
    paddingVertical: 12,
    backgroundColor: '#050505',
  },
  suggestionsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionBubble: {
    width: 270,
    backgroundColor: '#0D0D0D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 105, 180, 0.4)',
    boxShadow: 'inset 0px 1px 3px 0px #FFB2C5',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  botIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLOR_PALETTE.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: COLOR_PALETTE.pink,
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  suggestionText: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    boxShadow: 'inset 0px 1px 3px 0px #fff',
    elevation: 5,
  },
  input: {
    color: '#FFF',
    fontSize: 14,
    maxHeight: 100,
    paddingTop: Platform.OS === 'ios' ? 0 : 4,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLOR_PALETTE.pink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    boxShadow: 'inset 0px 1px 2px 0px #000',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  systemMessageWrapper: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 194, 209, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.1)',
  },
  systemMessageText: {
    color: COLOR_PALETTE.pink,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#121212',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.2)',
    boxShadow: '0px 10px 30px rgba(0,0,0,0.5)',
    elevation: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtnText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmModalBtn: {
    flex: 1,
    height: 55,
    borderRadius: 18,
    overflow: 'hidden',
  },
  confirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default ChatScreen;
