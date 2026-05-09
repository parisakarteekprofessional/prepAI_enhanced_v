import React from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import '../style/appChrome.scss'

const AppHeader = ({ eyebrow = 'Interview AI', title = 'PrepAI' }) => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        navigate('/', { replace: true })
        await handleLogout()
    }

    return (
        <header className='app-header'>
            <Link className='app-header__brand' to='/app'>
                <span className='app-header__mark'>
                    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <path d='M12 3L14.4 8.6L20.5 9.1L15.9 13.1L17.3 19L12 15.9L6.7 19L8.1 13.1L3.5 9.1L9.6 8.6L12 3Z' fill='currentColor' />
                    </svg>
                </span>
                <span className='app-header__wordmark'>PrepAI</span>
            </Link>

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
