const OpenAI = require('openai');
const logger = require('../utils/logger');
const { parseBrochureText } = require('../utils/pdfBrochureParser');

let openaiClient = null;

function getOpenAI() {
    if (!process.env.OPENAI_API_KEY) return null;
    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

function mapOpenAIError(error) {
    const code = error?.code || error?.error?.code;
    const status = error?.status;
    if (status === 429 || code === 'insufficient_quota' || code === 'rate_limit_exceeded') {
        return 'OpenAI quota exceeded. Add credits at platform.openai.com, or we will use basic text parsing instead.';
    }
    if (status === 401) {
        return 'Invalid OpenAI API key. Check OPENAI_API_KEY in backend/.env';
    }
    return error?.message || 'OpenAI request failed';
}

async function extractPdfText(pdfBuffer) {
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: pdfBuffer });
    try {
        const result = await parser.getText();
        return (result?.text || '').trim();
    } finally {
        if (typeof parser.destroy === 'function') {
            try {
                await parser.destroy();
            } catch {
                /* ignore */
            }
        }
    }
}

async function extractWithAI(text) {
    const openai = getOpenAI();
    if (!openai) {
        return { data: null, skipped: true, reason: 'no_api_key' };
    }

    const prompt = `Extract adventure/tour details from the following text and return a structured JSON object.

Text:
${text.slice(0, 28000)}

Return JSON with these fields (use null or [] when missing):
title, description, location, duration, difficulty, category, endurance_level,
base_village, elevation, region, price (full trek price number only, ignore advance deposits),
price_note, maxParticipants, available_dates (YYYY-MM-DD[]),
included[], excluded[], things_to_carry[], pickup_mumbai[], pickup_pune[],
dos[], donts[], trek_guidelines[],
itinerary[{day,title,description,activities[],meals[],accommodation}]

Ignore advance/deposit amounts.`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'Extract structured trek brochure data. Respond with valid JSON only.',
            },
            { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    return { data: JSON.parse(content), skipped: false };
}

/**
 * Extract adventure details from PDF buffer.
 * Tries OpenAI first; falls back to local text parsing.
 */
async function extractFromPDF(pdfBuffer) {
    const text = await extractPdfText(pdfBuffer);

    if (!text || text.replace(/\s/g, '').length < 40) {
        throw new Error(
            'Could not read text from this PDF. It may be a scanned image PDF — export a text-based PDF from your design tool, or re-save with OCR.'
        );
    }

    // Try AI when configured
    if (getOpenAI()) {
        try {
            const ai = await extractWithAI(text);
            if (ai.data) {
                return { ...ai.data, _parser: 'openai' };
            }
        } catch (error) {
            const hint = mapOpenAIError(error);
            logger.warn('OpenAI PDF extract failed, using heuristic fallback:', hint);
            const fallback = parseBrochureText(text);
            if (fallback.title || fallback.price || fallback.available_dates?.length) {
                return {
                    ...fallback,
                    _parser: 'heuristic',
                    _warning: hint,
                };
            }
            throw new Error(hint);
        }
    }

    const fallback = parseBrochureText(text);
    if (!fallback.title && !fallback.price && !fallback.available_dates?.length) {
        throw new Error(
            'Could not detect trek fields in this PDF. Try a text-based brochure PDF, or add OPENAI_API_KEY for smarter extraction.'
        );
    }

    return {
        ...fallback,
        _parser: 'heuristic',
        _warning: getOpenAI() ? undefined : 'OpenAI not configured — used basic text parsing. Some fields may need manual edits.',
    };
}

async function optimizeItinerary(rawItinerary, adventureDetails) {
    const openai = getOpenAI();
    if (!openai) {
        throw new Error('OpenAI API key is not configured');
    }

    try {
        const prompt = `You are an expert travel planner. Given the following adventure details and raw itinerary, 
please optimize and structure it into a well-formatted, engaging itinerary.

Adventure Details:
- Title: ${adventureDetails.title || 'N/A'}
- Location: ${adventureDetails.location || 'N/A'}
- Duration: ${adventureDetails.duration || 'N/A'}
- Difficulty: ${adventureDetails.difficulty || 'N/A'}

Raw Itinerary:
${rawItinerary}

Please return a JSON array of itinerary items with the following structure:
[
  {
    "day": 1,
    "title": "Day title",
    "description": "Detailed description of activities",
    "activities": ["Activity 1", "Activity 2"],
    "meals": ["Breakfast", "Lunch", "Dinner"],
    "accommodation": "Accommodation details"
  }
]

Make it engaging, detailed, and well-structured. Ensure proper timing and logical flow.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert travel planner who creates detailed, engaging itineraries. Always respond with valid JSON only.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content;
        const parsed = JSON.parse(content);
        return parsed.itinerary || parsed.items || parsed;
    } catch (error) {
        logger.error('Error optimizing itinerary:', error);
        throw new Error(mapOpenAIError(error));
    }
}

async function generateDescription(adventureDetails) {
    const openai = getOpenAI();
    if (!openai) {
        throw new Error('OpenAI API key is not configured');
    }

    try {
        const prompt = `Create an engaging, compelling description for this adventure:

Title: ${adventureDetails.title}
Location: ${adventureDetails.location}
Duration: ${adventureDetails.duration}
Difficulty: ${adventureDetails.difficulty}

Write a 2-3 paragraph description that:
- Captures the essence and excitement of the adventure
- Highlights unique features and experiences
- Appeals to potential adventurers
- Is engaging and descriptive

Return only the description text, no JSON.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert travel writer who creates compelling adventure descriptions.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.8,
            max_tokens: 500,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        logger.error('Error generating description:', error);
        throw new Error(mapOpenAIError(error));
    }
}

module.exports = {
    optimizeItinerary,
    extractFromPDF,
    generateDescription,
};
