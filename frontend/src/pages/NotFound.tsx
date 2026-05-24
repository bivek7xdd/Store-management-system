import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[#0A0A0A]">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2px] mb-6 bg-[#DA291C]/10">
          <AlertCircle className="h-10 w-10 text-[#DA291C]" />
        </div>

        {/* Error Code */}
        <h1 className="text-8xl font-bold mb-4 text-[#DA291C]">404</h1>

        {/* Message */}
        <h2 className="text-2xl font-semibold text-white mb-2">
          Page not found
        </h2>
        <p className="text-[#888888] mb-8">
          Sorry, we couldn't find the page you're looking for.
          The page might have been removed or the link might be broken.
        </p>

        {/* Action Button */}
        <Button
          asChild
          className="h-12 px-8 rounded-[2px] font-black text-[10px] uppercase tracking-widest bg-[#DA291C] hover:bg-[#B01E0A] text-white"
        >
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Path info */}
        <p className="mt-8 text-sm text-[#555555]">
          Attempted path: <code className="px-2 py-1 rounded-[2px] bg-[#1A1A1A] text-[#888888]">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
