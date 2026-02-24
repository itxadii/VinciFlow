import { apiClient } from './api';

/**
 * VinciFlow Brand Profile Interface
 * Tone is now a long string to allow for detailed brand "Aura" synthesis.
 */
export interface BrandProfile {
  // --- Mandatory (v1) ---
  brandName: string;
  industry: string;               // User defined (e.g., "AI-SaaS", "Sustainable Fashion")
  region: string;                 // User choice (e.g., "India", "North America")
  tone: string;                   // Long defined string (e.g., "Witty yet professional")
  logoUrl: string;                // S3 path for the brand logo
  colors: string[];               // Array of hex codes
  platforms: string[];            // Default V1: ["Instagram"]

  // --- Optional (v1.5) ---
  targetAudience?: string;
  doWords?: string[];             // Preferred vocabulary
  dontWords?: string[];           // Forbidden vocabulary
  competitors?: string[];
}

/**
 * POST: Save or Update Brand Profile
 */
export const saveBrandProfile = async (data: BrandProfile): Promise<any> => {
  try {
    const response = await apiClient.post('/brand', data);
    return response.data;
  } catch (error) {
    console.error("Error saving brand profile:", error);
    throw error;
  }
};

/**
 * GET: Fetch Existing Brand Profile
 * Returns null if status is 404 (New user needing onboarding)
 */
export const getBrandProfile = async (): Promise<BrandProfile | null> => {
  try {
    const response = await apiClient.get('/brand');
    return response.data;
  } catch (error) {
    if ((error as any).response?.status === 404) {
      return null;
    }
    console.error("Error fetching brand profile:", error);
    throw error;
  }
};