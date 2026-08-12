import { Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import LoadingFallback from "./LoadingFallback";

const PageTransition = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {/* Suspense lives HERE, not around the whole route tree in
            AppRoutes.jsx — that would suspend MainLayout itself,
            flashing away the sidebar/navbar on every navigation while
            a lazy page's chunk downloads. Scoped here, only this
            content area shows a loading state; the layout chrome
            stays mounted throughout. */}
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
