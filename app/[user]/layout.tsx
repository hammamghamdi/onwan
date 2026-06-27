import type { Metadata } from "next";
import { createDisplayUrl, createPublicAddressUrl } from "@/lib/appUrl";
import { normalizeUsername } from "@/lib/username";

type PublicAddressMetadataProps = Readonly<{
  params: Promise<{
    user: string;
  }>;
}>;

type PublicAddressLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{
    user: string;
  }>;
}>;

export async function generateMetadata({
  params,
}: PublicAddressMetadataProps): Promise<Metadata> {
  const { user } = await params;
  const username = normalizeUsername(user);
  const publicUrl = createPublicAddressUrl(username);
  const displayUrl = createDisplayUrl(publicUrl);
  const description = `Arrival instructions for ${username} on Onwan. ${displayUrl}`;

  return {
    title: `${username} address`,
    description,
    alternates: {
      canonical: publicUrl,
    },
    openGraph: {
      title: `${username} | Onwan`,
      description,
      url: publicUrl,
      siteName: "Onwan",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${username} | Onwan`,
      description,
    },
  };
}

export default function PublicAddressLayout({
  children,
}: PublicAddressLayoutProps) {
  return children;
}
