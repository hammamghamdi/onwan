"use client";

import { LanguageNav } from "@/app/components/LanguageNav";
import { createDisplayUrl, createPublicAddressUrl } from "@/lib/appUrl";
import { createAddressShareMessage } from "@/lib/shareAddress";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/useLanguage";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChangeEvent, Suspense, useEffect, useRef, useState } from "react";

type ManageProfile = {
  username: string;
  city: string | null;
  map_url: string | null;
  instructions_ar: string | null;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
};

const copy = {
  ar: {
    title: "تعديل عنوانك",
    addressLabel: "عنوانك",
    unnamed: "غير محدد",
    loading: "جاري تحميل العنوان...",
    missingName: "اسم العنوان غير موجود.",
    missingToken: "رمز التعديل غير موجود.",
    invalidAccess: "الرابط غير صحيح أو لا تملك صلاحية التعديل.",
    cannotEdit: "لا يمكن تعديل هذا العنوان.",
    cityRequired: "أدخل المدينة أو الحي.",
    mapRequired: "أدخل رابط الخريطة.",
    invalidMap: "لم يتم العثور على رابط صحيح. الصق رابط Google Maps.",
    instructionsRequired: "أدخل تعليمات الوصول.",
    saveError: "حدث خطأ أثناء حفظ التعديلات.",
    saveSuccess: "تم حفظ التعديلات بنجاح.",
    cityLabel: "المدينة أو الحي",
    cityPlaceholder: "مثال: الرياض - حي الملقا",
    mapLabel: "رابط الخريطة",
    mapPlaceholder: "الصق رابط Google Maps هنا",
    photosLabel: "صور الوصول",
    photosHelper: "يمكنك استبدال الصور الحالية أو إضافة الصور الناقصة، بحد أقصى 3 صور.",
    landscapePhotoNote:
      "يفضل رفع صور الوصول بالعرض (أفقية) للحصول على أفضل نتيجة.",
    viewPhotoExample: "شاهد المثال",
    photoAlt: "صورة الوصول",
    replacePhoto: "استبدال الصورة",
    addPhoto: "إضافة صورة",
    close: "إغلاق",
    imageReadError: "فشل قراءة الصورة.",
    imageCompressError: "فشل ضغط الصورة.",
    imageConvertError: "فشل تحويل الصورة.",
    invalidImage: "الملف المختار ليس صورة صالحة.",
    deletePhoto: "حذف",
    uploadError: "تعذر رفع الصورة",
    unknownUploadError: "تعذر رفع الصورة: خطأ غير معروف.",
    instructionsLabel: "تعليمات الوصول",
    instructionsPlaceholder:
      "مثال: ادخل من البوابة الرئيسية، ثم اتجه يمينًا...",
    saving: "جاري الحفظ...",
    save: "حفظ التعديلات",
    view: "عرض العنوان",
    copied: "تم نسخ الرابط",
    copy: "نسخ رابط العنوان",
  },
  en: {
    title: "Edit your address",
    addressLabel: "Your address",
    unnamed: "Not specified",
    loading: "Loading address...",
    missingName: "Address name is missing.",
    missingToken: "Edit token is missing.",
    invalidAccess: "This link is invalid or you do not have edit access.",
    cannotEdit: "This address cannot be edited.",
    cityRequired: "Enter the city or district.",
    mapRequired: "Enter the map link.",
    invalidMap: "No valid link was found. Paste a Google Maps link.",
    instructionsRequired: "Enter arrival instructions.",
    saveError: "An error occurred while saving changes.",
    saveSuccess: "Changes saved successfully.",
    cityLabel: "City or district",
    cityPlaceholder: "Example: Riyadh - Al Malqa",
    mapLabel: "Map link",
    mapPlaceholder: "Paste the Google Maps link here",
    photosLabel: "Access photos",
    photosHelper: "Replace existing photos or add missing photos, up to 3 photos.",
    landscapePhotoNote:
      "Landscape access photos are preferred for the best result.",
    viewPhotoExample: "View example",
    photoAlt: "Access photo",
    replacePhoto: "Replace photo",
    addPhoto: "Add photo",
    close: "Close",
    imageReadError: "Failed to read the image.",
    imageCompressError: "Failed to compress the image.",
    imageConvertError: "Failed to convert the image.",
    invalidImage: "The selected file is not a valid image.",
    deletePhoto: "Delete",
    uploadError: "Could not upload image",
    unknownUploadError: "Could not upload image: unknown error.",
    instructionsLabel: "Arrival instructions",
    instructionsPlaceholder:
      "Example: Enter from the main gate, then turn right...",
    saving: "Saving...",
    save: "Save changes",
    view: "View address",
    copied: "Link copied",
    copy: "Copy address link",
  },
};

function ManageContent() {
  const { language, setLanguage } = useLanguage();
  const text = copy[language];
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const tokenFromUrl = searchParams.get("token") || "";

  const [ownerToken, setOwnerToken] = useState("");
  const [city, setCity] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [photoUrls, setPhotoUrls] = useState(["", "", ""]);
  const [photoFiles, setPhotoFiles] = useState<(File | null)[]>([
    null,
    null,
    null,
  ]);
  const [photoPreviews, setPhotoPreviews] = useState(["", "", ""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const blobPreviewUrls = useRef<string[]>([]);

  const addressUrl = createPublicAddressUrl(name);
  const displayAddressUrl = createDisplayUrl(addressUrl);

  const extractUrl = (value: string) => {
    return value.match(/https?:\/\/\S+/)?.[0]?.trim() || "";
  };

  const extractStoragePath = (value: string) => {
    const marker = "/storage/v1/object/public/address-photos/";
    const markerIndex = value.indexOf(marker);

    if (markerIndex === -1) return "";

    return decodeURIComponent(value.slice(markerIndex + marker.length));
  };

  const createPhotoStoragePath = () => {
    return `photos/${crypto.randomUUID()}.jpg`;
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

  const setPhotoSlot = (index: number, photo: File) => {
    const previewUrl = URL.createObjectURL(photo);

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

    blobPreviewUrls.current = [...blobPreviewUrls.current, previewUrl];

    setPhotoFiles((current) => {
      const next = [...current];
      next[index] = photo;
      return next;
    });

    setMessage("");
  };

  const handlePhotoChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedPhoto = event.target.files?.[0];
    event.target.value = "";

    if (!selectedPhoto) return;

    setPhotoSlot(index, selectedPhoto);
  };

  const deletePhoto = (index: number) => {
    setPhotoUrls((current) => {
      const next = [...current];
      next[index] = "";
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
      next[index] = "";
      return next;
    });

    setPhotoFiles((current) => {
      const next = [...current];
      next[index] = null;
      return next;
    });

    setMessage("");
  };

  const uploadPhoto = async (photo: File) => {
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

    return {
      publicUrl: data.publicUrl,
      storagePath: filePath,
    };
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setMessage("");
      setIsSuccessMessage(false);
      setCanEdit(false);

      if (!name) {
        setMessage(text.missingName);
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(`onwan_owner_${name}`) || "";
      const resolvedToken = tokenFromUrl || storedToken;

      if (!resolvedToken) {
        setMessage(text.missingToken);
        setLoading(false);
        return;
      }

      setOwnerToken(resolvedToken);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, city, map_url, instructions_ar, photo1, photo2, photo3")
        .eq("username", name)
        .eq("owner_token", resolvedToken)
        .maybeSingle<ManageProfile>();

      if (error || !data) {
        console.log(error);
        setMessage(text.invalidAccess);
        setLoading(false);
        return;
      }

      localStorage.setItem(`onwan_owner_${name}`, resolvedToken);
      setCity(data.city || "");
      setMapUrl(data.map_url || "");
      setInstructions(data.instructions_ar || "");
      setPhotoUrls([data.photo1 || "", data.photo2 || "", data.photo3 || ""]);
      setPhotoPreviews([
        data.photo1 || "",
        data.photo2 || "",
        data.photo3 || "",
      ]);
      setPhotoFiles([null, null, null]);
      setCanEdit(true);
      setLoading(false);
    };

    loadProfile();
  }, [name, tokenFromUrl, text.invalidAccess, text.missingName, text.missingToken]);

  useEffect(() => {
    return () => {
      blobPreviewUrls.current.forEach((preview) => URL.revokeObjectURL(preview));
      blobPreviewUrls.current = [];
    };
  }, []);

  useEffect(() => {
    if (!lightboxPhoto) return;

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxPhoto(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [lightboxPhoto]);

  const saveChanges = async () => {
    const cleanedMapUrl = extractUrl(mapUrl);

    setMessage("");
    setIsSuccessMessage(false);

    if (!canEdit || !ownerToken) {
      setMessage(text.cannotEdit);
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

    if (!instructions.trim()) {
      setMessage(text.instructionsRequired);
      return;
    }

    setSaving(true);

    try {
      const nextPhotoUrls = [...photoUrls];
      const nextPhotoStoragePaths = nextPhotoUrls.map(extractStoragePath);

      for (const [index, photoFile] of photoFiles.entries()) {
        if (photoFile) {
          const uploadedPhoto = await uploadPhoto(photoFile);
          nextPhotoUrls[index] = uploadedPhoto.publicUrl;
          nextPhotoStoragePaths[index] = uploadedPhoto.storagePath;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          city: city.trim(),
          map_url: cleanedMapUrl,
          instructions_ar: instructions.trim(),
          instructions_en: instructions.trim(),
          instructions_ur: instructions.trim(),
          instructions_bn: instructions.trim(),
          photo1: nextPhotoUrls[0] || null,
          photo2: nextPhotoUrls[1] || null,
          photo3: nextPhotoUrls[2] || null,
        })
        .eq("username", name)
        .eq("owner_token", ownerToken);

      if (error) {
        console.log(error);
        setMessage(text.saveError);
        return;
      }

      const { error: photosError } = await supabase.rpc(
        "replace_profile_address_photos",
        {
          p_username: name,
          p_owner_token: ownerToken,
          p_storage_paths: nextPhotoStoragePaths.filter(Boolean),
        }
      );

      if (photosError) {
        console.log(photosError);
      }

      setMapUrl(cleanedMapUrl);
      setPhotoUrls(nextPhotoUrls);
      blobPreviewUrls.current.forEach((preview) => URL.revokeObjectURL(preview));
      blobPreviewUrls.current = [];
      setPhotoPreviews(nextPhotoUrls);
      setPhotoFiles([null, null, null]);
      setIsSuccessMessage(true);
      setMessage(text.saveSuccess);
    } catch (error) {
      console.log(error);
      setMessage(
        error instanceof Error ? error.message : text.unknownUploadError
      );
    } finally {
      setSaving(false);
    }
  };

  const copyPublicLink = async () => {
    await navigator.clipboard.writeText(createAddressShareMessage(addressUrl));
    setCopied(true);
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
          <p dir="ltr" className="break-all text-lg font-bold text-black">
            {name ? displayAddressUrl : text.unnamed}
          </p>
        </div>

        {loading && (
          <p className="mb-4 rounded-xl bg-gray-100 p-3 text-center font-bold text-gray-700">
            {text.loading}
          </p>
        )}

        {!loading && message && (
          <p
            className={`mb-4 rounded-xl p-3 text-center font-bold ${
              isSuccessMessage
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        {canEdit && (
          <>
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

            <div className="mb-4 rounded-2xl bg-[#eef5f1] p-3 text-sm leading-6 text-[#1f2d2b]">
              <p className="mb-1 font-bold">{text.landscapePhotoNote}</p>
              <a
                href="/abdullah"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#006b4f] underline underline-offset-4"
              >
                {text.viewPhotoExample}
              </a>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {photoPreviews.map((preview, index) => {
                if (!preview) {
                  return (
                    <label
                      key={index}
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-2 text-center"
                    >
                      <span className="mb-1 text-2xl font-bold text-gray-300">
                        +
                      </span>
                      <span className="text-xs font-bold text-[#006b4f]">
                        {text.addPhoto}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handlePhotoChange(index, event)}
                        className="sr-only"
                      />
                    </label>
                  );
                }

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-dashed border-gray-300 p-2 text-center"
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxPhoto(preview)}
                      className="mb-2 block aspect-square w-full overflow-hidden rounded-lg bg-gray-100"
                    >
                      <img
                        src={preview}
                        alt={`${text.photoAlt} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <label className="mb-2 block cursor-pointer text-xs font-bold text-[#006b4f]">
                      {text.replacePhoto}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handlePhotoChange(index, event)}
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
                );
              })}
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

            <button
              onClick={saveChanges}
              disabled={saving}
              className="mb-3 w-full rounded-xl bg-[#006b4f] py-4 font-bold text-white disabled:opacity-60"
            >
              {saving ? text.saving : text.save}
            </button>

            <Link
              href={`/${name}`}
              className="mb-3 block w-full rounded-xl border border-black py-4 text-center font-bold text-black"
            >
              {text.view}
            </Link>

            <button
              onClick={copyPublicLink}
              className="w-full rounded-xl bg-black py-4 font-bold text-white"
            >
              {copied ? text.copied : text.copy}
            </button>
          </>
        )}
      </div>

      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            type="button"
            aria-label={text.close}
            onClick={() => setLightboxPhoto(null)}
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-bold text-black"
          >
            x
          </button>

          <div
            className="w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={lightboxPhoto}
              alt={text.photoAlt}
              className="max-h-[82vh] w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default function ManagePage() {
  return (
    <Suspense>
      <ManageContent />
    </Suspense>
  );
}
