import { useEffect } from 'react';

const Wireframe = () => {
  useEffect(() => {
    // Redirect to the wireframe HTML file
    window.location.href = '/wireframe.html';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading wireframe...</p>
      </div>
    </div>
  );
};

export default Wireframe;
