/** Merge brochure PDF extraction results into adventure form state. */
export function mergeExtractedPdfData(prev, extracted) {
    if (!extracted || typeof extracted !== 'object') return prev;

    return {
        ...prev,
        title: extracted.title || prev.title,
        description: extracted.description || prev.description,
        location: extracted.location || prev.location,
        duration: extracted.duration || prev.duration,
        difficulty: extracted.difficulty || prev.difficulty,
        category: extracted.category || prev.category,
        endurance_level: extracted.endurance_level || prev.endurance_level,
        base_village: extracted.base_village || prev.base_village,
        elevation: extracted.elevation || prev.elevation,
        region: extracted.region || prev.region,
        price_note: extracted.price_note || prev.price_note,
        price: extracted.price || prev.price,
        max_participants: extracted.maxParticipants || prev.max_participants,
        available_dates: extracted.available_dates?.length ? extracted.available_dates : prev.available_dates,
        included: extracted.included?.length ? extracted.included : prev.included,
        excluded: extracted.excluded?.length ? extracted.excluded : prev.excluded,
        things_to_carry: extracted.things_to_carry?.length ? extracted.things_to_carry : prev.things_to_carry,
        pickup_mumbai: extracted.pickup_mumbai?.length ? extracted.pickup_mumbai : prev.pickup_mumbai,
        pickup_pune: extracted.pickup_pune?.length ? extracted.pickup_pune : prev.pickup_pune,
        dos: extracted.dos?.length ? extracted.dos : prev.dos,
        donts: extracted.donts?.length ? extracted.donts : prev.donts,
        trek_guidelines: extracted.trek_guidelines?.length ? extracted.trek_guidelines : prev.trek_guidelines,
        itinerary: extracted.itinerary?.length ? extracted.itinerary : prev.itinerary,
    };
}
