import { Scissors } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="animate-spin mb-4">
        <Scissors size={32} className="text-primary-600" />
      </div>
      <h2 className="font-script text-3xl text-primary-700 mb-2">Sentirse bien</h2>
      <p className="text-secondary-500">Cargando tus datos...</p>
    </div>
  );
};

export default LoadingScreen;