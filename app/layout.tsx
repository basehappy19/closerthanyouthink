import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ไกลแค่ไหนก็ท่วมถึง — แบบสำรวจออนไลน์",
  description: "แบบสำรวจเพื่อสร้างความตระหนักรู้เรื่องผลกระทบของน้ำแข็งขั้วโลกละลายต่อไทย โดยนักเรียน ม.6/1 โรงเรียนภูเขียว จังหวัดชัยภูมิ",
  keywords: ["โลกร้อน", "น้ำแข็งขั้วโลก", "กรุงเทพ", "น้ำท่วม", "ภูมิอากาศ"],
  authors: [
    { name: "ภาคภูมิ ทีดินดำ" },
    { name: "ณัฐจิราภา ยศรุ่งเรือง" },
    { name: "แทมมารีน ตาปราบ" },
    { name: "วรัญญา วิสิทธิ์สูงเนิน" },
  ],
  openGraph: {
    title: "ไกลแค่ไหนก็ท่วมถึง",
    description: "ร่วมทำแบบสำรวจและดูว่าความรู้เรื่องโลกร้อนของเธอเปลี่ยนไปแค่ไหนหลังดูคลิปและโปสเตอร์",
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${prompt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
