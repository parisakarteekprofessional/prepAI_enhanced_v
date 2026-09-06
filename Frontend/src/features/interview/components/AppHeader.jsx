import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import '../style/appChrome.scss'

const AppHeader = ({ eyebrow = 'Interview AI', title = 'PrepAI' }) => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const isDsaActive = location.pathname.startsWith('/dsa')
    const isPlannerActive = location.pathname.startsWith('/app') || location.pathname.startsWith('/interview')

    const onLogout = async () => {
        navigate('/', { replace: true })
        await handleLogout()
    }

    return (
        <header className='app-header'>
            <div className='app-header__left'>
                <Link className='app-header__brand' to='/app'>
                    <span className='app-header__mark'>
                        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d='M12 3L14.4 8.6L20.5 9.1L15.9 13.1L17.3 19L12 15.9L6.7 19L8.1 13.1L3.5 9.1L9.6 8.6L12 3Z' fill='currentColor' />
                        </svg>
                    </span>
                    <span className='app-header__wordmark'>PrepAI</span>
                </Link>

                {/* Primary Navigation Items */}
                <nav className='app-header__nav'>
                    <Link
                        className={`app-header__nav-item ${isPlannerActive ? 'is-active' : ''}`}
                        to='/app'
                    >
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
                            <line x1='16' y1='2' x2='16' y2='6' />
                            <line x1='8' y1='2' x2='8' y2='6' />
                            <line x1='3' y1='10' x2='21' y2='10' />
                        </svg>
                        <span>Interview Planner</span>
                    </Link>

                    <Link
                        className={`app-header__nav-item ${isDsaActive ? 'is-active' : ''}`}
                        to='/dsa'
                    >
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <polyline points='16 18 22 12 16 6' />
                            <polyline points='8 6 2 12 8 18' />
                        </svg>
                        <span>DSA Practice</span>
                    </Link>
                </nav>
            </div>

            <div className='app-header__actions'>
                {user && <span className='app-header__user'>{user.username}</span>}
                <Link className='app-header__link' to='/app'>Home</Link>
                <button className='app-header__logout' onClick={onLogout}>
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <path d='M10 17L15 12L10 7' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
                        <path d='M15 12H3' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                        <path d='M12 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                    </svg>
                    Logout
                </button>
            </div>
        </header>
    )
}

export default AppHeader
