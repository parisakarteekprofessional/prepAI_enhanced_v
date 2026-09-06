import { createBrowserRouter, Navigate } from "react-router"
import Login from "./features/auth/pages/Login"
import Register from "./features/auth/pages/Register"
import Protected from "./features/auth/components/Protected"
import Home from "./features/interview/pages/Home"
import Interview from "./features/interview/pages/Interview"
import LandingPage from "./features/landing/LandingPage"
import RouteErrorBoundary from "./features/common/ErrorBoundary"

// DSA feature pages
import DsaHome from "./features/dsa/pages/DsaHome"
import NormalSheet from "./features/dsa/pages/NormalSheet"
import TopicProblems from "./features/dsa/pages/TopicProblems"
import CompanySheet from "./features/dsa/pages/CompanySheet"
import CompanyProblems from "./features/dsa/pages/CompanyProblems"
import Problem from "./features/dsa/pages/Problem"

// AI Study Room pages
import StudyHome from "./features/study/pages/StudyHome"
import StudyRoom from "./features/study/pages/StudyRoom"

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/register",
        element: <Register />,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/",
        element: <LandingPage />,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/app",
        element: <Protected><Home /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>,
        errorElement: <RouteErrorBoundary />
    },

    // DSA Product Routes
    {
        path: "/dsa",
        element: <Protected><DsaHome /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/dsa/normal",
        element: <Protected><NormalSheet /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/dsa/normal/:topicId",
        element: <Protected><TopicProblems /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/dsa/company",
        element: <Protected><CompanySheet /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/dsa/company/:companyId",
        element: <Protected><CompanyProblems /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/dsa/problem/:problemId",
        element: <Protected><Problem /></Protected>,
        errorElement: <RouteErrorBoundary />
    },

    // AI Study Room Routes
    {
        path: "/study",
        element: <Protected><StudyHome /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/study-room",
        element: <Protected><StudyHome /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/study/:documentId",
        element: <Protected><StudyRoom /></Protected>,
        errorElement: <RouteErrorBoundary />
    },
    {
        path: "/study-room/:documentId",
        element: <Protected><StudyRoom /></Protected>,
        errorElement: <RouteErrorBoundary />
    },

    // Catch-all Wildcard Route
    {
        path: "*",
        element: <Navigate to="/study" replace />
    }
])
