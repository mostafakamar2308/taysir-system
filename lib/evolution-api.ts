import dotenv from "dotenv";
dotenv.config();
const EVO_API_URL = process.env.EVOLUTION_API_URL!;
const EVO_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_API_KEY!;

interface CreateInstanceParams {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  webhook?: {
    enabled: boolean;
    url: string;
    webhook_by_events?: boolean;
    events?: string[];
  };
}

export async function createEvolutionInstance(params: CreateInstanceParams) {
  const response = await fetch(`${EVO_API_URL}/instance/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVO_GLOBAL_KEY,
    },
    body: JSON.stringify({
      instanceName: params.instanceName,
      token: params.token,
      qrcode: params.qrcode ?? true,
      integration: "WHATSAPP-BAILEYS",
      webhook: params.webhook,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Evolution API error: ${response.status} ${error}`);
  }

  return response.json();
}

const FETCH_TIMEOUT = 15000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = FETCH_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export async function fetchInstanceQR(
  instanceName: string,
  instanceToken: string,
  phoneNumber: string | null,
) {
  let url = `${EVO_API_URL}/instance/connect/${instanceName}`;
  if (phoneNumber) {
    url += `?number=${phoneNumber}`;
  }

  const response = await fetch(url, {
    headers: { apikey: instanceToken },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get QR: ${response.status} ${error}`);
  }

  return response.json();
}

export async function getInstanceState(
  instanceName: string,
  instanceToken: string,
) {
  const response = await fetch(
    `${EVO_API_URL}/instance/connectionState/${instanceName}`,
    {
      headers: { apikey: instanceToken },
    },
  );

  if (response.status === 404) {
    // Instance doesn't exist on Evolution API side, may be disconnected from the user's whatsapp
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to get state: ${response.status}`);
  }

  const data = await response.json();
  return data.instance.state;
}

export async function sendTextMessage(
  instanceName: string,
  instanceToken: string,
  number: string,
  text: string,
  options?: { delay?: number; linkPreview?: boolean },
) {
  const response = await fetchWithTimeout(
    `${EVO_API_URL}/message/sendText/${instanceName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: instanceToken,
      },
      body: JSON.stringify({ number, text, ...options }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send message: ${response.status} ${error}`);
  }

  return response.json();
}

export async function logoutInstance(
  instanceName: string,
  instanceToken: string,
) {
  const response = await fetch(
    `${EVO_API_URL}/instance/logout/${instanceName}`,
    {
      method: "DELETE",
      headers: {
        apikey: instanceToken,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to logout instance: ${response.status} ${error}`);
  }

  return response.json();
}

export async function deleteInstance(instanceName: string) {
  const response = await fetch(
    `${EVO_API_URL}/instance/delete/${instanceName}`,
    {
      method: "DELETE",
      headers: {
        apikey: EVO_GLOBAL_KEY,
      },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete instance: ${response.status} ${error}`);
  }

  return response.json();
}
