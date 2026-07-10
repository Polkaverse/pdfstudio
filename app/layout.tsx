import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Studio - Free PDF Tools, Hindi OCR, eSign & Document Templates",
  description: "Free online PDF utilities for everyone. Perform PDF merge, split, rotate, and compression. Run high-accuracy English & Hindi OCR scanner. Legally sign documents and build GST Invoices or Rent Agreements instantly.",
  keywords: [
    "PDF Studio", 
    "PDFStudio", 
    "free PDF tools", 
    "Hindi OCR", 
    "Devanagari OCR online", 
    "eSign PDF", 
    "IT Act 2000 signature", 
    "GST Invoice PDF generator", 
    "Rent Agreement maker",
    "Tamil OCR scanner", 
    "Telugu OCR online", 
    "free PDF compress online", 
    "WhatsApp PDF share"
  ],
  authors: [{ name: "Pankaj Chaudhary" }],
  openGraph: {
    title: "PDF Studio - Free PDF Tools, Hindi OCR, eSign & Document Templates",
    description: "Secure, local, and legally-binding PDF utilities tailored for MSMEs, students, and professionals.",
    url: "https://pdf-studio-pankajchaudhary.vercel.app",
    siteName: "PDF Studio",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Studio - Secure PDF Utility Suite",
    description: "Run English/Hindi OCR, merge/split PDFs, sign documents legally, and generate GST invoices on the fly.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Schema.org Structured Data for Google/Bing SEO ranking */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "PDF Studio",
              "operatingSystem": "All",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "INR"
              },
              "description": "Free online PDF utilities, English & Hindi Devanagari OCR, eSign, and GST invoice/rent agreement generation.",
              "publisher": {
                "@type": "Organization",
                "name": "PDF Studio"
              }
            })
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
