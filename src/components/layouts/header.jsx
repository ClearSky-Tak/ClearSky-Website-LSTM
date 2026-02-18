import React, { useState } from "react";
import { NavLink } from "react-router-dom"; // Import NavLink dari React Router
import { FaBars } from "react-icons/fa";
import { FaAnglesUp } from "react-icons/fa6";

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleOutsideClick = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="shadow-md no-print">
            <div className="container mx-auto flex justify-between items-center py-4 px-6 w-[90%]">
                {/* Logo */}
                <div id="header-icon">
                    <NavLink className="flex items-center gap-1" to="/">
                        <img
                            src="/assets/logoUnipa.webp"
                            alt="Logo Wondama"
                            className="w-10 h-10 object-contain"
                        />
                        <div id="icon-class" className="text-2xl font-bold lg:text-large">
                            <span id="icon-name">ClearSky - CNN TCN-BiLSTM</span>
                        </div>
                    </NavLink>
                </div>

                {/* Hamburger Menu for Tablet and Mobile */}
                <button
                    className="lg:hidden text-black text-2xl"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <FaAnglesUp /> : <FaBars />}
                </button>

                {/* Navigation for Desktop */}
                <nav className="hidden lg:flex gap-8">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `px-4 py-2 rounded transition duration-300 ${isActive ? "bg-black text-white" : "hover:bg-black hover:text-white"
                            }`
                        }
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/camera"
                        className={({ isActive }) =>
                            `px-4 py-2 rounded transition duration-300 ${isActive ? "bg-black text-white" : "hover:bg-black hover:text-white"
                            }`
                        }
                    >
                        Camera
                    </NavLink>
                </nav>
            </div>

            {/* Overlay for Tablet */}
            {isMenuOpen && (
                <div
                    className="hidden md:block fixed inset-0 bg-black opacity-70 z-40 lg:hidden"
                    onClick={handleOutsideClick}
                ></div>
            )}

            {/* Slide-in Menu for Tablet */}
            <div
                className={`hidden md:block lg:hidden fixed top-0 right-0 h-full w-1/2 bg-white z-50 transform ${isMenuOpen ? "translate-x-0" : "translate-x-full"
                    } transition-transform duration-300`}
            >
                <ul className="grid grid-cols-1 py-6">
                    <li>
                        <NavLink
                            to="/"
                            className="block hover:bg-black hover:text-white px-8 py-6 rounded transition duration-300 text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/camera"
                            className="block hover:bg-black hover:text-white px-8 py-6 rounded transition duration-300 text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Camera
                        </NavLink>
                    </li>
                </ul>
            </div>

            {/* Dropdown Menu for Mobile */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? " max-h-full" : "max-h-0"
                    }`}
            >
                <ul className="grid grid-cols-1 gap-4 items-center bg-white pt-4 shadow-md">
                    <li>
                        <NavLink
                            to="/"
                            className="block hover:bg-black hover:text-white px-8 py-6 rounded transition duration-300 text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/camera"
                            className="block hover:bg-black hover:text-white px-8 py-6 rounded transition duration-300 text-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Camera
                        </NavLink>
                    </li>
                </ul>
            </div>
        </header>
    );
}
