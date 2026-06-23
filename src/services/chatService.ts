/**
 * Chat API Service - Supports both OpenAI and Google Gemini
 * Updated to use Gemini 2.5 Flash with exponential backoff and correct model naming.
 */

const API_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'gemini';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are an AI assistant specialized in oncology and cancer treatment recommendations. You help healthcare providers with:
- Treatment recommendations based on patient data
- Risk assessment and analysis
- Genomic data interpretation
- Clinical decision support
- Patient care coordination

Always provide evidence-based, professional medical guidance. If asked about specific patient cases, remind users that you provide general information and actual treatment decisions should be made by qualified healthcare professionals.

Keep responses concise, clear, and professional.`;

/**
 * Main entry point for sending chat messages.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  try {
    if (API_PROVIDER === 'gemini') {
      if (!GEMINI_API_KEY) {
        console.warn('Gemini API key missing, using local fallback response.');
        return getFallbackResponse(userMessage);
      }
      return await sendGeminiMessage(messages, userMessage);
    }

    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API key missing, using local fallback response.');
      return getFallbackResponse(userMessage);
    }

    return await sendOpenAIMessage(messages, userMessage);
  } catch (error) {
    console.error('Chat API Error:', error);
    return getFallbackResponse(userMessage);
  }
}

/**
 * OpenAI Implementation
 */
async function sendOpenAIMessage(
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured.');
  }

  const conversationHistory = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages,
    { role: 'user' as const, content: userMessage },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: conversationHistory,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

/**
 * Gemini Implementation with Exponential Backoff
 */
async function sendGeminiMessage(
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  const apiKey = GEMINI_API_KEY || ""; 
  const model = "gemini-2.5-flash-preview-09-2025";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Filter out system messages from history and map roles correctly
  const contents = messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  };

  // Exponential backoff logic: 1s, 2s, 4s, 8s, 16s
  let lastError: any;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
      }
      
      const errorData = await response.json().catch(() => ({}));
      lastError = new Error(errorData.error?.message || `Gemini API error: ${response.statusText}`);
      
      // If it's not a rate limit or server error, don't retry
      if (response.status !== 429 && response.status < 500) break;

    } catch (err) {
      lastError = err;
    }
    
    // Wait for 2^i * 1000ms
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
  }

  throw lastError || new Error("Failed to connect to Gemini API after retries.");
}

/**
 * Fallback responses for local development or disconnected state.
 */
export function getFallbackResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('treatment') || lowerMessage.includes('therapy')) {
    return "I can help with treatment recommendations. For personalized advice, please provide:\n- Patient age and cancer type\n- Current stage and treatment history\n- Genomic markers if available";
  }
  
  if (lowerMessage.includes('risk') || lowerMessage.includes('assessment')) {
    return "Risk assessment involves analyzing multiple factors including cancer type, stage, and comorbidities. Would you like to discuss a specific case?";
  }

  if (lowerMessage.includes('best cancer hospital') || lowerMessage.includes('top cancer hospital') || (lowerMessage.includes('world') && lowerMessage.includes('cancer hospital'))) {
    return "Globally, some of the top-ranked cancer hospitals include the MD Anderson Cancer Center (Texas, USA), Memorial Sloan Kettering Cancer Center (New York, USA), and the Mayo Clinic (Minnesota, USA). These institutions are renowned for their advanced oncology research, groundbreaking clinical trials, and precision medicine programs.";
  }

  if (lowerMessage.includes('what is cancer') || lowerMessage.includes('info about cancer') || lowerMessage.includes('about cancer') || lowerMessage.includes('explain cancer')) {
    return "Cancer is a complex group of diseases characterized by the uncontrolled growth and spread of abnormal cells. If the spread is not controlled, it can result in death. It is caused by changes (mutations) to the DNA within cells. Early detection and precision oncology—tailoring treatment to the genetic profile of the patient and the tumor—are highly effective in modern cancer care.";
  }

  if ((lowerMessage.includes('cancer hospital') || lowerMessage.includes('cancer centre') || lowerMessage.includes('cancer center') || lowerMessage.includes('oncology hospital') || lowerMessage.includes('oncology centre') || lowerMessage.includes('oncology center')) && lowerMessage.includes('pune')) {
    return "In Pune, notable oncology centers include Ruby Hall Clinic, Sahyadri Hospitals (Bund Garden or Magarpatta), and Jehangir Hospital. For the best care pathway, check each center's cancer specialty services and appointment availability.";
  }

  if (lowerMessage.includes('hospital') || lowerMessage.includes('centre') || lowerMessage.includes('center')) {
    return "I can help you identify oncology and cancer care facilities. Please share the city or region you are looking for, and I can suggest appropriate centers and next steps.";
  }

  if (lowerMessage.includes('cancer')) {
    return "Cancer is a broad diagnosis that depends on the type, stage, and treatment history. I can provide general information about cancer, or if you have a specific case, please share details such as the cancer type, stage, or prior therapies.";
  }
  
  return "I'm here to help with oncology treatment recommendations and patient care coordination. How can I assist you today?";
}