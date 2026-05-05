import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/website/Footer";
import Header from "../components/website/Header";
import SEO from "../components/seo/SEO";
import { PATH_TO_SEO_PAGE } from "../seo/config";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function PublicLayout() {
  const location = useLocation();
  const seoPage = PATH_TO_SEO_PAGE[location.pathname] || "home";

  return (
    <div className="d-flex flex-column min-vh-100">
      <SEO page={seoPage} />
      <Header />
      <main id="main-content" className="flex-grow-1 public-site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
