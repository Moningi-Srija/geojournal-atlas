export interface ParsedMapData {
  lat: number | null;
  lng: number | null;
  locationName: string;
}

// Internal helper to parse coordinates and location names from long Google Maps URLs
const parseLongGoogleMapsUrl = (url: string, textFallback: string): ParsedMapData => {
  let lat: number | null = null;
  let lng: number | null = null;
  let locationName = textFallback;

  // Try extracting coordinates from "@lat,lng" (standard path parameter)
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    lat = parseFloat(atMatch[1]);
    lng = parseFloat(atMatch[2]);
  } else {
    // Try extracting coordinates from query parameters "q=lat,lng"
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      lat = parseFloat(qMatch[1]);
      lng = parseFloat(qMatch[2]);
    } else {
      // Try query parameters "ll=lat,lng"
      const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (llMatch) {
        lat = parseFloat(llMatch[1]);
        lng = parseFloat(llMatch[2]);
      }
    }
  }

  // Extract place name from URL path "/maps/place/Location+Name/"
  const placeMatch = url.match(/\/maps\/place\/([^/?#]+)/);
  if (placeMatch) {
    locationName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  }

  return { 
    lat, 
    lng, 
    locationName: locationName || textFallback || 'Imported Location' 
  };
};

export const parseGoogleMapsUrl = async (inputStr: string): Promise<ParsedMapData> => {
  const trimmedInput = inputStr.trim();
  if (!trimmedInput) {
    throw new Error('Please enter a Google Maps URL or text.');
  }

  // Extract URL from input text (handles copied messages like "Location Name \n https://maps...")
  const urlRegex = /(https?:\/\/[^\s]+)/;
  const urlMatch = trimmedInput.match(urlRegex);
  const url = urlMatch ? urlMatch[1] : '';

  // Extract text around the URL as a fallback location name
  let textFallback = '';
  if (urlMatch) {
    textFallback = trimmedInput
      .replace(url, '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    textFallback = textFallback.replace(/^[,.\s-]+|[,.\s-]+$/g, '');
  } else {
    textFallback = trimmedInput;
  }

  // If there's no URL at all, return the location name only
  if (!url) {
    return { lat: null, lng: null, locationName: textFallback };
  }

  // Handle shortened URLs (e.g. maps.app.goo.gl or goo.gl/maps)
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || url.includes('maps.google.com/url')) {
    try {
      // Fetch via local dev server proxy middleware
      const response = await fetch(`/api/unshorten?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.finalUrl) {
          return parseLongGoogleMapsUrl(data.finalUrl, textFallback);
        }
      }
    } catch (err) {
      console.warn('Dev server URL expansion failed, falling back to local text parsing:', err);
    }

    // Fall back to location name only
    return { lat: null, lng: null, locationName: textFallback || 'Imported Location' };
  }

  // Handle expanded long URLs directly
  return parseLongGoogleMapsUrl(url, textFallback);
};
