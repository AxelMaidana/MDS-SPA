// src/components/N8nChatWidget.tsx
import { useEffect } from 'react';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

export default function N8nChatWidget() {
  useEffect(() => {
    createChat({
      webhookUrl: 'https://axel2003.app.n8n.cloud/webhook/f406671e-c954-4691-b39a-66c90aa2f103/chat',
      mode: 'window',                 // "window" o "embedded"
      showWelcomeScreen: true,        // Mostrar pantalla de bienvenida
      defaultLanguage: 'en',          // Soporte multilenguaje
      initialMessages: [
        '🌸 ¡Hola! 👋',
        'Soy el Asistente Virtual de Sentirse Bien Spa. ¿En qué puedo ayudarte hoy?'
      ],
      theme: {
        color: '#A88D72',             // Cambia el color principal (ejemplo: un tono relajante tipo tierra o rosa claro)
        backgroundColor: '#FFF9F0',   // Fondo del chat
        botMessage: {
          background: '#FFF3E0',
          textColor: '#3E2C1D',
        },
        userMessage: {
          background: '#E5D7C0',
          textColor: '#2E1C10',
        },
        borderRadius: '1rem',
      },
      i18n: {
        en: {
          title: '🌿 Sentirse Bien Spa',
          subtitle: 'Estoy aquí para ayudarte a relajarte y resolver tus dudas',
          getStarted: 'Comenzar',
          inputPlaceholder: 'Escribí tu pregunta...',
          sendButton: 'Enviar',
          errorMessage: 'Ups, algo salió mal. Por favor, intentá de nuevo.',
          closeButtonTooltip: 'Cerrar',
          footer: '🌿 Sentirse Bien Spa',
        },
      },
    });
  }, []);

  return null; // El widget se monta automáticamente
}
