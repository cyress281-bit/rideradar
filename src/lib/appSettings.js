import { appParams } from './app-params';

let cachedSettings = null;

export const getAppSettings = async () => {
  if (cachedSettings) return cachedSettings;

  try {
    const response = await fetch(`${appParams.appBaseUrl}/apps/${appParams.appId}/settings`, {
      headers: {
        'Authorization': `Bearer ${appParams.token}`,
      },
    });

    if (response.ok) {
      cachedSettings = await response.json();
      return cachedSettings;
    }
  } catch (error) {
    console.warn('Failed to fetch app settings:', error);
  }

  // Return defaults if fetch fails
  return {
    name: 'RideRadar',
    logo_url: null,
  };
};

export const useAppSettings = async () => {
  return await getAppSettings();
};