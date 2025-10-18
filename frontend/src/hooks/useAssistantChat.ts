import { useState, useCallback, useEffect, useRef } from 'react';
import { assistantApi } from '@/lib/api';
import { ChatMessage, ChatEvent, ToolCall, TransactionPreview } from '@/lib/types';

interface UseAssistantChatProps {
  accountId: number;
}

export function useAssistantChat({ accountId }: UseAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<string>('');
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCall[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<TransactionPreview[] | null>(null);

  const streamCleanupRef = useRef<(() => void) | null>(null);
  const isFinalizingRef = useRef(false);
  const currentMessageRef = useRef<string>('');
  const currentToolCallsRef = useRef<ToolCall[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
    };
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Reset state
    setCurrentAssistantMessage('');
    setCurrentToolCalls([]);
    setError(null);
    setIsLoading(true);
    isFinalizingRef.current = false; // Reset flag for new message
    currentMessageRef.current = '';
    currentToolCallsRef.current = [];

    // Start streaming
    const cleanup = assistantApi.chatStream(
      {
        message,
        account_id: accountId,
      },
      (event: ChatEvent) => {
        handleEvent(event);
      }
    );

    streamCleanupRef.current = cleanup;
  }, [accountId]);

  const handleEvent = (event: ChatEvent) => {
    switch (event.type) {
      case 'thinking':
        // Show thinking indicator
        setIsLoading(true);
        break;

      case 'tool_start':
        // Add or update tool call
        setCurrentToolCalls(prev => {
          const existing = prev.find(tc => tc.tool_name === event.tool_name);
          let updated;
          if (existing) {
            updated = prev.map(tc =>
              tc.tool_name === event.tool_name
                ? { ...tc, status: 'running' as const }
                : tc
            );
          } else {
            updated = [
              ...prev,
              {
                tool_name: event.tool_name,
                tool_input: event.tool_input,
                status: 'running' as const,
              },
            ];
          }
          currentToolCallsRef.current = updated;
          return updated;
        });
        break;

      case 'tool_end':
        // Update tool call with result
        setCurrentToolCalls(prev => {
          const updated = prev.map(tc =>
            tc.tool_name === event.tool_name
              ? {
                  ...tc,
                  tool_output: event.tool_output,
                  status: event.success ? ('success' as const) : ('error' as const),
                  error: event.error,
                }
              : tc
          );
          currentToolCallsRef.current = updated;
          return updated;
        });
        break;

      case 'message_chunk':
        // Append to current assistant message
        // Ensure content is a string
        const content = typeof event.content === 'string'
          ? event.content
          : (event.content ? JSON.stringify(event.content) : '');

        if (event.is_final) {
          // Prevent double-execution in React Strict Mode
          if (isFinalizingRef.current) {
            break;
          }
          isFinalizingRef.current = true;

          // Use ref values which always have the current state
          const finalMessage = currentMessageRef.current;
          if (finalMessage) {
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: finalMessage,
              timestamp: new Date(),
              tool_calls: currentToolCallsRef.current.length > 0 ? [...currentToolCallsRef.current] : undefined,
            };

            // Add to messages array
            setMessages(prev => [...prev, assistantMessage]);
          }

          // Clear current state
          setCurrentAssistantMessage('');
          setCurrentToolCalls([]);
          currentMessageRef.current = '';
          currentToolCallsRef.current = [];
          setIsLoading(false);

          // Reset the flag after a tick
          setTimeout(() => {
            isFinalizingRef.current = false;
          }, 0);
        } else {
          // Streaming - append content
          setCurrentAssistantMessage(prev => {
            const updated = prev + content;
            currentMessageRef.current = updated;
            return updated;
          });
        }
        break;

      case 'transaction_previews':
        // Handle transaction previews
        setPendingTransactions(event.transactions);
        break;

      case 'done':
        // Stream complete
        setIsLoading(false);
        streamCleanupRef.current = null;
        break;

      case 'error':
        // Handle error
        setError(event.message);
        setIsLoading(false);
        streamCleanupRef.current = null;
        break;
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentAssistantMessage('');
    setCurrentToolCalls([]);
    setError(null);
    setPendingTransactions(null);
  }, []);

  const dismissTransactions = useCallback(() => {
    setPendingTransactions(null);
  }, []);

  return {
    messages,
    currentAssistantMessage,
    currentToolCalls,
    isLoading,
    error,
    pendingTransactions,
    sendMessage,
    clearMessages,
    dismissTransactions,
  };
}
