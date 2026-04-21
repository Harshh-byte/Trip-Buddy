import { GoogleGenAI } from "@google/genai";

const FX_TO_INR = {
  USD: 83,
  EUR: 90,
  GBP: 106,
  INR: 1,
  JPY: 0.56,
  CAD: 61,
  AUD: 55,
  SGD: 62,
  AED: 23,
  SAR: 22,
  TRY: 2.6,
  THB: 2.3,
  KRW: 0.062,
  CNY: 11.5,
  HKD: 10.6,
  BRL: 16.7,
  MXN: 4.9,
  ZAR: 4.5,
  CHF: 95,
};

const CURRENCY_SYMBOL_TO_CODE = {
  $: "USD",
  US$: "USD",
  "€": "EUR",
  "£": "GBP",
  "₹": "INR",
  "¥": "JPY",
  C$: "CAD",
  A$: "AUD",
  S$: "SGD",
  "₩": "KRW",
  "₺": "TRY",
  "฿": "THB",
  R$: "BRL",
  R: "ZAR",
};

const AI_RESPONSE_CONTRACT = `
Return ONLY valid JSON (no markdown, no explanations).

INSTRUCTIONS:
1) Research REAL hotels and REAL attractions for the given location.
2) If no reliable image URL is available for 'image_url', return an empty string.
3) Ensure 'rating' is a number between 1.0 and 5.0.
4) 'address' must be a full, real-world street address.

Required schema:
{
  "trip_summary": {
    "location": string,
    "duration": string,
    "budget_note": string,
    "cover_image_url": string
  },
  "hotel_options": [
    {
      "hotel_name": string,
      "address": string,
      "price_per_night": number,
      "price_currency": string,
      "price_per_night_inr": number,
      "image_url": string,
      "rating": number,
      "description": string,
      "geo_coordinates": { "lat": number, "lng": number }
    }
  ],
  "itinerary": {
    "day_1": {
      "title": string,
      "best_time_to_visit": string,
      "plan": [
        {
          "time": string,
          "title": string,
          "item_desc": string,
          "image_url": string,
          "ticket_pricing": number,
          "ticket_currency": string,
          "ticket_pricing_inr": number,
          "travel_time_min": number,
          "geo_coordinates": { "lat": number, "lng": number }
        }
      ]
    }
  }
}

Rules:
- Use underscores (image_url, hotel_name, geo_coordinates) NOT camelCase.
- Provide real ratings (e.g., 4.5) and real addresses.
- If a ticket is free, ticket_pricing is 0.
- Convert all prices to INR and include rounded integer fields: price_per_night_inr and ticket_pricing_inr.
- best_time_to_visit MUST be in clock style only, e.g. "9 AM - 12 PM" or "11 AM".
- Do NOT return vague words like "Morning", "Afternoon", "Evening", "Night", or "Anytime".
`.trim();

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });
const chat = ai.chats.create({
  model: "gemini-2.5-flash-lite",
});

/** @param {string} input */
function normalizeJsonLikeText(input) {
  if (!input) return "";

  return input
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, " ")
    .trim();
}

/** @param {string} input */
function removeTrailingCommas(input) {
  return input.replace(/,\s*([}\]])/g, "$1");
}

/** @param {string} input */
function extractBalancedJsonObject(input) {
  const text = input || "";
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      if (start === -1) {
        start = i;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (start !== -1 && depth === 0) {
        return text.slice(start, i + 1).trim();
      }
    }
  }

  return null;
}

/** @param {string | null} candidate */
function parseCandidate(candidate) {
  if (!candidate) return null;

  const normalized = normalizeJsonLikeText(candidate);

  try {
    return JSON.parse(normalized);
  } catch {}

  const noTrailingCommas = removeTrailingCommas(normalized);
  try {
    return JSON.parse(noTrailingCommas);
  } catch {}

  try {
    const parsedString = JSON.parse(noTrailingCommas);
    if (typeof parsedString === "string") {
      const inner = removeTrailingCommas(parsedString.trim());
      return JSON.parse(inner);
    }
  } catch {}

  return null;
}

/** @param {string} textResponse */
function parseAIJsonResponse(textResponse) {
  if (!textResponse) return null;

  const raw = normalizeJsonLikeText(textResponse);
  const fencedBlock = (raw.match(/```(?:json)?\s*([\s\S]*?)```/i) ||
    [])[1]?.trim();
  const balancedObject = extractBalancedJsonObject(raw);

  const candidates = [
    raw,
    raw.replace(/```json|```/gi, "").trim(),
    fencedBlock,
    balancedObject,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const parsed = parseCandidate(candidate);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  }

  return null;
}

/** @param {string} prompt */
function extractRequestedLocation(prompt) {
  if (!prompt || typeof prompt !== "string") return "";

  const lineMatch = prompt.match(/Location:\s*(.+)/i);
  if (lineMatch?.[1]) {
    return lineMatch[1].trim();
  }

  return "";
}

/** @param {string} value */
function normalizeLocationTokens(value) {
  if (!value || typeof value !== "string") return [];

  return value
    .toLowerCase()
    .split(/[.,\-]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
}

/** @param {any} payload @param {string} requestedLocation */
function isLocationAligned(payload, requestedLocation) {
  if (!requestedLocation) return true;

  const generated = payload?.trip_summary?.location || "";
  if (!generated || typeof generated !== "string") return false;

  const requestedTokens = normalizeLocationTokens(requestedLocation);
  const generatedLower = generated.toLowerCase();

  if (!requestedTokens.length) return true;

  return requestedTokens.some((token) => generatedLower.includes(token));
}

/** @param {unknown} amount @param {string | null | undefined} currencyCode */
function getRoundedInr(amount, currencyCode) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return null;

  const code =
    typeof currencyCode === "string" ? currencyCode.toUpperCase() : null;
  const rate =
    (code && FX_TO_INR[/** @type {keyof typeof FX_TO_INR} */ (code)]) ||
    FX_TO_INR.USD;
  return Math.round(numericAmount * rate);
}

/** @param {unknown} value */
function parsePriceLikeValue(value) {
  if (value === null || value === undefined) {
    return { amount: null, currency: null };
  }

  if (typeof value === "number") {
    return { amount: value, currency: "INR" };
  }

  if (typeof value !== "string") {
    return { amount: null, currency: null };
  }

  const raw = value.trim();
  const amountText =
    raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] || null;
  const amount = amountText ? Number(amountText) : null;

  const codeMatch = raw.match(/\b([A-Z]{3})\b/);
  if (codeMatch) {
    return { amount, currency: codeMatch[1].toUpperCase() };
  }

  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOL_TO_CODE)) {
    if (raw.includes(symbol)) {
      return { amount, currency: code };
    }
  }

  return { amount, currency: null };
}

/** @param {any} hotel */
function normalizeHotelPrice(hotel) {
  const explicitAmount =
    hotel?.price_per_night ??
    hotel?.price_per_night_inr ??
    hotel?.priceRange ??
    hotel?.price ??
    null;
  const explicitCurrency =
    hotel?.price_currency ??
    (hotel?.price_per_night_inr !== undefined ? "INR" : null);

  const parsed = parsePriceLikeValue(explicitAmount);
  const amount = parsed.amount;
  const currency = (explicitCurrency || parsed.currency || "INR").toUpperCase();

  return {
    price_per_night: Number.isFinite(Number(amount)) ? Number(amount) : null,
    price_currency: currency,
    price_per_night_inr: getRoundedInr(amount, currency),
  };
}

/** @param {any} item */
function normalizeTicketPrice(item) {
  const explicitAmount = item?.ticket_pricing ?? item?.ticket_price ?? null;
  const explicitCurrency = item?.ticket_currency ?? null;
  const parsed = parsePriceLikeValue(explicitAmount);
  const amount = parsed.amount;
  const currency = (explicitCurrency || parsed.currency || "INR").toUpperCase();

  return {
    ticket_pricing: Number.isFinite(Number(amount)) ? Number(amount) : null,
    ticket_currency: currency,
    ticket_pricing_inr: getRoundedInr(amount, currency),
  };
}

/** @param {any} itinerary */
function normalizeItineraryShape(itinerary) {
  if (!itinerary) return {};

  if (Array.isArray(itinerary)) {
    return Object.fromEntries(
      itinerary.map((day, index) => {
        const dayNumber = Number(day?.day || day?.dayNumber) || index + 1;
        return [`day_${dayNumber}`, day && typeof day === "object" ? day : {}];
      }),
    );
  }

  if (typeof itinerary === "object") {
    return itinerary;
  }

  return {};
}

/** @param {any} payload */
function hasImageCoverage(payload) {
  const hotels = Array.isArray(payload?.hotel_options)
    ? payload.hotel_options
    : [];
  const itinerary =
    payload?.itinerary && typeof payload.itinerary === "object"
      ? payload.itinerary
      : {};

  if (hotels.length === 0) {
    return false;
  }

  const hotelsHaveImages = hotels.every(
    /** @type {(hotel: any) => boolean} */ (hotel) =>
      typeof hotel?.image_url === "string" &&
      hotel.image_url.trim().startsWith("https://"),
  );

  if (!hotelsHaveImages) {
    return false;
  }

  const days = Object.values(itinerary);
  if (days.length === 0) {
    return false;
  }

  for (const day of days) {
    const dayObject = day && typeof day === "object" ? day : {};
    const plan = Array.isArray(dayObject?.plan) ? dayObject.plan : [];
    if (plan.length === 0) {
      return false;
    }

    const dayHasAllImages = plan.every(
      /** @type {(item: any) => boolean} */ (item) =>
        typeof item?.image_url === "string" &&
        item.image_url.trim().startsWith("https://"),
    );

    if (!dayHasAllImages) {
      return false;
    }
  }

  return true;
}

/** @param {any} trip */
function normalizeTripPayload(trip) {
  const payload = trip && typeof trip === "object" ? { ...trip } : {};
  const summarySource = payload?.trip_summary || payload?.tripSummary || {};
  const summary =
    summarySource && typeof summarySource === "object"
      ? { ...summarySource }
      : {};
  const hotelsSource =
    payload?.hotel_options || payload?.hotelOptions || payload?.hotels || [];
  const hotels = Array.isArray(hotelsSource) ? hotelsSource : [];

  const normalizedHotels = hotels.map((hotel) => {
    const rawHotel = hotel && typeof hotel === "object" ? hotel : {};
    const priceData = normalizeHotelPrice(hotel);
    const ratingNumber = Number(rawHotel?.rating);
    const safeRating = Number.isFinite(ratingNumber)
      ? Math.max(0, Math.min(5, Math.round(ratingNumber * 10) / 10))
      : null;

    return {
      ...rawHotel,
      ...priceData,
      hotel_name: rawHotel?.hotel_name || rawHotel?.hotelName || null,
      address:
        rawHotel?.address ||
        rawHotel?.hotelAddress ||
        rawHotel?.location ||
        null,
      rating: safeRating,
      image_url:
        typeof (rawHotel?.image_url || rawHotel?.imageUrl) === "string"
          ? String(rawHotel?.image_url || rawHotel?.imageUrl).trim()
          : null,
      geo_coordinates:
        rawHotel?.geo_coordinates ||
        rawHotel?.coordinates ||
        rawHotel?.geo ||
        null,
      description:
        typeof rawHotel?.description === "string"
          ? rawHotel.description.trim()
          : null,
    };
  });

  const itinerary =
    payload?.itinerary || payload?.day_wise_plan || payload?.days || null;

  const normalizedRawItinerary = normalizeItineraryShape(itinerary);

  const normalizedItinerary = Object.fromEntries(
    Object.entries(normalizedRawItinerary).map(([dayKey, dayValue]) => {
      const dayObject =
        dayValue && typeof dayValue === "object" ? dayValue : {};
      const plan = Array.isArray(dayObject?.plan)
        ? dayObject.plan
        : Array.isArray(dayObject?.activities)
          ? dayObject.activities
          : [];

      const normalizedPlan = plan.map((/** @type {any} */ item) => {
        const rawItem = item && typeof item === "object" ? item : {};
        const priceData = normalizeTicketPrice(item);
        return {
          ...rawItem,
          ...priceData,
          title: rawItem?.title || rawItem?.activityName || null,
          image_url:
            typeof (rawItem?.image_url || rawItem?.imageUrl) === "string"
              ? String(rawItem?.image_url || rawItem?.imageUrl).trim()
              : null,
          travel_time_min:
            rawItem?.travel_time_min ??
            rawItem?.travelTimeMin ??
            rawItem?.timeToTravel ??
            null,
          geo_coordinates:
            rawItem?.geo_coordinates ||
            rawItem?.coordinates ||
            rawItem?.geo ||
            null,
          item_desc:
            typeof rawItem?.item_desc === "string"
              ? rawItem.item_desc.trim()
              : typeof rawItem?.itemDesc === "string"
                ? rawItem.itemDesc.trim()
                : typeof rawItem?.activityDescription === "string"
                  ? rawItem.activityDescription.trim()
                  : null,
        };
      });

      return [
        dayKey,
        {
          ...dayObject,
          title: dayObject?.title || dayObject?.theme || null,
          best_time_to_visit:
            dayObject?.best_time_to_visit || dayObject?.bestTime || "11 AM",
          plan: normalizedPlan,
        },
      ];
    }),
  );

  const coverImageFromHotels =
    normalizedHotels.find((hotel) => hotel?.image_url)?.image_url || null;

  return {
    ...payload,
    tripNote: payload?.tripNote || payload?.trip_note || null,
    trip_summary: {
      ...summary,
      location: summary?.location || null,
      duration: summary?.duration || null,
      budget_note: summary?.budget_note || summary?.budgetNote || null,
      cover_image_url:
        typeof (summary?.cover_image_url || summary?.coverImageUrl) ===
          "string" &&
        String(summary?.cover_image_url || summary?.coverImageUrl).trim()
          ? String(summary?.cover_image_url || summary?.coverImageUrl).trim()
          : coverImageFromHotels,
    },
    hotel_options: normalizedHotels,
    itinerary: normalizedItinerary,
  };
}

/** @param {string} DYNAMIC_PROMPT */
export async function generateTripWithAI(DYNAMIC_PROMPT) {
  try {
    const requestedLocation = extractRequestedLocation(DYNAMIC_PROMPT);

    const response = await chat.sendMessage({
      message: `${DYNAMIC_PROMPT}\n\n${AI_RESPONSE_CONTRACT}`,
    });

    const textResponse = response.text ?? "";
    if (!textResponse) {
      throw new Error("Empty response received from AI model");
    }

    const parsedTrip = parseAIJsonResponse(textResponse);
    if (!parsedTrip) {
      throw new Error(
        "AI returned non-JSON content. Please try again with the same inputs.",
      );
    }

    let normalizedTrip = normalizeTripPayload(parsedTrip);

    if (
      !hasImageCoverage(normalizedTrip) ||
      !isLocationAligned(normalizedTrip, requestedLocation)
    ) {
      const repairResponse = await chat.sendMessage({
        message:
          `Repair this JSON so it strictly matches Location: ${requestedLocation || "provided location"}. Ensure EVERY hotel and itinerary place is from that location/country, EVERY hotel and itinerary place has a valid image_url, and EVERY best_time_to_visit is in clock format like "9 AM - 12 PM" or "11 AM". Keep all other details and schema keys. Return JSON only.\n\n` +
          JSON.stringify(normalizedTrip),
      });

      const repairedText = repairResponse.text ?? "";
      const repairedParsed = parseAIJsonResponse(repairedText);
      if (repairedParsed) {
        normalizedTrip = normalizeTripPayload(repairedParsed);
      }
    }

    return normalizedTrip;
  } catch (error) {
    console.log("Error generating trip:", error);
    throw error;
  }
}
