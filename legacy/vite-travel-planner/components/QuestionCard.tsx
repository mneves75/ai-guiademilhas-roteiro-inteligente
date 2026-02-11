
import React from 'react';

interface QuestionCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ title, description, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200/80">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <hr className="border-gray-200 -mx-6 sm:-mx-8"/>
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
};

export default QuestionCard;
