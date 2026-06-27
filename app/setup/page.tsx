"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, Suspense, useEffect, useRef, useState } from "react";

const copy = {
  ar: {
    title: "أضف بيانات الوصول",
    addressLabel: "عنوانك",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "للتعديل على العنوان مستقبلاً",
    emailHelper:
      "البريد الإلكتروني مهم لتعديل بيانات العنوان مستقبلاً.",
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
    replacePhoto: "استبدال الصورة",
    deletePhoto: "حذف",
    addPhotos: "إضافة صور",
    maxPhotos: "الحد الأعلى 3 صور فقط.",
    uploadError: "تعذر رفع الصورة",
    missingName: "اسم العنوان غير موجود.",
    emailRequired: "أدخل البريد الإلكتروني.",
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
    emailLabel: "Email",
    emailPlaceholder: "For editing this address later",
    emailHelper:
      "Email is important for editing this address in the future.",
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
    replacePhoto: "Replace photo",
    deletePhoto: "Delete",
    addPhotos: "Add photos",
    maxPhotos: "Maximum 3 photos only.",
    uploadError: "Could not upload image",
    missingName: "Address name is missing.",
    emailRequired: "Enter your email address.",
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

  const name = normalizeUsername(searchParams.get("name") || "");

  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const blobPreviewUrls = useRef<string[]>([]);

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

  const createPhotoStoragePath = () => {
    return `photos/${crypto.randomUUID()}.jpg`;
  };

  const replacePhotoAtIndex = (index: number, photo: File) => {
    const previewUrl = URL.createObjectURL(photo);
    blobPreviewUrls.current = [...blobPreviewUrls.current, previewUrl];

    setPhotos((current) => {
      const next = [...current];
      next[index] = photo;
      return next;
    });

    setPhotoPreviews((current) => {
      if (current[index]?.startsWith("blob:")) {
        URL.revokeObjectURL(current[index]);
        blobPreviewUrls.current = blobPreviewUrls.current.filter(
          (url) => url !== current[index]
        );
      }

      const next = [...current];
      next[index] = previewUrl;
      return next;
    });
  };

  const appendPhoto = (photo: File) => {
    const previewUrl = URL.createObjectURL(photo);
    blobPreviewUrls.current = [...blobPreviewUrls.current, previewUrl];

    setPhotos((current) => [...current, photo].slice(0, 3));
    setPhotoPreviews((current) => [...current, previewUrl].slice(0, 3));
  };

  const deletePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setPhotoPreviews((current) => {
      if (current[index]?.startsWith("blob:")) {
        URL.revokeObjectURL(current[index]);
        blobPreviewUrls.current = blobPreviewUrls.current.filter(
          (url) => url !== current[index]
        );
      }

      return current.filter((_, photoIndex) => photoIndex !== index);
    });
  };

  const handlePhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";

    const remainingSlots = 3 - photos.length;

    if (remainingSlots <= 0) {
      setMessage(text.maxPhotos);
      return;
    }

    const acceptedPhotos = selected.slice(0, remainingSlots);

    acceptedPhotos.forEach((photo) => appendPhoto(photo));
    setMessage(selected.length > remainingSlots ? text.maxPhotos : "");
  };

  const handleReplacePhoto = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedPhoto = event.target.files?.[0];
    event.target.value = "";

    if (!selectedPhoto) return;

    replacePhotoAtIndex(index, selectedPhoto);
    setMessage("");
  };

  useEffect(() => {
    return () => {
      blobPreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      blobPreviewUrls.current = [];
    };
  }, []);

  const uploadPhotos = async () => {
    const uploadedPhotos: { publicUrl: string; storagePath: string }[] = [];

    for (const photo of photos) {
      const compressedPhoto = await compressImage(photo);
      const filePath = createPhotoStoragePath();

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

      uploadedPhotos.push({
        publicUrl: data.publicUrl,
        storagePath: filePath,
      });
    }

    return uploadedPhotos;
  };

  const saveAddress = async () => {
    const cleanedMapUrl = extractUrl(mapUrl);

    if (!name || !isValidUsername(name)) {
      setMessage(text.missingName);
      return;
    }

    if (!email.trim()) {
      setMessage(text.emailRequired);
      return;
    }

    if (!isValidEmail(email.trim())) {
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
      const { data: existingProfile, error: duplicateCheckError } =
        await supabase
          .from("profiles")
          .select("username")
          .ilike("username", name)
          .limit(1);

      if (duplicateCheckError) {
        console.log(duplicateCheckError);
        setMessage(text.saveError);
        return;
      }

      if (existingProfile && existingProfile.length > 0) {
        setMessage(text.duplicateName);
        return;
      }

      const uploadedPhotos = await uploadPhotos();
      const photoUrls = uploadedPhotos.map((photo) => photo.publicUrl);
      const photoStoragePaths = uploadedPhotos.map((photo) => photo.storagePath);
      const ownerToken = crypto.randomUUID();

      const { error } = await supabase.from("profiles").insert({
        username: name,
        owner_token: ownerToken,
        email: email.trim().toLowerCase(),
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

      const { error: photosError } = await supabase.rpc(
        "replace_profile_address_photos",
        {
          p_username: name,
          p_owner_token: ownerToken,
          p_storage_paths: photoStoragePaths,
        }
      );

      if (photosError) {
        console.log(photosError);
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
          required
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

        <p className="mb-2 text-sm text-gray-700">{text.photosHelper}</p>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {photoPreviews.map((preview, index) => (
            <div
              key={preview}
              className="rounded-xl border border-gray-200 p-2 text-center"
            >
              <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={preview}
                  alt={`${text.photoAlt} ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <label className="mb-2 block cursor-pointer text-xs font-bold text-[#006b4f]">
                {text.replacePhoto}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleReplacePhoto(index, event)}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={() => deletePhoto(index)}
                className="block w-full text-xs font-bold text-red-700"
              >
                {text.deletePhoto}
              </button>
            </div>
          ))}

          {photos.length < 3 && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-2 text-center">
              <span className="mb-1 text-2xl font-bold text-gray-300">+</span>
              <span className="text-xs font-bold text-[#006b4f]">
                {text.addPhotos}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotos}
                className="sr-only"
              />
            </label>
          )}
        </div>

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
