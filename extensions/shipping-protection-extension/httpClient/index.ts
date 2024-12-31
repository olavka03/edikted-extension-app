const baseURL = 'https://edikted-api-production.up.railway.app';

type RequestMethond = 'GET' | 'POST';

async function request<T>(
  endpoint: string,
  method: RequestMethond = 'GET',
  data: any = null,
): Promise<T> {
  const options: RequestInit = {
    method,
  };

  if (data) {
    options.body = JSON.stringify(data);
    options.headers = {
      'Content-Type': 'application/json; charset=UTF-8',
    };
  }

  try {
    const res = await fetch(baseURL + endpoint, options);

    return res.json();
  } catch (err) {
    throw new Error(err);
  }
}

export const client = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: any) => request<T>(endpoint, 'POST', data),
};
