
const axios = require('axios');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

// ── Ollama Configuration ──────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// System prompt that defines Siyana's personality and scope
const SYSTEM_PROMPT = `Tu es Siyana, l'assistante IA intelligente de la plateforme SIYENA.
SIYENA est une plateforme de gestion de maintenance industrielle et de suivi des interventions techniques.

Tes compétences :
- Aider les employés avec leurs questions professionnelles (congés, rapports, procédures).
- Diagnostiquer des problèmes techniques (imprimantes, réseau, matériel informatique).
- Rédiger des emails professionnels, des rapports d'intervention et des documents.
- Expliquer les consignes de sécurité et les bonnes pratiques en atelier.
- Répondre en français de manière claire, concise et professionnelle.

Règles :
- Réponds TOUJOURS en français sauf si l'utilisateur parle dans une autre langue.
- Sois polie, professionnelle et utile.
- Structure tes réponses avec des titres, listes numérotées ou puces quand c'est pertinent.
- Si tu ne sais pas quelque chose, dis-le honnêtement.
- Ne génère jamais de contenu inapproprié ou dangereux.`;

// ── Build prompt with conversation history ────────────────────────────
function buildPrompt(conversationHistory, newMessage) {
  let prompt = `${SYSTEM_PROMPT}\n\n`;

  // Add recent conversation history (last 10 messages for context)
  if (conversationHistory && conversationHistory.length > 0) {
    prompt += `Voici l'historique de la conversation :\n`;
    for (const msg of conversationHistory) {
      const label = msg.role === 'user' ? 'Utilisateur' : 'Siyana';
      prompt += `${label} : ${msg.content}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Utilisateur : ${newMessage}\nSiyana :`;
  return prompt;
}

// @desc    Send a message to the AI and get a response
// @route   POST /api/ai/chat
// @access  Private (Employee/Admin)
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { message, conversationId } = req.body;
  const userId = req.technician._id;

  if (!message) {
    return next(new AppError('Veuillez fournir un message.', 400));
  }

  let conversation;

  // 1. Get or create conversation
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new AppError('Conversation introuvable.', 404));
    }
    // Verify ownership
    if (conversation.userId.toString() !== userId.toString()) {
      return next(new AppError('Accès non autorisé à cette conversation.', 403));
    }
  } else {
    // Generate a title from the first message
    const title = message.length > 40 ? message.substring(0, 40) + '...' : message;
    conversation = await Conversation.create({
      userId,
      title
    });
  }

  // 2. Save user message
  const userMessage = await Message.create({
    conversationId: conversation._id,
    role: 'user',
    content: message
  });

  // 3. Fetch recent conversation history for context (last 10 messages)
  const recentMessages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Reverse to chronological order, exclude the message we just saved
  const history = recentMessages
    .reverse()
    .filter(m => m._id.toString() !== userMessage._id.toString());

  // 4. Call Open WebUI API directly (OpenAI compatible)
  let aiResponseContent = '';
  try {
    const OPENWEBUI_API = process.env.OPENWEBUI_URL 
        ? process.env.OPENWEBUI_URL.split('/?')[0] 
        : 'http://localhost:3000';
    
    // Authorization header (required by Open WebUI)
    const token = process.env.OPENWEBUI_API_KEY || ''; 
    const headers = { 
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Format history for OpenAI format
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message }
    ];

    const response = await axios.post(
      `${OPENWEBUI_API}/api/chat/completions`,
      {
        model: 'siyena', // Le modèle défini dans Open WebUI
        messages: messages,
      },
      {
        timeout: 900000, // Augmenté à 15 minutes car Ollama tourne sur CPU
        headers: headers
      }
    );

    // Open WebUI retourne parfois "null" (status 200) quand le modèle crash ou manque de RAM.
    if (!response.data || !response.data.choices) {
        throw new Error("OOM_OR_CRASH");
    }

    aiResponseContent = response.data.choices[0].message.content || 'Désolé, je n\'ai pas pu générer une réponse.';
    aiResponseContent = aiResponseContent.trim();
  } catch (error) {
    console.error('Erreur Open WebUI:', error.response ? error.response.data : error.message);

    if (error.message === "OOM_OR_CRASH") {
      aiResponseContent = '⚠️ Impossible de charger le modèle. Votre PC manque de RAM disponible (le modèle Llama 3 nécessite au moins 4.6 Go de mémoire libre). Veuillez fermer des applications et réessayer.';
    } else if (error.response && error.response.status === 401) {
      aiResponseContent = '⚠️ Accès refusé à Open WebUI. Veuillez configurer OPENWEBUI_API_KEY dans votre fichier .env.';
    } else if (error.response && error.response.status === 404) {
      aiResponseContent = '⚠️ Modèle "siyena" introuvable dans Open WebUI. Assurez-vous qu\'il existe.';
    } else if (error.code === 'ECONNREFUSED') {
      aiResponseContent = '⚠️ Le service Open WebUI n\'est pas démarré sur le port 3000.';
    } else {
      aiResponseContent = 'Le service IA est actuellement indisponible. Veuillez réessayer plus tard.';
    }
  }

  // 5. Save AI message
  const aiMessage = await Message.create({
    conversationId: conversation._id,
    role: 'assistant',
    content: aiResponseContent
  });

  // Update conversation last activity
  conversation.lastMessageAt = Date.now();
  await conversation.save();

  // 6. Send response
  res.status(200).json({
    status: 'success',
    data: {
      conversationId: conversation._id,
      userMessage,
      aiMessage
    }
  });
});

// @desc    Get all conversations for current user
// @route   GET /api/ai/conversations
// @access  Private (Employee/Admin)
exports.getConversations = asyncHandler(async (req, res, next) => {
  const conversations = await Conversation.find({ userId: req.technician._id })
    .sort({ lastMessageAt: -1 })
    .select('-__v');

  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: {
      conversations
    }
  });
});

// @desc    Get messages for a specific conversation
// @route   GET /api/ai/conversations/:id/messages
// @access  Private (Employee/Admin)
exports.getConversationMessages = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation introuvable.', 404));
  }

  if (conversation.userId.toString() !== req.technician._id.toString()) {
    return next(new AppError('Accès non autorisé à cette conversation.', 403));
  }

  const messages = await Message.find({ conversationId: req.params.id })
    .sort({ createdAt: 1 })
    .select('-__v');

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      conversation,
      messages
    }
  });
});
