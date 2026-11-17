import "./globals.css";
export const metadata = { title: "PMS – Performance Management" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
