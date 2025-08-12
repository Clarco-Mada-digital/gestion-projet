import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageOutlined, RobotOutlined, SendOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { Avatar, Button, Tooltip, message, Input, theme, Modal } from 'antd';
import ChatbotSettings from './ChatbotSettings';
import type { InputRef } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import darkTheme from 'react-syntax-highlighter/dist/cjs/styles/prism/dark';
import lightTheme from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light';
import remarkGfm from 'remark-gfm';

// Composant pour le rendu du markdown avec coloration syntaxique
const MarkdownRenderer = ({ content, isDark }: { content: string; isDark: boolean }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({node, inline, className, children, ...props}: any) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={isDark ? darkTheme : lightTheme}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: '0.5em 0',
                padding: '1em',
                borderRadius: '6px',
                background: isDark ? 'rgba(0, 0, 0, 0.3)' : '#f6f8fa',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                  lineHeight: 1.5,
                },
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} style={{
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0',
              padding: '0.2em 0.4em',
              borderRadius: '3px',
              fontSize: '85%',
              fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace'
            }} {...props}>
              {children}
            </code>
          );
        },
        a: ({node, ...props}) => (
          <a {...props} style={{color: '#1890ff'}} target="_blank" rel="noopener noreferrer" />
        ),
        blockquote: ({node, ...props}) => (
          <blockquote style={{
            margin: '16px 0',
            padding: '0 1em',
            color: isDark ? '#a0aec0' : '#6a737d',
            borderLeft: `0.25em solid ${isDark ? '#4a5568' : '#dfe2e5'}`,
            paddingLeft: '1em',
            marginLeft: 0,
          }} {...props} />
        ),
        table: ({node, ...props}) => (
          <div style={{overflowX: 'auto'}}>
            <table style={{
              borderCollapse: 'collapse',
              width: '100%',
              margin: '16px 0',
              border: `1px solid ${isDark ? '#4a5568' : '#dfe2e5'}`,
            }} {...props} />
          </div>
        ),
        th: ({node, ...props}) => (
          <th style={{
            padding: '6px 13px',
            border: `1px solid ${isDark ? '#4a5568' : '#dfe2e5'}`,
            fontWeight: 600,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          }} {...props} />
        ),
        td: ({node, ...props}) => (
          <td style={{
            padding: '6px 13px',
            border: `1px solid ${isDark ? '#4a5568' : '#dfe2e5'}`,
          }} {...props} />
        ),
        tr: ({node, ...props}) => {
          // @ts-ignore - data-index n'est pas dans les types standards
          const rowIndex = props['data-index'] || 0;
          const isEven = Number(rowIndex) % 2 === 0;
          return (
            <tr 
              style={{
                backgroundColor: isEven 
                  ? (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f6f8fa')
                  : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#fff'),
                borderTop: `1px solid ${isDark ? '#4a5568' : '#c6cbd1'}`,
              }} 
              // @ts-ignore - Les props sont correctement typés par ReactMarkdown
              {...props} 
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// Styles personnalisés
const ChatWindow = styled(motion.div)<{ $isDark: boolean }>`
  width: 380px;
  height: 600px;
  background: ${({ $isDark, theme }) => $isDark ? theme.token?.colorBgContainer : '#f2f2f'};
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  border: 1px solid ${({ $isDark, theme }) => $isDark ? theme.token?.colorBorder : '#6e45e2'};
  color: ${({ $isDark, theme }) => $isDark ? theme.token?.colorText : 'inherit'};
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #5f6f8f, #374151);
  background-blend-mode: multiply;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ChatBody = styled.div<{ $isDark: boolean }>`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: ${({ $isDark }) =>
    $isDark
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.03)'};
  backdrop-filter: ${({ $isDark }) =>
    $isDark ? 'blur(5px) brightness(0.8)' : 'blur(5px)'};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  color: ${({ $isDark, theme }) => $isDark ? theme.token?.colorText : 'inherit'};
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.4;
`;

const MessageBubble = styled(motion.div)<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  line-height: 1.4;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  backdrop-filter: ${({ $isUser }) => ($isUser ? 'blur(5px) brightness(0.8)' : 'blur(5px)')};
  background: ${({ $isUser, theme }) => $isUser ? '#6e45e240' : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $isUser, theme }) => $isUser ? theme.token?.colorTextInverse : theme.token?.colorText};
  border: ${({ $isUser, theme }) => $isUser ? 'none' : `1px solid ${theme.token?.colorBorder}`};
  border-radius: 12px;
  border-image: linear-gradient(135deg, #5f6f8f, #374151) 1;
  border-image-slice: 1;
  align-self: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
`;

const MessageTime = styled.span`
  display: block;
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
`;

const InputContainer = styled.div<{ $isDark: boolean }>`
  display: flex;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  background: ${({ $isDark }) => $isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  backdrop-filter: ${({ $isDark }) => $isDark ? 'blur(5px) brightness(0.8)' : 'blur(5px)'};
  border-radius: 12px;
  position: relative;
  z-index: 1002;
  display: flex;
  gap: 8px;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.1));
    opacity: 0.7;
    backdrop-filter: blur(5px);
    border-radius: 12px;
  }
  
  &:hover {
    background: ${({ $isDark }) => $isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  }
`;

const StyledInput = styled(Input.TextArea)`
  border-radius: 20px;
  resize: none;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s;
  backdrop-filter: blur(5px);
  
  &:focus, &:hover {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
`;

const SendButton = styled(Button)`
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #1890ff 0%, #1890ff20 100%);
  color: white;
  border: none;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    background: #d9d9d9;
    color: rgba(0, 0, 0, 0.25);
    box-shadow: none;
  }
`;

interface ChatButtonProps {
  $isOpen: boolean;
}

const ChatButton = styled(Button)<ChatButtonProps>`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  min-width: 60px !important;
  padding: 0;
  border-radius: 50% !important;
  background: radial-gradient(ellipse at center, #1890ff 0%, #1890ff 99%, #096dd9 100%);
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(5px) brightness(0.7);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${({ $isOpen }) => ($isOpen ? 0 : 1)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'none' : 'auto')};
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
    backdrop-filter: blur(10px) brightness(0.8);
  }
  
  .anticon {
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

import { useChatbot } from '../../context/ChatbotContext';
import { useApp } from '../../context/AppContext';
import AIService from '../../services/aiService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const { token } = theme.useToken();
  // Vérification du thème sombre basée sur la couleur de fond
  const isDark = token.colorBgLayout === '#141414' || 
                token.colorBgContainer === '#1f1f1f' ||
                document.body.getAttribute('data-theme') === 'dark';
  const { isOpen, setIsOpen, settings: chatbotSettings, updateSettings } = useChatbot();
  const { state } = useApp();
  // Utilisation explicite des propriétés nécessaires
  const { aiSettings } = state.appSettings;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputRef>(null);
  
  // Vérifier si l'IA est correctement configurée
  const isAIConfigured = React.useMemo(() => {
    const aiSettings = state.appSettings?.aiSettings;
    if (!aiSettings) return false;
    
    // Utiliser le flag isConfigured des paramètres existants
    if (aiSettings.isConfigured !== undefined) {
      return aiSettings.isConfigured;
    }
    
    // Vérification de compatibilité pour les anciennes versions
    const hasOpenAI = aiSettings.provider === 'openai' && aiSettings.openaiApiKey;
    const hasOpenRouter = aiSettings.provider === 'openrouter';
    
    return hasOpenAI || hasOpenRouter;
  }, [state.appSettings?.aiSettings]);
  
  // Afficher un message si l'IA n'est pas configurée
  useEffect(() => {
    if (isOpen && !isAIConfigured) {
      message.warning({
        content: 'Veuillez configurer les paramètres d\'IA pour utiliser l\'assistant',
        duration: 5,
      });
    }
  }, [isOpen, isAIConfigured]);

  // Charger l'historique des messages depuis le stockage local
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatbotMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convertir les chaînes de date en objets Date
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    } else {
      // Message de bienvenue initial
      setMessages([
        {
          id: '1',
          content: 'Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider avec votre projet aujourd\'hui ?',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Sauvegarder les messages dans le stockage local
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatbotMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Effet pour faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effet pour se concentrer sur le champ de saisie quand le chat s'ouvre
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus({
        cursor: 'end',
      });
    }
  }, [isOpen]);

  // Gestionnaire d'envoi de message
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !isAIConfigured) return;

    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Utiliser le service d'IA pour générer une réponse
      const response = await AIService.generateAIResponse(
        inputValue.trim(),
        messages.slice(-5).map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content
        })),
        aiSettings,
        null, // project
        null, // task
        state // appState
      );

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botResponse]);

      // Afficher une notification si activé dans les paramètres
      if (chatbotSettings.showNotifications) {
        message.warning('Configuration IA requise pour utiliser le chatbot');
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse IA:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: 'Désolé, une erreur est survenue lors de la génération de la réponse. Veuillez réessayer plus tard.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, chatbotSettings.showNotifications, isAIConfigured, messages, state.appSettings.aiSettings]);

  // Gestionnaire de la touche Entrée
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // La fonction generateBotResponse a été supprimée car non utilisée dans cette version

  // Basculer l'état d'ouverture/fermeture du chat
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      // Donner le focus au champ de saisie quand on ouvre le chat
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Effacer l'historique de la conversation
  // Gérer l'ouverture/fermeture des paramètres
  const handleSettingsClick = useCallback(() => {
    setSettingsVisible(true);
  }, []);

  const handleSettingsClose = useCallback((newSettings?: any) => {
    if (newSettings) {
      updateSettings(newSettings);
    }
    setSettingsVisible(false);
  }, [updateSettings]);

  const clearChat = useCallback(() => {
    if (window.confirm('Voulez-vous vraiment effacer l\'historique de la conversation ?')) {
      setMessages([
        {
          id: Date.now().toString(),
          content: 'Bonjour ! Comment puis-je vous aider avec votre projet aujourd\'hui ?',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      localStorage.removeItem('chatbotMessages');
    }
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            $isDark={isDark}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <ChatHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar 
                  icon={<RobotOutlined style={{ transform: 'scale(1.2)' }} />} 
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#6e45e2',
                    border: '2px solid rgba(110, 69, 226, 0.5)',
                    boxShadow: '0 0 10px rgba(110, 69, 226, 0.3)'
                  }} 
                />
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #6e45e2, #89d4cf, #f77062)', 
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% 200%',
                  animation: 'gradient 8s ease infinite',
                }}>Nexus IA</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Tooltip title="Paramètres">
                  <Button 
                    type="text" 
                    icon={<SettingOutlined style={{ color: 'white' }} />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSettingsClick();
                    }}
                  />
                </Tooltip>
                <Tooltip title="Fermer">
                  <Button 
                    type="text" 
                    icon={<CloseOutlined style={{ color: 'white' }} />} 
                    onClick={toggleChat}
                  />
                </Tooltip>
              </div>
            </ChatHeader>

            <ChatBody ref={messagesEndRef} $isDark={isDark}>
              {messages.length === 0 ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  color: '#888',
                  padding: '20px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #6e45e2, #89d4cf, #f77062)',
                    marginBottom: '16px',
                    boxShadow: '0 4px 15px rgba(110, 69, 226, 0.3)'
                  }}>
                    <RobotOutlined style={{ 
                      fontSize: '40px', 
                      color: 'white',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }} />
                  </div>
                  <h3 style={{ 
                    marginBottom: '8px', 
                    background: 'linear-gradient(135deg, #6e45e2, #89d4cf, #f77062)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '200% 200%',
                    animation: 'gradient 8s ease infinite',
                  }}>Comment puis-je vous aider ?</h3>
                  <p style={{ color: isDark ? '#ccc' : '#666' }}>Posez-moi des questions sur vos projets ou tâches.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    $isUser={msg.sender === 'user'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MarkdownRenderer content={msg.content} isDark={isDark} />
                    <MessageTime>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </MessageTime>
                  </MessageBubble>
                ))
              )}
              
              {isLoading && (
                <MessageBubble 
                  $isUser={false}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <div style={{ display: 'flex', gap: '6px', padding: '4px 0' }}>
                    {[0, 1, 2].map((i) => (
                      <div 
                        key={i}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#999',
                          animation: `bounce 1.4s infinite ease-in-out ${i * 0.2}s`
                        }} 
                      />
                    ))}
                  </div>
                </MessageBubble>
              )}
              <div ref={messagesEndRef} />
            </ChatBody>

            <InputContainer>
              <StyledInput
                ref={inputRef}
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Tapez votre message..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={!isAIConfigured}
                style={{ flex: 1 }}
              />
              <Tooltip title="Envoyer">
                <SendButton 
                  icon={<SendOutlined />} 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || !isAIConfigured || isLoading}
                />
              </Tooltip>
            </InputContainer>
          </ChatWindow>
        )}
      </AnimatePresence>

      <Tooltip title={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}>
        <ChatButton
          type="primary"
          shape="circle"
          onClick={toggleChat}
          $isOpen={isOpen}
          style={{
            transform: isOpen ? 'rotate(180deg) scale(0)' : 'none',
            transition: 'all 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isOpen ? <CloseOutlined /> : <MessageOutlined />}
        </ChatButton>
      </Tooltip>

      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
