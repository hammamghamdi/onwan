"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, Suspense, useState } from "react";

const copy = {
  ar: {
    title: "أضف بيانات الوصول",
    addressLabel: "عنوانك",
    emailLabel: "البريد الإلكتروني (اختياري)",
    emailPlaceholder: "للتعديل على العنوان مستقبلاً",
    emailHelper:
      "البريد الإلكتروني غير إلزامي، لكنه يتيح لك تعديل بيانات العنوان مستقبلاً.",
    cityLabel: "المدينة أو الحي",
    cityPlaceholder: "مثال: الرياض - حي الملقا",
    mapLabel: "رابط الخريطة",
    mapPlaceholder: "الصق رابط Google Maps هنا",
    photosLabel: "صور المدخل",
    photosHelper: "صورة واحدة على الأقل، والحد الأعلى 3 صور.",
    photoAlt: "صورة",
    instructionsLabel: "تعليمات الوصول",
    instructionsPlaceholder:
      "مثال: ادخل من البوابة الرئيسية، ثم اتجه يمينًا...",
    saving: "جاري تجهيز الصور...",
    submit: "إنشاء العنوان",
    imageReadError: "فشل قراءة الصورة.",
    imageCompressError: "فشل ضغط الصورة.",
    imageConvertError: "فشل تحويل الصورة.",
    invalidImage: "الملف المختار ليس صورة صالحة.",
    maxPhotos: "الحد الأعلى 3 صور فقط.",
    uploadError: "تعذر رفع الصورة",
    missingName: "اسم العنوان غير موجود.",
    invalidEmail: "أدخل بريدًا إلكترونيًا صحيحًا.",
    cityRequired: "أدخل المدينة أو الحي.",
    mapRequired: "أدخل رابط الخريطة.",
    invalidMap: "لم يتم العثور على رابط صحيح. الصق رابط Google Maps.",
    photosRequired: "ارفع صورة واحدة على الأقل.",
    instructionsRequired: "أدخل تعليمات الوصول.",
    duplicateName: "هذا العنوان محجوز مسبقًا.",
    saveError: "حدث خطأ أثناء الحفظ.",
    unknownUploadError: "تعذر رفع الصورة: خطأ غير معروف.",
  },
  en: {
    title: "Add arrival details",
    addressLabel: "Your address",
    emailLabel: "Email (optional)",
    emailPlaceholder: "For editing this address later",
    emailHelper:
      "Email is not required, but it lets you edit this address in the future.",
    cityLabel: "City or district",
    cityPlaceholder: "Example: Riyadh - Al Malqa",
    mapLabel: "Map link",
    mapPlaceholder: "Paste the Google Maps link here",
    photosLabel: "Entrance photos",
    photosHelper: "At least one photo, up to 3 photos.",
    photoAlt: "Photo",
    instructionsLabel: "Arrival instructions",
    instructionsPlaceholder:
      "Example: Enter from the main gate, then turn right...",
    saving: "Preparing photos...",
    submit: "Create address",
    imageReadError: "Failed to read the image.",
    imageCompressError: "Failed to compress the image.",
    imageConvertError: "Failed to convert the image.",
    invalidImage: "The selected file is not a valid image.",
    maxPhotos: "Maximum 3 photos only.",
    uploadError: "Could not upload image",
    missingName: "Address name is missing.",
    invalidEmail: "Enter a valid email address.",
    cityRequired: "Enter the city or district.",
    mapRequired: "Enter the map link.",
    invalidMap: "No valid link was found. Paste a Google Maps link.",
    photosRequired: "Upload at least one photo.",
    instructionsRequired: "Enter arrival instructions.",
    duplicateName: "This address is already reserved.",
    saveError: "An error occurred while saving.",
    unknownUploadError: "Could not upload image: unknown error.",
  },
};

function SetupContent() {
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams.get("name") || "";

  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const extractUrl = (value: string) => {
    return value.match(/https?:\/\/\S+/)?.[0]?.trim() || "";
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        image.src = event.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error(text.imageReadError));
      };

      image.onload = () => {
        const maxWidth = 900;
        const scale = Math.min(1, maxWidth / image.width);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error(text.imageCompressError));
          return;
        }

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error(text.imageConvertError));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".jpg"),
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          "image/jpeg",
          0.6
        );
      };

      image.onerror = () => {
        reject(new Error(text.invalidImage));
      };

      reader.readAsDataURL(file);
    });
  };

  const handlePhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);

    if (selected.length > 3) {
      setMessage(text.maxPhotos);
      return;
    }

    photoPreviews.forEach((url) => URL.revokeObjectURL(url));

    const previews = selected.map((photo) => URL.createObjectURL(photo));

    setPhotos(selected);
    setPhotoPreviews(previews);
    setMessage("");
  };

  const uploadPhotos = async () => {
    const urls: string[] = [];

    for (const photo of photos) {
      const compressedPhoto = await compressImage(photo);

      const fileName = `${name}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.jpg`;

      const filePath = `${name}/${fileName}`;

      const { error } = await supabase.storage
        .from("address-photos")
        .upload(filePath, compressedPhoto, {
          contentType: "image/jpeg",
        });

      if (error) {
        console.log("Supabase storage upload error:", error);
        throw new Error(`${text.uploadError}: ${error.message}`);
      }

      const { data } = supabase.storage
        .from("address-photos")
        .getPublicUrl(filePath);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  const saveAddress = async () => {
    const cleanedMapUrl = extractUrl(mapUrl);

    if (!name) {
      setMessage(text.missingName);
      return;
    }

    if (email.trim() && !isValidEmail(email.trim())) {
      setMessage(text.invalidEmail);
      return;
    }

    if (!city.trim()) {
      setMessage(text.cityRequired);
      return;
    }

    if (!mapUrl.trim()) {
      setMessage(text.mapRequired);
      return;
    }

    if (!cleanedMapUrl) {
      setMessage(text.invalidMap);
      return;
    }

    if (photos.length === 0) {
      setMessage(text.photosRequired);
      return;
    }

    if (!instructions.trim()) {
      setMessage(text.instructionsRequired);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const photoUrls = await uploadPhotos();
      const ownerToken = crypto.randomUUID();

      const { error } = await supabase.from("profiles").insert({
        username: name,
        owner_token: ownerToken,
        email: email.trim() ? email.trim().toLowerCase() : null,
        city: city.trim(),
        map_url: cleanedMapUrl,

        instructions_ar: instructions.trim(),
        instructions_en: instructions.trim(),
        instructions_ur: instructions.trim(),
        instructions_bn: instructions.trim(),

        photo1: photoUrls[0] || null,
        photo2: photoUrls[1] || null,
        photo3: photoUrls[2] || null,
      });

      if (error) {
        if (error.code === "23505") {
          setMessage(text.duplicateName);
          return;
        }

        console.log(error);
        setMessage(text.saveError);
        return;
      }

      router.push(`/success?name=${name}&token=${ownerToken}`);
    } catch (error) {
      console.log(error);
      setMessage(
        error instanceof Error ? error.message : text.unknownUploadError
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      dir={language === "en" ? "ltr" : "rtl"}
      className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black"
    >
      <LanguageNav language={language} setLanguage={setLanguage} />

      <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 shadow-sm">
        <h1 className="mb-3 text-center text-2xl font-bold text-black">
          {text.title}
        </h1>

        <div className="mb-5 rounded-2xl bg-gray-100 p-4 text-center">
          <p className="mb-1 text-xs font-bold text-gray-500">
            {text.addressLabel}
          </p>
          <p dir="ltr" className="text-lg font-bold text-black">
            {name}
          </p>
        </div>

        <label className="mb-2 block font-bold text-black">
          {text.emailLabel}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 w-full rounded-xl border p-4 text-black"
          placeholder={text.emailPlaceholder}
        />
        <p className="mb-4 text-sm text-gray-700">{text.emailHelper}</p>

        <label className="mb-2 block font-bold text-black">
          {text.cityLabel}
        </label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mb-4 w-full rounded-xl border p-4 text-black"
          placeholder={text.cityPlaceholder}
        />

        <label className="mb-2 block font-bold text-black">
          {text.mapLabel}
        </label>
        <input
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          className="mb-4 w-full rounded-xl border p-4 text-black"
          placeholder={text.mapPlaceholder}
        />

        <label className="mb-2 block font-bold text-black">
          {text.photosLabel}
        </label>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotos}
          className="mb-2 w-full rounded-xl border p-4 text-black"
        />

        <p className="mb-4 text-sm text-gray-700">{text.photosHelper}</p>

        {photoPreviews.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {photoPreviews.map((preview, index) => (
              <div
                key={preview}
                className="aspect-square overflow-hidden rounded-xl bg-gray-100"
              >
                <img
                  src={preview}
                  alt={`${text.photoAlt} ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <label className="mb-2 block font-bold text-black">
          {text.instructionsLabel}
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="mb-5 w-full rounded-xl border p-4 text-black"
          rows={4}
          placeholder={text.instructionsPlaceholder}
        />

        {message && (
          <p className="mb-4 rounded-xl bg-red-100 p-3 text-center font-bold text-red-700">
            {message}
          </p>
        )}

        <button
          onClick={saveAddress}
          disabled={saving}
          className="w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
        >
          {saving ? text.saving : text.submit}
        </button>
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupContent />
    </Suspense>
  );
}
