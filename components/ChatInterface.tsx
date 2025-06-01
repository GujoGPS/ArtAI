import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TextareaAutosize from 'react-textarea-autosize';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isPdfLoaded: boolean;
  currentPageForContext?: number;
  isExtractingContext: boolean;
}

const UserIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
    <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
  </svg>
);

const AiIcon: React.FC = () => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
  <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Z" />
  <path fillRule="evenodd" d="M12.292 4.98a.75.75 0 0 0-.209 1.038l.01.011 2.248 2.248a.75.75 0 0 0 1.06-1.06l-2.248-2.248a.75.75 0 0 0-.861-.211Zm-4.584 0a.75.75 0 0 1 .209 1.038l-.01.011-2.248 2.248a.75.75 0 1 1-1.06-1.06l2.248-2.248a.75.75 0 0 1 .861-.211Zm10.03 7.493a.75.75 0 0 0-1.038.209l-.011.01-2.248 2.248a.75.75 0 1 0 1.06 1.06l2.248-2.248a.75.75 0 0 0 .211-.861Zm-15.484 0a.75.75 0 0 1 1.038.209l.011.01 2.248 2.248a.75.75 0 1 1-1.06 1.06L2.497 12.79a.75.75 0 0 1-.211-.861Z" clipRule="evenodd" />
  <path d="M17 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 17 10ZM5.5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75Z" />
  <path fillRule="evenodd" d="M10 6.006c2.13 0 3.862 1.652 3.994 3.748a.75.75 0 0 1-1.493.118 2.5 2.5 0 0 0-4.99-.002.75.75 0 0 1-1.494-.116C6.138 7.658 7.87 6.006 10 6.006Zm0 7.988c-2.13 0-3.862-1.652-3.994-3.748a.75.75 0 0 1 1.493-.118 2.5 2.5 0 0 0 4.99.002.75.75 0 0 1 1.494.116C13.862 12.342 12.13 13.994 10 13.994Z" clipRule="evenodd" />
</svg>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  isPdfLoaded,
  currentPageForContext,
  isExtractingContext,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Se o usuário apertar Enter sem a tecla Shift, envie a mensagem
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Impede a quebra de linha
      handleSubmit();
    }
    // Se apertar Enter com Shift, o comportamento padrão (nova linha) acontece
  };

  const handleSubmit = () => {
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-grow overflow-y-auto mb-4 pr-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <AiIcon />
            <p className="mt-2 text-center">
              {isPdfLoaded ? "Ask me anything about the PDF or general topics." : "Ask me anything!"}
            </p>
            {isPdfLoaded && currentPageForContext && (
               <p className="text-xs mt-1 text-center">
                Context from page {currentPageForContext} will be used.
                {isExtractingContext && " (Extracting...)"}
               </p>
            )}
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-3 items-start ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'ai' && (
              <div className="flex-shrink-0 mr-2 p-1.5 bg-slate-700 rounded-full">
                <AiIcon />
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow text-sm ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}
            >
              {msg.sender === 'ai' ? (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}

              <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-sky-200 text-right' : 'text-slate-400 text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.sender === 'user' && (
              <div className="flex-shrink-0 ml-2 p-1.5 bg-sky-600 rounded-full">
                <UserIcon />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex items-end">
        <TextareaAutosize
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
          className="flex-grow p-3 border border-slate-600 rounded-l-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-slate-700 text-slate-100 placeholder-slate-400 resize-none"
          disabled={isLoading}
          maxRows={7}
          minRows={1}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="bg-sky-600 text-white p-3 rounded-r-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors self-stretch"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M3.105 3.105a.75.75 0 0 1 .814-.156L16.75 8.25a.75.75 0 0 1 0 1.312L3.919 14.828a.75.75 0 0 1-1.04-.814l1.42-6.243L3.105 3.105Z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;