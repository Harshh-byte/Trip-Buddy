import { onDocumentCreated } from "firebase-functions/v2/firestore";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import Stripe from "stripe";

admin.initializeApp();

const db = admin.firestore();

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
    const { formData, userEmail, userName, userId, userPhoto } = requestData;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-2.5-flash-lite",
      });

      const DYNAMIC_PROMPT = `
      Generate a detailed travel plan tailored specifically to the user's selected interests and traveler group composition.
      Details:
      - Location: ${formData.destinationLabel}
      - Duration: ${formData.noOfDays} Days
      - Group: ${formData.travelers}
      - Budget Level: ${formData.budget}
      - Interests: ${formData.interests ? formData.interests.join(", ") : "General Travel"}

      Crucial Customization Rules:
      - Heavily tailor the itinerary activities ("plan") and hotel recommendations ("hotel_options") to align with and lean into the selected interests.
      - For instance, if "Food" is selected, prioritize culinary tours, local street food markets, and highly-rated dining spots. If "Adventure" is selected, focus on outdoor excursions, hikes, and active thrills. If "Relaxation" is selected, prioritize spas, beaches, and slow-paced/leisurely schedules.

      - Also heavily tailor the itinerary and hotels based on the Group/traveler type:
        - If Group is "1 Person" (Solo): Focus on social hotspots, hostels or highly-rated single-friendly boutique hotels, flexible/self-guided exploration, and single-ticket entry experiences.
        - If Group is "2 People" (Couple): Focus on romantic views, intimate or fine dining experiences, cozy boutique/romantic hotels, and scenery.
        - If Group is "3 to 5 People" (Family): Focus on kid-friendly pace, educational landmarks, parks, and hotels offering spacious/suite rooms with family amenities.
        - If Group is "5+ People" (Friends): Focus on group-friendly tours/activities, group dining tables, vibrant nightlife, active group/team thrills, and spacious or adjacent accommodations.

      - Blend these interests and group needs naturally into the daily schedule while respecting the location and budget level.

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
        userPhoto: userPhoto || "",
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

      const resendApiKey = process.env.VITE_RESEND_API_KEY;
      const viewUrl = `https://trip-buddy-n6b3.onrender.com/v2/view-trip/${requestId}`;

      if (userEmail && resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          await resend.emails.send({
          from: "TripBuddy <onboarding@resend.dev>",
          to: [userEmail],
          subject: `Your trip to ${formData.destinationLabel} is ready!`,
          html: `
<!doctype html>
<html>
   <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
         body {
         margin: 0;
         padding: 0;
         background-color: #f3f4f6;
         width: 100% !important;
         height: 100% !important;
         -webkit-text-size-adjust: 100%;
         -ms-text-size-adjust: 100%;
         }
         table {
         border-collapse: separate;
         width: 100%;
         }
         img {
         border: 0;
         height: auto;
         line-height: 100%;
         outline: none;
         text-decoration: none;
         display: block;
         }
         .wrapper {
         width: 100%;
         background-color: #f3f4f6;
         padding: 40px 0;
         }
         .container {
         font-family:
         "Inter",
         -apple-system,
         BlinkMacSystemFont,
         "Segoe UI",
         Roboto,
         Helvetica,
         Arial,
         sans-serif;
         max-width: 600px;
         margin: 0 auto;
         background-color: #ffffff;
         border-radius: 24px;
         overflow: hidden;
         box-shadow:
         0 20px 25px -5px rgba(0, 0, 0, 0.1),
         0 10px 10px -5px rgba(0, 0, 0, 0.04);
         }
         .content-header {
         margin-bottom: 30px;
         }
         .logo-row-content {
         display: inline-flex;
         align-items: center;
         padding: 8px 16px;
         background-color: #f3f4f6;
         border-radius: 999px;
         margin-bottom: 16px;
         margin-left: -16px;
         }
         .logo {
         width: 24px;
         height: 24px;
         margin-right: 8px;
         }
         .brand-name {
         font-size: 16px;
         font-weight: 800;
         letter-spacing: -0.01em;
         color: #4b5563;
         }
         .hero-text-content {
         margin: 0;
         font-size: 32px;
         font-weight: 900;
         letter-spacing: -0.02em;
         color: #111827;
         }
         .content {
         padding: 40px 40px 20px;
         line-height: 1.8;
         color: #374151;
         }
         .content h2 {
         color: #111827;
         font-size: 20px;
         font-weight: 800;
         margin-bottom: 20px;
         margin-top: 0;
         }
         .content p {
         margin: 0 0 20px;
         }
         .summary-table {
         margin: 20px 0 40px;
         border: 1px solid #e5e7eb;
         border-radius: 16px;
         background-color: #f9fafb;
         overflow: hidden;
         }
         .summary-item {
         border-bottom: 1px solid #e5e7eb;
         }
         .summary-item:last-child {
         border-bottom: none;
         }
         .summary-icon-td {
         padding: 20px 0 20px 20px;
         width: 48px;
         }
         .summary-text-td {
         padding: 20px 20px 20px 0;
         }
         .summary-icon {
         width: 24px;
         height: 24px;
         opacity: 0.8;
         }
         .summary-label {
         color: #6b7280;
         font-size: 11px;
         font-weight: 800;
         text-transform: uppercase;
         letter-spacing: 0.05em;
         display: block;
         margin-bottom: 4px;
         }
         .summary-value {
         color: #111827;
         font-size: 16px;
         font-weight: 800;
         display: block;
         line-height: 1.4;
         }
         .button-container {
         text-align: center;
         margin: 40px 0 20px;
         }
         .button {
         background-color: #4f46e5;
         color: #ffffff !important;
         padding: 18px 50px;
         text-decoration: none;
         border-radius: 14px;
         font-weight: 700;
         font-size: 16px;
         display: inline-block;
         transition: background-color 0.2s ease;
         }
         .footer {
         padding: 30px;
         text-align: center;
         font-size: 13px;
         color: #9ca3af;
         }
         .highlight {
         color: #4f46e5;
         font-weight: 700;
         }
         @media only screen and (max-width: 600px) {
         .container {
         border-radius: 0 !important;
         width: 100% !important;
         max-width: 100% !important;
         }
         .header {
         height: 180px !important;
         }
         .content {
         padding: 30px 20px 10px !important;
         }
         .hero-text-content {
         font-size: 28px !important;
         }
         .button {
         padding: 16px 30px !important;
         width: 100%;
         box-sizing: border-box;
         }
         }
      </style>
   </head>
   <body>
      <div class="wrapper">
         <div class="container">
            <div class="content">
               <div class="content-header">
                  <div class="logo-row-content">
                     <img
                        src="https://trip-buddy-n6b3.onrender.com/favicon.png"
                        alt="Trip Buddy Logo"
                        class="logo"
                        />
                     <span class="brand-name">Trip Buddy</span>
                  </div>
                  <h1 class="hero-text-content">Adventure Awaits!</h1>
               </div>
               <h2>Hi ${userName},</h2>
               <p>
                  The wait is over! Your highly anticipated travel itinerary for
                  <span class="highlight">${formData.destinationLabel}</span> is
                  finally ready.
               </p>
               <p>
                  Get ready to experience the perfect mix of must-see landmarks and
                  hidden gems. We've curated every detail so you can just relax and
                  enjoy the journey.
               </p>
               <table class="summary-table" cellpadding="0" cellspacing="0">
                  <tr class="summary-item">
                     <td class="summary-icon-td">
                        <img
                           src="https://cdn-icons-png.flaticon.com/512/3125/3125713.png"
                           alt="Plane"
                           class="summary-icon"
                           />
                     </td>
                     <td class="summary-text-td">
                        <span class="summary-label">Destination</span>
                        <span class="summary-value">${formData.destinationLabel}</span>
                     </td>
                  </tr>
                  <tr class="summary-item">
                     <td class="summary-icon-td">
                        <img
                           src="https://cdn-icons-png.flaticon.com/512/747/747310.png"
                           alt="Calendar"
                           class="summary-icon"
                           />
                     </td>
                     <td class="summary-text-td">
                        <span class="summary-label">Duration</span>
                        <span class="summary-value">${formData.noOfDays} Days</span>
                     </td>
                  </tr>
                  <tr class="summary-item">
                     <td class="summary-icon-td">
                        <img
                           src="https://cdn-icons-png.flaticon.com/512/992/992490.png"
                           alt="Travelers"
                           class="summary-icon"
                           />
                     </td>
                     <td class="summary-text-td">
                        <span class="summary-label">Travelers</span>
                        <span class="summary-value">${formData.travelers}</span>
                     </td>
                  </tr>
                  <tr class="summary-item">
                     <td class="summary-icon-td">
                        <img
                           src="https://cdn-icons-png.flaticon.com/512/10691/10691811.png"
                           alt="Budget"
                           class="summary-icon"
                           />
                     </td>
                     <td class="summary-text-td">
                        <span class="summary-label">Estimated Budget</span>
                        <span class="summary-value">${formData.budget}</span>
                     </td>
                  </tr>
               </table>
               <p>
                  Our AI analyzed thousands of data points to ensure you get the most
                  efficient routes and top-rated experiences. Log in to your dashboard
                  now to see your day-by-day plan, make adjustments, or start booking.
               </p>
               <div class="button-container">
                  <a href="${viewUrl}" class="button">Explore Your Full Itinerary</a>
               </div>
            </div>
            <div class="footer">
               <p>
                  © ${new Date().getFullYear()} Trip Buddy Inc. All rights reserved.
               </p>
                <p>Designed with passion for effortless exploration.</p>
             </div>
          </div>
       </div>
    </body>
 </html>
 `,
          });
        } catch (emailError) {
        }
      }

      await snapshot.ref.update({ status: "completed", tripId: requestId });
    } catch (error) {
      const errorMessage =
        typeof error === "object" && error && "message" in error
          ? error.message
          : String(error);
      await snapshot.ref.update({ status: "error", error: errorMessage });
    }
  },
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "REMOVED");

export const createStripeCheckoutSession = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in to checkout.");
  }
  const uid = request.auth.uid;
  const email = request.auth.token.email || "";
  const { successUrl, cancelUrl } = request.data;

  if (!successUrl || !cancelUrl) {
    throw new HttpsError("invalid-argument", "successUrl and cancelUrl are required.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "TripBuddy Premium Upgrade",
              description: "Lifetime access to Unlimited PDF Downloads, Group Collaborative Editing, and 24/7 AI Chat Assistant.",
            },
            unit_amount: 1900, // $19.00 USD
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl + "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: cancelUrl,
      metadata: {
        userId: uid,
      },
      customer_email: email,
    });

    return { url: session.url };
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    throw new HttpsError("internal", error.message || "Failed to create Stripe session.");
  }
});

export const verifyStripeSession = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }
  const { sessionId } = request.data;
  if (!sessionId) {
    throw new HttpsError("invalid-argument", "sessionId is required.");
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      const userId = session.metadata.userId;
      
      // Update Firestore user document
      await db.collection("users").doc(userId).set(
        {
          isPremium: true,
          premiumPurchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { success: true };
    }
    return { success: false, status: session.payment_status };
  } catch (error) {
    console.error("Stripe Verification Error:", error);
    throw new HttpsError("internal", error.message || "Failed to verify session.");
  }
});

export const stripeWebhook = onRequest({ cors: true }, async (req, res) => {
  let event = req.body;

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (userId) {
        await db.collection("users").doc(userId).set(
          {
            isPremium: true,
            premiumPurchasedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Stripe Webhook Error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
