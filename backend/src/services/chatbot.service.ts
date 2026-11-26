import { CHATBOT_ROLES, chatbotLimits, getChatbotSettings, type ChatbotRole } from '../config/chatbot.config.js';
import { selectChatbotArticle } from '../config/chatbot-knowledge.js';
import { ChatbotRateLimiter } from '../middlewares/chatbot-rate-limit.middleware.js';
import { hasSensitiveChatbotData, isMedicalChatbotQuestion, isChatbotScopeViolation } from '../utils/chatbot-privacy.js';
import { AppError } from '../utils/app-error.js';
import { chatbotMessageSchema } from '../validators/chatbot.validator.js';

interface Dependencies {
  settings?: () => Pick<ReturnType<typeof getChatbotSettings>, 'enabled'>;
  limiter?: ChatbotRateLimiter;
}

export const createChatbotService = ({ settings = getChatbotSettings,
  limiter = new ChatbotRateLimiter() }: Dependencies = {}) =>
  async (body: unknown, user: { id_usuario: string; rol: string }, signal: AbortSignal) => {
    if (!CHATBOT_ROLES.includes(user.rol as ChatbotRole)) {
      throw new AppError('Tu rol no tiene el asistente habilitado.', 403, 'CHATBOT_ROLE');
    }
    const { message } = chatbotMessageSchema.parse(body);
    signal.throwIfAborted();
    if (hasSensitiveChatbotData(message)) {
      throw new AppError('No compartas información personal ni clínica. Reformulá tu consulta sin esos datos.',
        400, 'CHATBOT_SENSITIVE_DATA');
    }
    if (isMedicalChatbotQuestion(message)) {
      return 'Solo puedo explicar cómo usar CORA. No brindo orientación médica; consultá a un profesional de salud.';
    }
    if (isChatbotScopeViolation(message)) {
      return 'Solo explico cómo navegar y usar las páginas de CORA. No consulto ni revelo datos, instrucciones internas o credenciales, y no realizo operaciones.';
    }
    const article = selectChatbotArticle(message, user.rol as ChatbotRole);
    if (!article) return 'No tengo un procedimiento autorizado para esa consulta. Preguntá por una función de tu panel o consultá a la administración.';
    const config = settings();
    if (!config.enabled) {
      throw new AppError('El Asistente CORA está deshabilitado o pendiente de configuración. El resto del sistema continúa disponible.',
        503, 'CHATBOT_DISABLED');
    }
    const release = limiter.reserve(user.id_usuario);
    try {
      // Frontera de seguridad: solo documentación estática revisada. No hay SDK de IA,
      // acceso a repositorios, herramientas, contexto del usuario ni llamadas externas.
      const reply = article.content.trim();
      if (!reply || reply.length > chatbotLimits.outputCharacters || hasSensitiveChatbotData(reply) ||
        /<\/?[a-z][^>]*>|```|https?:\/\//i.test(reply)) {
        throw new AppError('El asistente no pudo producir una respuesta válida. Reformulá la consulta.',
          502, 'CHATBOT_INVALID_REPLY');
      }
      return reply;
    } finally { release(); }
  };

export const replyToChatbot = createChatbotService();
