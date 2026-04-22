import { Outlet } from "react-router-dom";
import Header from "../components/website/Header";
import Footer from "../components/website/Footer";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 public-site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
