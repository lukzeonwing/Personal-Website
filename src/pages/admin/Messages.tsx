import { useEffect, useState } from 'react';
import { getMessages, markAsRead, deleteMessage } from '../../lib/messages';
import { Message } from '../../types/message';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Mail, MailOpen, Trash2, Calendar, User } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner@2.0.3';

export function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async (preserveSelection: boolean = true) => {
    try {
      setIsLoading(true);
      const fetched = await getMessages();
      setMessages(fetched);

      if (preserveSelection && selectedMessage) {
        const updated = fetched.find((message) => message.id === selectedMessage.id) || null;
        setSelectedMessage(updated);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      await loadMessages();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update message');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMessage(id);
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      await loadMessages(false);
      toast.success('Message deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete message');
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadMessages = messages.filter(m => !m.read);
  const readMessages = messages.filter(m => m.read);

  const MessageList = ({ messages: msgs }: { messages: Message[] }) => {
    if (isLoading) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Loading messages...
        </div>
      );
    }

    if (msgs.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No messages
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {msgs.map((message) => (
          <div
            key={message.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedMessage?.id === message.id
                ? 'bg-accent border-primary'
                : 'hover:bg-muted/50'
            } ${!message.read ? 'border-l-4 border-l-primary' : ''}`}
            onClick={() => setSelectedMessage(message)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {message.read ? (
                    <MailOpen size={16} className="text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Mail size={16} className="text-primary flex-shrink-0" />
                  )}
                  <h4 className="truncate">{message.subject}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  From: {message.name} ({message.email})
                </p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {message.message}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(message.timestamp)}
                </span>
                {!message.read && (
                  <Badge variant="default" className="text-xs">New</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl mb-2">Messages</h1>
              <p className="text-muted-foreground">
                Contact form submissions from your portfolio
              </p>
            </div>
            {unreadMessages.length > 0 && (
              <Badge variant="default" className="text-lg px-4 py-2">
                {unreadMessages.length} New
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Inbox</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="unread">
                  <TabsList className="w-full">
                    <TabsTrigger value="unread" className="flex-1">
                      Unread ({unreadMessages.length})
                    </TabsTrigger>
                    <TabsTrigger value="all" className="flex-1">
                      All ({messages.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="unread" className="mt-4">
                    <MessageList messages={unreadMessages} />
                  </TabsContent>
                  <TabsContent value="all" className="mt-4">
                    <MessageList messages={messages} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{selectedMessage.subject}</CardTitle>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span>{selectedMessage.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          <a 
                            href={`mailto:${selectedMessage.email}`}
                            className="hover:text-primary transition-colors"
                          >
                            {selectedMessage.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{formatDate(selectedMessage.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!selectedMessage.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(selectedMessage.id)}
                        >
                          <MailOpen size={16} className="mr-2" />
                          Mark Read
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this message? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(selectedMessage.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                      {selectedMessage.message}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button asChild>
                      <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                        <Mail size={16} className="mr-2" />
                        Reply via Email
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Mail size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a message to view its details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
