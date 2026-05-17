import React, { createContext, useContext, useState, useEffect } from 'react';

interface FontScaleContextType {
  arabicScale: number;
  increaseScale: () => void;
  decreaseScale: () => void;
}

const FontScaleContext = createContext<FontScaleContextType>({
  arabicScale: 1,
  increaseScale: () => {},
  decreaseScale: () => {},
});

export const FontScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [arabicScale, setArabicScale] = useState(() => {
    const saved = localStorage.getItem('arabicScale');
    return saved ? parseFloat(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem('arabicScale', arabicScale.toString());
  }, [arabicScale]);

  const increaseScale = () => setArabicScale((s) => Math.min(2.0, s + 0.15));
  const decreaseScale = () => setArabicScale((s) => Math.max(0.7, s - 0.15));

  return (
    <FontScaleContext.Provider value={{ arabicScale, increaseScale, decreaseScale }}>
      {children}
    </FontScaleContext.Provider>
  );
};

export const useFontScale = () => useContext(FontScaleContext);
