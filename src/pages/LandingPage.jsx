import { useState } from "react";
import AppNavbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeaturesSection from "../components/FeaturesSection";
import StatsSection from "../components/StatsSection";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleCloseLogin = () => setShowLoginModal(false);
  const handleShowLogin = () => setShowLoginModal(true);

  return (
    <>
      <AppNavbar handleShowLogin={handleShowLogin} />
      <main>
        <Hero handleShowLogin={handleShowLogin} />
        <FeaturesSection />

        <StatsSection />
      </main>
      <Footer />

      <LoginModal show={showLoginModal} handleClose={handleCloseLogin} />
    </>
  );
}
