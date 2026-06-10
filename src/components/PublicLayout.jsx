import React, { useState } from "react";
import AppNavbar from "./Navbar";
import Footer from "./Footer";
import LoginModal from "./LoginModal";

const PublicLayout = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleCloseLogin = () => setShowLoginModal(false);
  const handleShowLogin = () => setShowLoginModal(true);

  return (
    <>
      <AppNavbar handleShowLogin={handleShowLogin} />
      <main>{children}</main>
      <Footer />
      <LoginModal show={showLoginModal} handleClose={handleCloseLogin} />
    </>
  );
};

export default PublicLayout;
