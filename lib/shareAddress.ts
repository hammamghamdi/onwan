const shareMessageLines = [
  "هذا عنوان الوصول الخاص بي",
  "This is my access address",
  "یہ میرا رسائی کا پتہ ہے",
  "এটি আমার পৌঁছানোর ঠিকানা",
];

export const createAddressShareMessage = (publicUrl: string) => {
  return [...shareMessageLines, "", publicUrl].join("\n");
};
