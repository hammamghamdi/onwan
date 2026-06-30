import { createDisplayUrl } from "@/lib/appUrl";

const shareMessageLines = [
  "فضلاً افتح الرابط للوصول للمكان بدقة.",
  "الرابط يحتوي على اللوكيشن + صور العمارة والمدخل + تعليمات الوصول:",
  "Open the link for the exact location, building/entrance photos, and access instructions.",
];

export const createAddressShareMessage = (publicUrl: string) => {
  const displayUrl = createDisplayUrl(publicUrl);

  return [...shareMessageLines, "", displayUrl].join("\n");
};
