export const KEY_TOKEN = "accessToken";

export const setToken = (token: string): void => {
  localStorage.setItem(KEY_TOKEN, token);
};

export const getToken = (): string | null => {
  return localStorage.getItem(KEY_TOKEN);
};

export const removeToken = (): void => {
  localStorage.removeItem(KEY_TOKEN);
};
