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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import COLOR_PALETTE from '@/styles/colorPalette';
import { useSocket } from '@/context/SocketContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '@/store/appStore';
import { chatService } from '@/services/chatService';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: number;
}

const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { targetUser } = route.params;
  const { socket, emit } = useSocket();
  const { user: currentUser, conversationId, setConversationId } = useAppStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    if (route.params?.conversationId && route.params.conversationId !== conversationId) {
      setConversationId(route.params.conversationId);
    }
  }, [route.params?.conversationId, conversationId, setConversationId]);



  useEffect(() => {
    if (route.params.isFirstFriendshipMessage) {
      const systemMsg: Message = {
        id: 'system_1',
        senderId: 'system',
        content: 'You and ' + targetUser.name + ' have become friends',
        timestamp: new Date().toISOString(),
        type: 0,
      };
      setMessages([systemMsg]);
    }
  }, [route.params.isFirstFriendshipMessage, targetUser.name]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (conversationId) {
        try {
          const res = await chatService.getMessages(conversationId);
          const history = Array.isArray(res) ? res : 
                          (res.data && Array.isArray(res.data) ? res.data : 
                          (res.data?.messages && Array.isArray(res.data.messages) ? res.data.messages :
                          (res.messages || [])));
          
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => (m.id || (m as any)._id)));
            const newHistory = history.map((m: any) => ({
              ...m,
              id: m._id,
            })).filter((m: any) => !existingIds.has(m.id));
            return [...newHistory, ...prev];
          });
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
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
      console.log("conversationIdddddddđ", conversationId)
      emit('message:seen', {
        messageId: newMsg.id || newMsg._id,
        conversationId: conversationId,
      }, (callback: any) => {
        console.log('[ChatScreen] message:seen callback:', callback);
      });
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.emit('conversation:leave', { conversationId: conversationId });
    };
  }, [socket, emit, conversationId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    console.log("currentUserrrrrrrrrrrrr", conversationId)

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
      timestamp: new Date().toISOString(),
      type: 1,
    };

    setMessages(prev => [...prev, optimisticMsg]);

    emit('message:send', messageData, (callback: any) => {
      console.log('[ChatScreen] message:send callback:', callback);
      if (callback && (callback.id || callback._id)) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: callback.id || callback._id } : m));
      }
    });

    setInputText('');
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.senderId === 'system') {
      return (
        <View style={styles.systemMessageWrapper}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }
    const senderId = item.senderId || (item as any).fromUserId || (item as any).userId;
    const isMe = senderId === (currentUser.id || currentUser._id || currentUser.userId);
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: targetUser.avatarUrl }}
              style={styles.messageAvatar}
            />
          </View>
        )}
        <View style={isMe ? styles.myMessageContainer : styles.theirMessageContainer}>
          {isMe ? (
            <LinearGradient
              colors={[COLOR_PALETTE.pink, '#FF4D6D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, styles.myBubble]}
            >
              <Text style={styles.messageText}>{item.content}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.bubble, styles.theirBubble]}>
              <Text style={styles.messageText}>{item.content}</Text>
            </View>
          )}
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatarWrapper}>
            <LinearGradient
              colors={[COLOR_PALETTE.pink, COLOR_PALETTE.amaranthPink]}
              style={styles.headerAvatarGlow}
            >
              <View style={styles.headerAvatarContainer}>
                {targetUser.avatarUrl ? (
                  <Image source={{ uri: targetUser.avatarUrl }} style={styles.headerAvatar} />
                ) : (
                  <View style={styles.headerAvatarPlaceholder}>
                    <Text style={styles.headerInitials}>{targetUser.name?.[0]}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </View>
          <View>
            <Text style={styles.headerName}>{targetUser.name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerStatus}>Active Now</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.radarBtn} 
          onPress={() => navigation.navigate('Main')}
        >
           <Icon name="heart" size={20} color={COLOR_PALETTE.pink} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id || (item as any)._id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyAvatarContainer}>
              <Image source={{ uri: targetUser.avatarUrl }} style={styles.emptyAvatar} />
            </View>
            <Text style={styles.emptyText}>{targetUser.name}</Text>
            <Text style={styles.emptySubtext}>Say something to start the conversation.</Text>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
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
    marginBottom: 20,
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
    marginRight: 10,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageText: {
    color: '#FFF',
    fontSize: 15,
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
  inputWrapper: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    color: '#FFF',
    fontSize: 15,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 0 : 4,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLOR_PALETTE.pink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
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
});

export default ChatScreen;
