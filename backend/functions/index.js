import { onDocumentCreated } from "firebase-functions/v2/firestore";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";

admin.initializeApp();

const db = admin.firestore();

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
Required schema:
{
  "trip_summary": { "location": string, "duration": string, "budget_note": string, "cover_image_url": string },
  "hotel_options": [{ "hotel_name": string, "address": string, "price_per_night": number, "price_currency": string, "price_per_night_inr": number, "image_url": string, "rating": number, "description": string, "geo_coordinates": { "lat": number, "lng": number } }],
  "itinerary": { "day_1": { "title": string, "best_time_to_visit": string, "plan": [{ "time": string, "title": string, "item_desc": string, "image_url": string, "ticket_pricing": number, "ticket_currency": string, "ticket_pricing_inr": number, "travel_time_min": number, "geo_coordinates": { "lat": number, "lng": number } }] } }
}
Rules: Use snake_case, real addresses, convert prices to INR.
`.trim();

/**
 * @param {string} textResponse
 */
function parseAIJsonResponse(textResponse) {
  try {
    const raw = textResponse.replace(/```json|```/gi, "").trim();
    return JSON.parse(raw);
  } catch (e) {
    const start = textResponse.indexOf("{");
    const end = textResponse.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(textResponse.slice(start, end + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

export const onTripRequestCreated = onDocumentCreated(
  "Trip_requests/{requestId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const requestData = snapshot.data();
    const { requestId } = event.params;
    const { formData, userEmail, userName, userId } = requestData;

    console.log(`Processing trip request ${requestId} for ${userEmail}`);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-2.5-flash-lite",
      });

      const DYNAMIC_PROMPT = `
      Generate a detailed travel plan for:
      - Location: ${formData.destinationLabel}
      - Duration: ${formData.noOfDays} Days
      - Group: ${formData.travelers}
      - Budget Level: ${formData.budget}
      ${AI_RESPONSE_CONTRACT}
    `.trim();

      const response = await chat.sendMessage({
        message: DYNAMIC_PROMPT,
      });

      const text = response.text ?? "";
      const tripData = parseAIJsonResponse(text);

      if (!tripData) throw new Error("Failed to parse AI response");

      const tripPayload = {
        userSelection: formData,
        tripData: tripData,
        userEmail: userEmail,
        userName: userName,
        userId: userId,
        id: requestId,
        createdAt: new Date().toISOString(),
      };

      await db.collection("Trips").doc(requestId).set(tripPayload);

      await db
        .collection("users")
        .doc(userId)
        .collection("trips")
        .doc(requestId)
        .set(tripPayload);

      await snapshot.ref.update({ status: "completed", tripId: requestId });

      const resend = new Resend(process.env.VITE_RESEND_API_KEY);
      const viewUrl = `https://trip-buddy-n6b3.onrender.com/v2/view-trip/${requestId}`;

      await resend.emails.send({
        from: "TripBuddy <onboarding@resend.dev>",
        to: [userEmail],
        subject: `Your trip to ${formData.destinationLabel} is ready!`,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background-color: #f3f4f6; }
              .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding-bottom: 40px; padding-top: 40px; }
              .container { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
              .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 50px 30px; text-align: center; color: white; }
              .logo { width: 32px; height: 32px; vertical-align: middle; margin-right: 12px; border-radius: 8px; background-color: rgba(255, 255, 255, 0.2); padding: 6px; }
              .brand-name { font-size: 20px; font-weight: 800; vertical-align: middle; letter-spacing: -0.01em; }
              .adventure-text { margin: 16px 0 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; opacity: 0.95; }
              .content { padding: 40px; line-height: 1.7; color: #374151; }
              .content h2 { color: #111827; font-size: 24px; font-weight: 800; margin-bottom: 16px; margin-top: 0; }
              .summary-box { background-color: #f9fafb; border-radius: 20px; padding: 24px; margin: 24px 0; border: 1px solid #f3f4f6; }
              .summary-item { margin-bottom: 16px; }
              .summary-item:last-child { margin-bottom: 0; }
              .summary-label { color: #6b7280; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
              .summary-value { color: #111827; font-size: 16px; font-weight: 800; display: block; line-height: 1.4; word-break: break-word; }
              .button-container { text-align: center; margin: 40px 0 20px; }
              .button { background-color: #4f46e5; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s ease; }
              .footer { padding: 30px; text-align: center; font-size: 13px; color: #9ca3af; }
              .highlight { color: #4f46e5; font-weight: 700; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div style="margin-bottom: 8px;">
                    <img src="https://trip-buddy-n6b3.onrender.com/favicon.png" alt="Logo" class="logo">
                    <span class="brand-name">Trip Buddy</span>
                  </div>
                  <h1 class="adventure-text">Adventure Awaits!</h1>
                </div>
                <div class="content">
                  <h2>Hi ${userName},</h2>
                  <p>Your highly anticipated travel itinerary for <span class="highlight">${formData.destinationLabel}</span> is finally ready for review.</p>
                  
                  <div class="summary-box">
                    <div class="summary-item">
                      <span class="summary-label">Destination</span>
                      <span class="summary-value">${formData.destinationLabel}</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Duration</span>
                      <span class="summary-value">${formData.noOfDays} Days</span>
                    </div>
                    <div class="summary-item">
                      <span class="summary-label">Style</span>
                      <span class="summary-value">${formData.budget} • ${formData.travelers}</span>
                    </div>
                  </div>

                  <p>Our AI has meticulously analyzed thousands of data points to curate the most efficient routes and top-rated experiences specifically for you.</p>
                  
                  <div class="button-container">
                    <a href="${viewUrl}" class="button">Explore Full Itinerary</a>
                  </div>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Trip Buddy. All rights reserved.</p>
                  <p>Designed with passion for effortless exploration.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      });

      console.log(`Successfully processed trip ${requestId}`);
    } catch (error) {
      console.error("Error in onTripRequestCreated:", error);
      const errorMessage =
        typeof error === "object" && error && "message" in error
          ? error.message
          : String(error);
      await snapshot.ref.update({ status: "error", error: errorMessage });
    }
  },
);
