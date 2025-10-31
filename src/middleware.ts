import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // This function will only be called if the user is authenticated
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth page for unauthenticated users
        if (req.nextUrl.pathname === '/auth') {
          return true;
        }
        
        // Require authentication for protected routes
        if (req.nextUrl.pathname.startsWith('/profile') || 
            req.nextUrl.pathname.startsWith('/messages') ||
            req.nextUrl.pathname.startsWith('/deliveries')) {
          return !!token;
        }
        
        // Allow access to all other pages
        return true;
      },
    },
  }
)

export const config = {
  matcher: ['/profile/:path*', '/messages/:path*', '/deliveries/:path*', '/auth']
}