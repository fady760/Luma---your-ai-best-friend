import AppLayout from "@/components/layout/AppLayout";
export const instant = false;

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
