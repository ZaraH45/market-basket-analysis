const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function apiGet<T>(endpoint: string): Promise<T>
{
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {Accept: "application/json",},
    cache: "no-store",
  });

  if (!response.ok)
  {
    let message = `API request failed (${response.status})`;

    try
    {
      const errorData = await response.json();
      message = errorData.detail || message;
    }
    catch
    {

    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
