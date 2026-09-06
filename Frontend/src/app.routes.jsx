import { createBrowserRouter } from "react-router"
import Login from "./features/auth/pages/Login"
import Register from "./features/auth/pages/Register"
import Protected from "./features/auth/components/Protected"
import Home from "./features/interview/pages/Home"
import Interview from "./features/interview/pages/Interview"
import LandingPage from "./features/landing/LandingPage"

// DSA feature pages
import DsaHome from "./features/dsa/pages/DsaHome"
import NormalSheet from "./features/dsa/pages/NormalSheet"
import TopicProblems from "./features/dsa/pages/TopicProblems"
import CompanySheet from "./features/dsa/pages/CompanySheet"
import CompanyProblems from "./features/dsa/pages/CompanyProblems"
import Problem from "./features/dsa/pages/Problem"

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <LandingPage />
    },
    {
        path: "/app",
        element: <Protected><Home /></Protected>
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },

    // DSA Product Routes
    {
        path: "/dsa",
        element: <Protected><DsaHome /></Protected>
    },
    {
        path: "/dsa/normal",
        element: <Protected><NormalSheet /></Protected>
    },
    {
        path: "/dsa/normal/:topicId",
        element: <Protected><TopicProblems /></Protected>
    },
    {
        path: "/dsa/company",
        element: <Protected><CompanySheet /></Protected>
    },
    {
        path: "/dsa/company/:companyId",
        element: <Protected><CompanyProblems /></Protected>
    },
    {
        path: "/dsa/problem/:problemId",
        element: <Protected><Problem /></Protected>
    }
])
