import React from 'react';
import { useNavigate } from 'react-router-dom';
import startPageBg from '../../../assets/StartPage.jpg';

const StartPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="h-screen w-screen bg-cover bg-center flex items-center justify-center relative"
      style={{ backgroundImage: `url(${startPageBg})` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"></div>
      <div className="relative z-10 bg-white bg-opacity-10 backdrop-blur-lg px-12 py-8 rounded-2xl shadow-2xl text-white text-center w-[90%] max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">Welcome to</h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-cyan-300 drop-shadow">Project Management System</h2>
        <h3 className="text-lg md:text-xl font-medium mb-4 text-gray-200 drop-shadow">Uva Wellassa University</h3>
        <p className="text-sm md:text-base text-gray-300 mb-6">Please select your user category to proceed.</p>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button
            onClick={() => navigate('/login')}
            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2 rounded-full font-semibold text-white transition duration-300 shadow-md"
          >
            Undergraduate
          </button>
          <button
            onClick={() => navigate('/logincoordinator')}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-full font-semibold text-white transition duration-300 shadow-md"
          >
            Staff Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
