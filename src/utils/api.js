const apiUrl = import.meta.env.VITE_API_URL;

let csrfToken = null;
let csrfTokenPromise = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${apiUrl}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || typeof data.token !== 'string' || data.token.length === 0) {
          throw new Error(data.message || 'CSRF-tokenin haku epäonnistui.');
        }
        csrfToken = data.token;
        return csrfToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
}

export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers.set('X-CSRF-Token', await getCsrfToken());
  }

  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include'
  });
}
