
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-red-500">404</h1>
        <p className="text-xl text-gray-700 mb-4">Page Not Found</p>
        <p className="text-gray-600 mb-6">
          The page <span className="font-mono bg-gray-100 p-1 rounded">{location.pathname}</span> does not exist.
        </p>
        <div className="space-y-2">
          <Link to="/dashboard">
            <Button variant="default" className="w-full">Go to Dashboard</Button>
          </Link>
          <Link to="/record-indent">
            <Button variant="outline" className="w-full">Go to Record Indent</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
