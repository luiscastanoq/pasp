import { useState, useEffect, useRef } from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  nombre?: string;
  apellidos?: string;
  rolLabel?: string;
  onLogout: () => void;
  onHome?: () => void;
}

export const Header = ({
  nombre,
  apellidos,
  rolLabel = "Usuario",
  onLogout,
  onHome,
}: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getInitials = () => {
    if (!nombre || !apellidos) return "US";
    return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  const getFullName = () => {
    if (!nombre || !apellidos) return "Usuario";
    return `${nombre} ${apellidos}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  const handleHome = () => {
    setMenuOpen(false);
    if (onHome) {
      onHome();
    } else {
      window.location.reload();
    }
  };

  return (
    <header className={styles.banner}>
      <div className={styles.bannerContent}>
        <div className={styles.logoContainer}>
          <img
            src={`${import.meta.env.BASE_URL}pasp-logo.svg`}
            alt="PASP"
            className={styles.logo}
          />
        </div>
        <div className={styles.userSection}>
          <button className={styles.homeButton} onClick={handleHome} aria-label="Volver al dashboard" title="Volver al dashboard">
            <svg className={styles.homeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <div className={styles.avatar}>{getInitials()}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{getFullName()}</div>
            <div className={styles.userRole}>{rolLabel}</div>
          </div>
          <div className={styles.menuContainer} ref={menuRef}>
            <button className={`${styles.menuButton} ${menuOpen ? styles.menuButtonActive : ""}`} onClick={toggleMenu} aria-label="Menú de usuario" aria-expanded={menuOpen}>
              <svg className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <svg className={styles.dropdownIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
