"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { categoryApi, tagApi } from '@/lib/api';
import { Category, Tag } from '@/lib/types';
import { useAssistantChat } from '@/hooks/useAssistantChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ToolExecutionCard from './ToolExecutionCard';
import TransactionPreviewInChat from './TransactionPreviewInChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Trash2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssistantChatProps {
  accountId: number;
  conversationId?: number;
  onConversationChange?: (conversationId: number) => void;
}

export default function AssistantChat({ accountId, conversationId, onConversationChange }: AssistantChatProps) {
  const { user } = useAuth();
  const {
    messages,
    currentAssistantMessage,
    currentToolCalls,
    isLoading,
    isLoadingHistory,
    error,
    pendingTransactions,
    sendMessage,
    clearMessages,
    dismissTransactions,
  } = useAssistantChat({ accountId, conversationId, onConversationChange });

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevAccountId = useRef(accountId);

  // Load categories and tags
  useEffect(() => {
    if (user) {
      loadCategoriesAndTags();
    }
  }, [user]);

  const loadCategoriesAndTags = async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        categoryApi.getAll(),
        tagApi.getAll(),
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load categories/tags:', error);
    }
  };

  // Note: We don't clear messages when account changes anymore
  // Conversations can span multiple accounts

  const handleTransactionComplete = () => {
    try {
      dismissTransactions();
      // Optionally send a success message to continue the conversation
      // sendMessage('Transactions created successfully!');
    } catch (error) {
      console.error('Error handling transaction completion:', error);
    }
  };

  // Check if user is scrolled up
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    setIsUserScrolled(!isAtBottom);
  };

  // Auto-scroll to bottom on new messages (only if user is already at bottom)
  useEffect(() => {
    if (!isUserScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentAssistantMessage, currentToolCalls, isUserScrolled]);

  // Reset scroll state when new message is sent
  useEffect(() => {
    if (isLoading) {
      setIsUserScrolled(false);
    }
  }, [isLoading]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Financial Assistant
            </CardTitle>
            <CardDescription>
              Ask me about your spending, budgets, or get financial advice
            </CardDescription>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto mb-4 space-y-4"
        >
          {isLoadingHistory && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoadingHistory && messages.length === 0 && !currentAssistantMessage && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to your Financial Assistant</h3>
              <p className="text-muted-foreground max-w-md">
                I can help you understand your spending, analyze budgets, create transactions, and provide financial advice.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6 max-w-2xl">
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => sendMessage("How much did I spend on groceries this month?")}
                >
                  📊 How much did I spend on groceries this month?
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => sendMessage("Show me my budget status")}
                >
                  💰 Show me my budget status
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => sendMessage("Add $50 for groceries today")}
                >
                  ✍️ Add $50 for groceries today
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => sendMessage("Give me tips to save more money")}
                >
                  💡 Give me tips to save more money
                </Button>
              </div>
            </div>
          )}

          {/* Display messages */}
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}

          {/* Current assistant message being streamed */}
          {(currentAssistantMessage || currentToolCalls.length > 0 || isLoading) && (
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-2 max-w-[80%]">
                {/* Show thinking indicator */}
                {isLoading && !currentAssistantMessage && currentToolCalls.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}

                {/* Show active tool calls */}
                {currentToolCalls.length > 0 && (
                  <div className="space-y-2">
                    {currentToolCalls.map((tool, idx) => (
                      <ToolExecutionCard key={idx} toolCall={tool} />
                    ))}
                  </div>
                )}

                {/* Show streaming message */}
                {currentAssistantMessage && (
                  <div className="rounded-lg px-4 py-2 bg-secondary text-secondary-foreground">
                    <div className="prose prose-sm max-w-none dark:prose-invert inline">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentAssistantMessage}
                      </ReactMarkdown>
                      <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse align-middle" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transaction previews */}
          {pendingTransactions && pendingTransactions.length > 0 && (
            <div className="my-4">
              <TransactionPreviewInChat
                transactions={pendingTransactions}
                accountId={accountId}
                categories={categories}
                tags={tags}
                onComplete={handleTransactionComplete}
                onDismiss={dismissTransactions}
              />
            </div>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t pt-4">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            placeholder="Ask me anything about your finances..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
