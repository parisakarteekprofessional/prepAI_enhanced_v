import React from "react"
import { NavLink } from "react-router"

export default function DsaNav() {
    return (
        <nav className="dsa-nav" aria-label="DSA Navigation">
            <div className="dsa-nav__container">
                <div className="dsa-nav__links">
                    <NavLink
                        to="/dsa"
                        end
                        className={({ isActive }) => `dsa-nav__link ${isActive ? "is-active" : ""}`}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/dsa/normal"
                        className={({ isActive }) => `dsa-nav__link ${isActive ? "is-active" : ""}`}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <span>Normal DSA Sheet</span>
                        <span className="dsa-nav__pill">375 Qs</span>
                    </NavLink>

                    <NavLink
                        to="/dsa/company"
                        className={({ isActive }) => `dsa-nav__link ${isActive ? "is-active" : ""}`}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        <span>Company-Wise</span>
                        <span className="dsa-nav__pill">464 Cos</span>
                    </NavLink>
                </div>
            </div>
        </nav>
    )
}
