export type MinimumRuntimeConfiguration = {
  supabasePublishableKey: string;
  supabaseUrl: string;
};

type RuntimeConfigurationResult = {
  configuration: MinimumRuntimeConfiguration | null;
  error: Error | null;
};

function inspectMinimumRuntimeConfiguration(): RuntimeConfigurationResult {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      configuration: null,
      error: new Error(
        'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el entorno.',
      ),
    };
  }

  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      throw new Error('protocolo no soportado');
    }
  } catch {
    return {
      configuration: null,
      error: new Error('EXPO_PUBLIC_SUPABASE_URL no contiene una URL HTTP válida.'),
    };
  }

  return {
    configuration: { supabasePublishableKey, supabaseUrl },
    error: null,
  };
}

export const minimumRuntimeConfiguration = inspectMinimumRuntimeConfiguration();

export function requireMinimumRuntimeConfiguration() {
  if (minimumRuntimeConfiguration.error || !minimumRuntimeConfiguration.configuration) {
    throw minimumRuntimeConfiguration.error ?? new Error('La configuración mínima de la app no está disponible.');
  }

  return minimumRuntimeConfiguration.configuration;
}
