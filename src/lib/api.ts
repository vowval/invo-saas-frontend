export async function apiFetch(
  url: string,
  options: RequestInit = {},
) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${url}`,
    {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    },
  );

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`${res.status}: ${message || res.statusText}`);
  }

  return res.json();
}
