import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const colors = {
  primary: "#0d9488",
  primaryDark: "#115e59",
};

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "linear-gradient(180deg, #fffcf5 0%, #fef9f0 50%, #fdf6e8 100%)" }}
    >
      <div className="text-center max-w-md">
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{ background: `${colors.primary}15` }}
        >
          <AlertCircle className="h-10 w-10" style={{ color: colors.primary }} />
        </div>

        {/* Error Code */}
        <h1
          className="text-8xl font-bold mb-4"
          style={{ color: colors.primaryDark }}
        >
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Page not found
        </h2>
        <p className="text-gray-500 mb-8">
          Sorry, we couldn't find the page you're looking for.
          The page might have been removed or the link might be broken.
        </p>

        {/* Action Button */}
        <Button
          asChild
          className="h-12 px-8 rounded-xl font-semibold text-base"
          style={{ background: colors.primaryDark }}
        >
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Path info */}
        <p className="mt-8 text-sm text-gray-400">
          Attempted path: <code className="px-2 py-1 rounded bg-gray-100 text-gray-600">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
