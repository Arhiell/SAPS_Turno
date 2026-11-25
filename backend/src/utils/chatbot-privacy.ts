// Prevención conservadora; no es un anonimizador ni una clasificación clínica completa.
export const normalizeChatbotText = (text: string) => text.normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '')
  .toLowerCase();

const sensitivePatterns = [
  /[\w.+-]+\s*@\s*[\w.-]+\.[a-z]{2,}/i,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/i,
  /\b(?:bearer|api[_ -]?key|password|contrasena|token|secret|supabase[_ -]?key)\s*[:=]\s*\S+/i,
  /\bAIza[\w-]{15,}/i,
  /\b(?:sb_secret_|sk-)[A-Za-z0-9_-]+/i,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  /(?:\d[\s().+-]*){7,}/,
  /\b(?:dni|documento|telefono|celular|domicilio|direccion|correo|email|nombre|apellido|paciente)\s*(?:es|:|=)\s*\S+/i,
  /\b(?:me llamo|mi nombre es|vivo en|el paciente se llama|mi paciente|resultado de mi|tengo dolor|me duele|mi diagnostico|mi tratamiento|tomo [a-z]|estoy embarazada)\b/i,
  /\bhistoria clinica\s+(?:dice|contiene|indica|de\s+(?!un\b|una\b|la\b|las\b|los\b|otra\b|personas\b|pacientes\b|mi\b)\S+)/i,
];

export const hasSensitiveChatbotData = (text: string) => {
  const normalized = normalizeChatbotText(text);
  return sensitivePatterns.some(pattern => pattern.test(normalized));
};

export const isMedicalChatbotQuestion = (text: string) =>
  /\b(?:diagnosti\w*|tratamiento\w*|medicamento\w*|medicacion|dosis|sintoma\w*|receta\w*|interpret\w* (?:un |mi |el )?(?:estudio|analisis)|enfermedad\w*)\b/.test(normalizeChatbotText(text));

// Las peticiones de datos, instrucciones internas o acciones nunca se convierten en ayuda.
export const isChatbotScopeViolation = (text: string) => {
  const normalized = normalizeChatbotText(text).replace(/^[\s¿¡?!.,]+/, '');
  return /\b(?:ignora|ignorar|omite|olvida|saltea)\b.*\b(?:instrucciones|reglas|filtros|privacidad|permisos)\b/.test(normalized) ||
    /\b(?:prompt|system prompt|variables de entorno|credenciales|api key|clave secreta|supabase_secret_key)\b/.test(normalized) ||
    /^(?:por favor[, ]+)?(?:crea|creame|cancela|cancelame|modifica|modificame|ejecuta|borra|elimina|registra|registrame|firma|firmame|aprueba|aproba|rechaza|envia|enviame|publica|reprograma|reprogramame|exporta|descarga|dame|mostrame|muestrame|revela|extrae|lista|busca|consulta|lee)\b/.test(normalized) ||
    /\b(?:podes|podrias|puedes|necesito que|quiero que|te pido que)\s+(?:me\s+)?(?:crear?|cancelar?|modificar?|ejecutar?|borrar?|eliminar?|registrar?|firmar?|aprobar?|rechazar?|enviar?|publicar?|reprogramar?|exportar?|descargar?|mostrar?|mostrarme|revelar?|buscar?|consultar?|leer)\b/.test(normalized);
};
