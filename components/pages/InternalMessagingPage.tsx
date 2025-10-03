/**
 * @fileoverview InternalMessagingPage Module - Application module
 *
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Send, Search, MessageCircle, UserPlus, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast as realToast } from 'sonner';

// Simple className utility function
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface User {
  id: string;
  name: string;
  department: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

const users: User[] = [
  { id: '1', name: 'Ahmet Yılmaz', department: 'Yönetim', isOnline: true },
  { id: '2', name: 'Fatma Özkan', department: 'Ba��ış', isOnline: true },
];

const conversations: Conversation[] = [
  {
    id: '1',
    participants: users,
    lastMessage: {
      id: '1',
      senderId: '2',
      content: 'Merhaba, nasılsınız?',
      timestamp: '10:30',
    },
    unreadCount: 1,
  },
];

const messages: Message[] = [
  {
    id: '1',
    senderId: '2',
    content: 'Merhaba, nasılsınız?',
    timestamp: '10:30',
  },
];

/**
 * InternalMessagingPage function
 *
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function InternalMessagingPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserId = '1'; // TODO: Get from auth context

  // TC019 FIX: Real-time message subscription
  // Note: This will work when messages table exists in Supabase
  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          // Add new message to state when received
          console.log('New message received:', payload.new);
          // TODO: Update messages state when component uses real data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // TC019 FIX: Send message with Supabase
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      });

      if (error) {
        realToast.error('Mesaj gönderilemedi');
        return;
      }

      setNewMessage('');
    } catch {
      realToast.error('Bir hata oluştu');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage().catch(() => {
        // Error already handled in handleSendMessage
      });
    }
  };

  return (
    <div className="h-full bg-gray-50/50">
      <div className="container mx-auto h-full max-w-6xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <div>
            <h1 className="text-xl font-medium sm:text-2xl">Kurum İçi Mesajlaşma</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Ekip üyeleriyle anlık iletişim kurun
            </p>
          </div>

          <Button className="gap-2" size="sm">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Yeni Sohbet</span>
          </Button>
        </div>

        <div className="grid h-[calc(100vh-180px)] grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
          {/* Conversations Sidebar */}
          <div className="lg:col-span-4">
            <Card className="flex h-full flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Sohbetler</CardTitle>
                </div>
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                  <Input
                    placeholder="Sohbet ara..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="space-y-1 p-3">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation);
                      }}
                      className={cn(
                        'hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors',
                        selectedConversation?.id === conversation.id && 'bg-muted',
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                          <AvatarFallback>
                            {conversation.participants.find((p) => p.id !== '1')?.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.participants.find((p) => p.id !== '1')?.isOnline && (
                          <Circle className="absolute -right-1 -bottom-1 h-3 w-3 fill-green-500 text-green-500 sm:h-4 sm:w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="truncate text-sm font-medium sm:text-base">
                            {conversation.participants.find((p) => p.id !== '1')?.name}
                          </h3>
                          {conversation.lastMessage && (
                            <span className="text-muted-foreground text-xs">
                              {conversation.lastMessage.timestamp}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground truncate text-xs sm:text-sm">
                            {conversation.lastMessage?.content ?? 'Henüz mesaj yok'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="flex h-4 w-4 items-center justify-center p-0 text-xs sm:h-5 sm:w-5">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-8">
            {selectedConversation ? (
              <Card className="flex h-full flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback>
                          {selectedConversation.participants.find((p) => p.id !== '1')?.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-medium sm:text-base">
                          {selectedConversation.participants.find((p) => p.id !== '1')?.name}
                        </h3>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          {selectedConversation.participants.find((p) => p.id !== '1')?.isOnline
                            ? 'Çevrimiçi'
                            : 'Çevrimdışı'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex max-w-[80%] gap-3',
                          message.senderId === '1' ? 'ml-auto flex-row-reverse' : '',
                        )}
                      >
                        {message.senderId !== '1' && (
                          <Avatar className="mt-1 h-6 w-6 sm:h-8 sm:w-8">
                            <AvatarFallback className="text-xs">
                              {
                                selectedConversation.participants.find(
                                  (p) => p.id === message.senderId,
                                )?.name[0]
                              }
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'rounded-2xl px-3 py-2 sm:px-4 sm:py-2',
                            message.senderId === '1'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted',
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              'mt-1 text-xs opacity-70',
                              message.senderId === '1' ? 'text-right' : 'text-left',
                            )}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Mesaj yazın..."
                      className="flex-1 text-sm sm:text-base"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      size="sm"
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Gönder</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex h-full items-center justify-center">
                <div className="p-6 text-center">
                  <MessageCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16" />
                  <h3 className="mb-2 text-base font-medium sm:text-lg">Sohbet Seçin</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Bir sohbet seçin veya yeni sohbet başlatın
                  </p>
                  <Button className="gap-2" size="sm">
                    <UserPlus className="h-4 w-4" />
                    Yeni Sohbet
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
