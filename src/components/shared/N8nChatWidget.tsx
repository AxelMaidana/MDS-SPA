// src/components/N8nChatWidget.tsx
import { useEffect } from 'react';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

export default function N8nChatWidget() {
  useEffect(() => {
    createChat({
      webhookUrl: 'https://axel2003.app.n8n.cloud/webhook/f406671e-c954-4691-b39a-66c90aa2f103/chat',
      mode: 'window',
      showWelcomeScreen: true,
      initialMessages: [
        '¡Hola! 👋',
        'Soy tu asistente virtual de Sentirse Bien Spa. ¿En qué puedo ayudarte hoy?'
      ],
      defaultLanguage: 'en', // Solo "en" por ahora, pero podés poner textos personalizados abajo
      i18n: {
        en: {
          title: '¡Hola! 👋',
          subtitle: 'Escribime tu consulta sobre los servicios del Spa',
          footer: '',
          getStarted: 'Nueva conversación',
          inputPlaceholder: 'Escribí tu pregunta...',
          sendButton: 'Enviar',
          welcomeMessage: 'Soy tu asistente virtual de Sentirse Bien Spa. ¿En qué puedo ayudarte hoy?',
          errorMessage: 'Ups, algo salió mal. Por favor, inténtalo de nuevo.',
          loadingMessage: 'Cargando...',
          noResultsMessage: 'Lo siento, no hemos encontrado nada que coincida con tu consulta.',
          retryButton: 'Reintentar',
          closeButton: 'Cerrar',
          chatBubbleUser: 'Usuario',
          chatBubbleBot: 'Bot',
          chatBubbleUserIcon: '👤',
          chatBubbleBotIcon: '🤖',
          sendIcon: '➡️',
          retryIcon: '🔄',
          closeIcon: '❌',
          closeButtonTooltip: 'Cerrar',
        },
      },
      theme: {
        primaryColor: '#e74266',
        backgroundColor: '#ffffff',
        headerTextColor: '#ffffff',
        chatBubbleUserColor: '#e74266',
        chatBubbleBotColor: '#f0f0f0',
        borderRadius: '12px',
      },
    });
  }, []);

  return null; // El widget se monta automáticamente
}
