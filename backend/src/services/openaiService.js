import OpenAI from 'openai';
import logger from '../utils/winstonLogger.js';

let openaiClient = null;

/**
 * Get or create the OpenAI client singleton.
 * Requires OPENAI_API_KEY env variable.
 */
export function getOpenAIClient() {
  if (openaiClient) return openaiClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Set it in your environment to use AI features.');
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

/**
 * Check if OpenAI is configured
 */
export function isAIEnabled() {
  return !!process.env.OPENAI_API_KEY;
}

// ─────────────────────────────────────────────
// LIVE TRANSCRIPTION (Whisper API)
// ─────────────────────────────────────────────

/**
 * Transcribe an audio buffer using OpenAI Whisper API.
 * @param {Buffer|Blob} audioBuffer - Audio data (webm, wav, mp3, etc.)
 * @param {string} filename - Filename with extension for the audio
 * @param {string} language - ISO 639-1 language code (default 'en')
 * @returns {Promise<{ text: string, segments: Array }>}
 */
export async function transcribeAudio(audioBuffer, filename = 'audio.webm', language = 'en') {
  const openai = getOpenAIClient();
  const startTime = Date.now();

  try {
    // Create a File object for the Whisper API
    const audioFile = new File([audioBuffer], filename, {
      type: getMimeType(filename)
    });

    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    });

    const segments = (response.segments || []).map((seg) => ({
      text: seg.text.trim(),
      startTime: seg.start,
      endTime: seg.end,
      confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.8
    }));

    logger.info('Audio transcribed', {
      source: 'openai',
      model: 'whisper-1',
      duration: response.duration,
      segments: segments.length,
      processingTimeMs: Date.now() - startTime
    });

    return {
      text: response.text,
      segments,
      duration: response.duration || 0,
      language
    };
  } catch (error) {
    logger.error('Transcription failed', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Transcribe a chunk of audio in real-time and return interim/final text.
 * Used for live captions via socket streaming.
 */
export async function transcribeChunk(audioChunk, language = 'en') {
  return transcribeAudio(audioChunk, 'chunk.webm', language);
}

// ─────────────────────────────────────────────
// MEETING SUMMARY (GPT-4o)
// ─────────────────────────────────────────────

/**
 * Generate a meeting summary from transcription text.
 * @param {string} transcript - Full meeting transcript
 * @param {Array} segments - Timestamped segments with speaker info
 * @param {string} language - Language for the summary
 * @returns {Promise<Object>} Summary object with keyPoints, topics, sentiment
 */
export async function generateSummary(transcript, segments = [], language = 'en') {
  const openai = getOpenAIClient();
  const startTime = Date.now();

  const segmentContext = segments.length > 0
    ? segments.map(s => `[${formatTime(s.startTime)}] ${s.speakerName || 'Speaker'}: ${s.text}`).join('\n')
    : transcript;

  const prompt = `You are an expert meeting summarizer. Analyze the following meeting transcript and provide a structured summary.

TRANSCRIPT:
${segmentContext}

Respond with ONLY valid JSON (no markdown fences) in this exact format:
{
  "title": "Brief meeting title (max 10 words)",
  "summary": "2-3 paragraph executive summary",
  "keyPoints": ["key point 1", "key point 2", ...],
  "topics": [
    {"topic": "Topic name", "description": "Brief description of what was discussed"}
  ],
  "participantSummary": [
    {"name": "Speaker name", "contributions": 5, "mainTopics": ["topic1", "topic2"]}
  ],
  "sentiment": {
    "overall": "positive|neutral|negative|mixed",
    "score": 0.0
  }
}

Rules:
- Extract 3-7 key points
- Identify all distinct topics discussed
- Summarize each participant's contributions
- Assess overall meeting sentiment with a score from -1 to 1
- Write in ${language === 'en' ? 'English' : language}
- Be concise but comprehensive`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional meeting analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    const tokensUsed = response.usage?.total_tokens || 0;

    logger.info('Meeting summary generated', {
      source: 'openai',
      model: 'gpt-4o',
      tokensUsed,
      processingTimeMs: Date.now() - startTime
    });

    return {
      ...result,
      metadata: {
        model: 'gpt-4o',
        tokensUsed,
        processingTimeMs: Date.now() - startTime
      }
    };
  } catch (error) {
    logger.error('Summary generation failed', error);
    throw new Error(`Summary generation failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// ACTION ITEM EXTRACTION (GPT-4o)
// ─────────────────────────────────────────────

/**
 * Extract action items from meeting transcript.
 * @param {string} transcript - Full meeting transcript
 * @param {Array} segments - Timestamped segments
 * @returns {Promise<Array>} Array of action items
 */
export async function extractActionItems(transcript, segments = []) {
  const openai = getOpenAIClient();
  const startTime = Date.now();

  const segmentContext = segments.length > 0
    ? segments.map(s => `[${formatTime(s.startTime)}] ${s.speakerName || 'Speaker'}: ${s.text}`).join('\n')
    : transcript;

  const prompt = `You are an expert at identifying action items from meetings. Analyze the following transcript and extract ALL action items, tasks, to-dos, and commitments.

TRANSCRIPT:
${segmentContext}

Respond with ONLY valid JSON (no markdown fences) in this exact format:
{
  "actionItems": [
    {
      "text": "Clear description of the action item",
      "description": "Additional context if needed",
      "assignee": {"name": "Person responsible", "userId": null},
      "priority": "low|medium|high|critical",
      "dueDate": null,
      "tags": ["relevant", "tags"],
      "context": {
        "originalText": "The exact quote from the transcript",
        "speakerName": "Who said it",
        "timestamp": 0
      }
    }
  ]
}

Rules:
- Extract ALL commitments, tasks, and follow-ups mentioned
- Identify who is responsible when mentioned
- Set priority based on urgency language
- Include the original quote as context
- If no action items found, return empty array`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional meeting analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    const tokensUsed = response.usage?.total_tokens || 0;

    logger.info('Action items extracted', {
      source: 'openai',
      count: result.actionItems?.length || 0,
      tokensUsed,
      processingTimeMs: Date.now() - startTime
    });

    return result.actionItems || [];
  } catch (error) {
    logger.error('Action item extraction failed', error);
    throw new Error(`Action item extraction failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// SPEAKER ANALYTICS (GPT-4o)
// ─────────────────────────────────────────────

/**
 * Analyze speaker performance from meeting segments.
 * @param {Array} segments - Timestamped segments with speaker info
 * @param {number} totalDuration - Total meeting duration in seconds
 * @returns {Promise<Array>} Per-speaker analytics
 */
export async function analyzeSpeakers(segments, totalDuration = 0) {
  const openai = getOpenAIClient();
  const startTime = Date.now();

  // Group segments by speaker first for efficient processing
  const speakerMap = new Map();
  for (const seg of segments) {
    const key = seg.speakerId || seg.speakerName || 'Unknown';
    if (!speakerMap.has(key)) {
      speakerMap.set(key, { name: seg.speakerName || 'Unknown', segments: [] });
    }
    speakerMap.get(key).segments.push(seg);
  }

  const speakerTranscripts = [];
  for (const [key, data] of speakerMap) {
    const text = data.segments.map(s => s.text).join(' ');
    const speakTime = data.segments.reduce((sum, s) => sum + ((s.endTime || s.startTime + 5) - s.startTime), 0);
    speakerTranscripts.push({
      id: key,
      name: data.name,
      speakTime,
      text
    });
  }

  const prompt = `You are an expert speech analyst. Analyze the following meeting speakers and provide detailed analytics.

SPEAKERS AND THEIR TRANSCRIPTS:
${speakerTranscripts.map(s => `[${s.name}] (speak time: ${s.speakTime}s):\n${s.text}`).join('\n\n')}

Total meeting duration: ${totalDuration}s

Respond with ONLY valid JSON (no markdown fences) in this exact format:
{
  "speakers": [
    {
      "userId": "speaker id or name",
      "userName": "Display name",
      "totalSpeakTime": 120,
      "wordCount": 250,
      "wordsPerMinute": 125,
      "percentageOfTalkTime": 35.5,
      "sentiment": {"label": "positive|neutral|negative|mixed", "score": 0.0},
      "topics": ["topic1", "topic2"],
      "questions": ["question asked?"],
      "fillerWords": {"total": 5, "breakdown": {"um": 2, "uh": 1, "like": 2}},
      "interruptions": 0
    }
  ]
}

Rules:
- Calculate accurate word counts and WPM
- Identify filler words (um, uh, like, so, basically, etc.)
- Count interruptions (when a speaker cuts off another)
- Identify questions asked
- Extract main topics per speaker
- Assess per-speaker sentiment`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional speech analyst. Always respond with valid JSON only. Calculate metrics accurately.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    const tokensUsed = response.usage?.total_tokens || 0;

    logger.info('Speaker analytics generated', {
      source: 'openai',
      speakers: result.speakers?.length || 0,
      tokensUsed,
      processingTimeMs: Date.now() - startTime
    });

    return result.speakers || [];
  } catch (error) {
    logger.error('Speaker analytics failed', error);
    throw new Error(`Speaker analytics failed: ${error.message}`);
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getMimeType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map = {
    webm: 'audio/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    mp4: 'audio/mp4'
  };
  return map[ext] || 'audio/webm';
}
