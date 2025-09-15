import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, FC, useContext, useEffect, useMemo, useState } from "react";

export type ContextDataType = {
  showFooter?: boolean;
  setShowFooter?: (val: boolean) => void;
};

const GlobalContext = createContext<ContextDataType | null>({});

const GlobalProvider: FC<ContextDataType | any> = (props: any) => {
  const [showFooter, setShowFooter] = useState(true);

  const resetState = () => {
    setShowFooter(true);
  };
  
  useEffect(() => {
    AsyncStorage.setItem('contextdata', JSON.stringify({showFooter}))
  }, [showFooter]);

  let contextObj: any = useMemo(() => {
    return {
        showFooter,
        setShowFooter
    };
  }, [
    showFooter
  ]);

  return (
    <GlobalContext.Provider value={contextObj}>
      {props.children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useFooter must be used inside FooterProvider");
  return ctx;
};

export { GlobalContext, GlobalProvider };
