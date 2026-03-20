import axios from "axios";

const BASE_URL = "https://places.googleapis.com/v1/places:searchText";
export const GOOGLE_PLACES_API_KEY =
  import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";

const config = {
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
    "X-Goog-FieldMask": "places.photos.name,places.displayName,places.id",
  },
};

export const GetPlaceDetails = (data) => axios.post(BASE_URL, data, config);

export const PHOTO_REF_URL = `https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1000&maxWidthPx=1000&key=${GOOGLE_PLACES_API_KEY}`;

export const getStreetViewUrl = (locationText) => {
  if (!GOOGLE_PLACES_API_KEY || !locationText) return "";

  return `https://maps.googleapis.com/maps/api/streetview?size=1200x900&location=${encodeURIComponent(
    locationText,
  )}&fov=85&pitch=0&key=${GOOGLE_PLACES_API_KEY}`;
};
