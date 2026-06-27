export const normalizeUsername = (value: string) => {
  return value.trim().toLowerCase();
};

export const usernamePattern = /^[a-z][a-z0-9]{4,}$/;

export const isValidUsername = (value: string) => {
  return usernamePattern.test(normalizeUsername(value));
};

export const hasOnlyUsernameCharacters = (value: string) => {
  return /^[A-Za-z0-9]+$/.test(value.trim());
};

export const startsWithEnglishLetter = (value: string) => {
  return /^[A-Za-z]/.test(value.trim());
};
