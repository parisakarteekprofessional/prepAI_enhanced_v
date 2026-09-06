import React from "react"
import { useRouteError, isRouteErrorResponse, Link } from "react-router"

export const RouteErrorBoundary = () => {
    const error = useRouteError()

    let title = "Unexpected Application Error"
    let message = "Something went wrong while loading this page."
    let status = 500

    if (isRouteErrorResponse(error)) {
        status = error.status
        if (error.status === 404) {
            title = "Page Not Found"
            message = "The page you are looking for does not exist or has been moved."
        } else {
            message = error.statusText || error.data || message
        }
    } else if (error instanceof Error) {
        message = error.message
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "linear-gradient(180deg, #0d121c 0%, #0f1420 50%, #080b11 100%)",
                color: "#f5f7fb",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                textAlign: "center",
                fontFamily: "system-ui, -apple-system, sans-serif"
            }}
        >
            <div
                style={{
                    background: "rgba(20, 26, 38, 0.95)",
                    border: "1px solid #283449",
                    borderRadius: "1rem",
                    padding: "2.5rem",
                    maxWidth: "500px",
                    width: "100%",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1.25rem"
                }}
            >
                <div
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "rgba(255, 45, 120, 0.12)",
                        border: "1px solid rgba(255, 45, 120, 0.3)",
                        display: "grid",
                        placeItems: "center",
                        color: "#ff2d78",
                        fontSize: "1.75rem",
                        fontWeight: "900"
                    }}
                >
                    {status === 404 ? "404" : "!"}
                </div>

                <h1 style={{ fontSize: "1.6rem", fontWeight: "900", margin: 0, color: "#f5f7fb" }}>
                    {title}
                </h1>

                <p style={{ fontSize: "0.92rem", color: "#98a4b8", lineHeight: "1.5", margin: 0 }}>
                    {message}
                </p>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.5rem" }}>
                    <Link
                        to="/study"
                        style={{
                            padding: "0.65rem 1.25rem",
                            borderRadius: "0.55rem",
                            background: "linear-gradient(135deg, #ff2d78, #d81b60)",
                            color: "#fff",
                            fontSize: "0.88rem",
                            fontWeight: "700",
                            textDecoration: "none"
                        }}
                    >
                        AI Study Room
                    </Link>

                    <Link
                        to="/app"
                        style={{
                            padding: "0.65rem 1.25rem",
                            borderRadius: "0.55rem",
                            background: "rgba(84, 198, 255, 0.12)",
                            border: "1px solid rgba(84, 198, 255, 0.35)",
                            color: "#54c6ff",
                            fontSize: "0.88rem",
                            fontWeight: "700",
                            textDecoration: "none"
                        }}
                    >
                        Interview Planner
                    </Link>
                </div>
            </div>
        </main>
    )
}

export default RouteErrorBoundary
