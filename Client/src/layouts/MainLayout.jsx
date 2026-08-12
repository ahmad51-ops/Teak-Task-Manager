import { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/footer/Footer";
import PageTransition from "../components/common/PageTransition";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-void bg-grid-pattern bg-grid">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 py-8 md:px-10">
          <PageTransition />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
