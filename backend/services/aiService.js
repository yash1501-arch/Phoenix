const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Optimize and structure itinerary using AI
 */
async function optimizeItinerary(rawItinerary, adventureDetails) {
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
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert travel planner who creates detailed, engaging itineraries. Always respond with valid JSON only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        const parsed = JSON.parse(content);

        // Handle different response formats
        return parsed.itinerary || parsed.items || parsed;
    } catch (error) {
        logger.error('Error optimizing itinerary:', error);
        throw new Error('Failed to optimize itinerary with AI');
    }
}

/**
 * Extract adventure details from PDF
 */
async function extractFromPDF(pdfBuffer) {
    try {
        // pdf-parse v2 exposes a class-based API
        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: pdfBuffer });
        const result = await parser.getText();
        const text = result.text;

        // Use AI to extract structured information
        const prompt = `Extract adventure/tour details from the following text and return a structured JSON object.

Text:
${text}

Please extract and return the following information in JSON format:
{
  "title": "Adventure title",
  "description": "Brief description",
  "location": "Location",
  "duration": "Duration (e.g., '5 Days, 4 Nights')",
  "difficulty": "Easy/Moderate/Challenging",
  "price": numeric value only,
  "maxParticipants": numeric value,
  "included": ["Item 1", "Item 2"],
  "excluded": ["Item 1", "Item 2"],
  "itinerary": [
    {
      "day": 1,
      "title": "Day title",
      "description": "Description",
      "activities": ["Activity 1"],
      "meals": ["Breakfast"],
      "accommodation": "Details"
    }
  ]
}

If any field is not found, use reasonable defaults or null. Ensure all arrays and objects are properly formatted.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert at extracting structured information from travel documents. Always respond with valid JSON only."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        logger.error('Error extracting from PDF:', error);
        throw new Error('Failed to extract information from PDF');
    }
}

/**
 * Generate adventure description using AI
 */
async function generateDescription(adventureDetails) {
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
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert travel writer who creates compelling adventure descriptions."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 500
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        logger.error('Error generating description:', error);
        throw new Error('Failed to generate description with AI');
    }
}

module.exports = {
    optimizeItinerary,
    extractFromPDF,
    generateDescription
};
