"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams.get("name") || "";

  const [city, setCity] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const extractUrl = (text: string) => {
    return text.match(/https?:\/\/\S+/)?.[0]?.trim() || "";
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        image.src = event.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error("فشل قراءة الصورة."));
      };

      image.onload = () => {
        const maxWidth = 900;
        const scale = Math.min(1, maxWidth / image.width);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("فشل ضغط الصورة."));
          return;
        }

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("فشل تحويل الصورة."));
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
        reject(new Error("الملف المختار ليس صورة صالحة."));
      };

      reader.readAsDataURL(file);
    });
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);

    if (selected.length > 3) {
      setMessage("الحد الأعلى 3 صور فقط.");
      return;
    }

    setPhotos(selected);
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
        throw error;
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
      setMessage("اسم العنوان غير موجود.");
      return;
    }

    if (!city.trim()) {
      setMessage("فضلاً أدخل المدينة أو الحي.");
      return;
    }

    if (!mapUrl.trim()) {
      setMessage("فضلاً أدخل رابط الخريطة.");
      return;
    }

    if (!cleanedMapUrl) {
      setMessage("لم يتم العثور على رابط خريطة صحيح. الصق رابط Google Maps فقط.");
      return;
    }

    if (photos.length === 0) {
      setMessage("يجب رفع صورة واحدة على الأقل.");
      return;
    }

    if (!instructions.trim()) {
      setMessage("فضلاً أدخل تعليمات الوصول.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const photoUrls = await uploadPhotos();

      const { error } = await supabase.from("profiles").insert({
        username: name,
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
          setMessage("هذا العنوان محجوز مسبقًا.");
          return;
        }

        console.log(error);
        setMessage("حدث خطأ أثناء الحفظ.");
        return;
      }

      router.push(`/success?name=${name}`);
    } catch (error) {
      console.log(error);
      setMessage("حدث خطأ أثناء رفع الصور.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8f5] px-4 py-6 text-black">
      <div className="mx-auto max-w-sm rounded-3xl bg-white p-5 shadow-sm">
        <h1 className="mb-3 text-center text-2xl font-bold text-black">
          إعداد بيانات العنوان
        </h1>

        <p className="mb-6 text-center text-sm leading-6 text-black">
          أضف بيانات الوصول والصور التي ستظهر لمن يفتح عنوانك.
        </p>

        <label className="mb-2 block font-bold text-black">اسم العنوان</label>
        <input
          value={name}
          readOnly
          className="mb-4 w-full rounded-xl border bg-gray-100 p-4 text-black"
        />

        <label className="mb-2 block font-bold text-black">المدينة أو الحي</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mb-4 w-full rounded-xl border p-4 text-black"
          placeholder="مثال: جدة - حي الصفا"
        />

        <label className="mb-2 block font-bold text-black">رابط الخريطة</label>
        <input
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          className="mb-2 w-full rounded-xl border p-4 text-black"
          placeholder="مثال: دبوس مثبّت https://goo.gl/maps/..."
        />

        <p className="mb-4 text-sm leading-6 text-black">
          يمكنك لصق النص كاملًا من خرائط Google، وسيتم استخراج الرابط تلقائيًا.
        </p>

        <label className="mb-2 block font-bold text-black">
          صور الوصول / المدخل
        </label>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotos}
          className="mb-2 w-full rounded-xl border p-4 text-black"
        />

        <p className="mb-4 text-sm text-black">
          يجب رفع صورة واحدة على الأقل، والحد الأعلى 3 صور. سيتم ضغط الصور تلقائيًا قبل الرفع.
        </p>

        {photos.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden rounded-xl bg-gray-100"
              >
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`صورة ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <label className="mb-2 block font-bold text-black">تعليمات الوصول</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="mb-5 w-full rounded-xl border p-4 text-black"
          rows={4}
          placeholder="مثال: ادخل من البوابة الرئيسية، المصعد في نهاية الممر..."
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
          {saving ? "جاري الضغط والحفظ..." : "حفظ بيانات العنوان"}
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