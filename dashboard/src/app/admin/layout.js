import { cookies } from "next/headers";
import AdminSidebar from "./components/AdminSidebar";
import AdminTopBar from "./components/AdminTopBar";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session")?.value;

  if (!adminSession || adminSession !== process.env.ADMIN_KEY) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFA", fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <AdminSidebar />
      <div className="lg:pl-60">
        <AdminTopBar />
        <main className="px-6 py-6 max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
