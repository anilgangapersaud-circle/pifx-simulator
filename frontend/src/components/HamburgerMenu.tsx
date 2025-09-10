import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface HamburgerMenuProps {
  currentPath: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: '/', label: 'Complete Workflow', icon: '🔄', method: 'FLOW' },
    { path: '/get-trades', label: 'Get Trades', icon: '📋', method: 'GET' },
    { path: '/get-trade', label: 'Get Trade by ID', icon: '🔍', method: 'GET' },
    { path: '/maker-net-balances', label: 'Maker Net Balances', icon: '📊', method: 'GET' },
    { path: '/breach-trade', label: 'Breach Trade', icon: '⚠️', method: 'POST' }
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
      
      {/* Hamburger Button */}
      <button className="hamburger-button" onClick={toggleMenu}>
        <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* Menu Panel */}
      <nav className={`hamburger-menu ${isOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3>Navigation</h3>
          <button className="menu-close-button" onClick={closeMenu}>
            ×
          </button>
        </div>
        
        <div className="menu-content">
          <ul className="menu-items">
            {menuItems.map((item) => (
              <li key={item.path} className="menu-item">
                <Link
                  to={item.path}
                  className={`menu-link ${currentPath === item.path ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <div className="menu-text">
                    <span className="menu-label">{item.label}</span>
                    {item.method && (
                      <span className={`menu-method ${item.method.toLowerCase()}`}>
                        {item.method}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default HamburgerMenu;
