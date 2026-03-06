import { apiClient } from './api';

// brandApi.ts mein interface update karein
export interface BrandProfile {
  // DynamoDB ke PascalCase se match hona chahiye
  BrandName: string;
  Industry: string;
  Region: string;
  Tone: string;
  LogoUrl: string;
  Colors: string[];
  Platforms: string[];
  
  // Optional fields (V1.5)
  TargetAudience?: string;
  DoWords?: string[];
  DontWords?: string[];
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