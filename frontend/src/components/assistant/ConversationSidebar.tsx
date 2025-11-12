"use client";

import { useEffect, useState } from 'react';
import { conversationApi } from '@/lib/api';
import { Conversation } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  currentConversationId?: number;
  onConversationSelect: (conversationId: number | undefined) => void;
  onNewConversation: () => void;
}

export default function ConversationSidebar({
  currentConversationId,
  onConversationSelect,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationApi.getAll();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this conversation?')) {
      return;
    }

    try {
      setDeletingId(conversationId);
      await conversationApi.delete(conversationId);

      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      // If deleting current conversation, start new one
      if (currentConversationId === conversationId) {
        onNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Refresh conversations when a new conversation ID is set
  useEffect(() => {
    if (currentConversationId && !conversations.find(c => c.id === currentConversationId)) {
      loadConversations();
    }
  }, [currentConversationId]);

  return (
    <div className="flex flex-col h-full border-r bg-muted/10">
      {/* Header */}
      <div className="p-4 border-b">
        <Button
          onClick={onNewConversation}
          className="w-full"
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No conversations yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onConversationSelect(conversation.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors group relative",
                  "hover:bg-accent",
                  currentConversationId === conversation.id
                    ? "bg-accent"
                    : "bg-background"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(conversation.updated_at)}
                    </div>
                  </div>

                  <div
                    onClick={(e) => handleDelete(conversation.id, e)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleDelete(conversation.id, e as any);
                      }
                    }}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "p-1 rounded hover:bg-destructive/10 hover:text-destructive cursor-pointer",
                      deletingId === conversation.id && "opacity-100 cursor-not-allowed"
                    )}
                  >
                    {deletingId === conversation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
