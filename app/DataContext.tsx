// DataContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const DataContext = createContext<any>(null);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [savedData, setSavedData] = useState([]);

    const fetchSavedData = async () => {
        try {
            const response = await axios.get('http://192.168.233.128:3000/get-extracted-data');
            const data = response.data;
            setSavedData(data);
        } catch (error) {
            console.error('Error fetching saved data:', error);
        }
    };

    useEffect(() => {
        fetchSavedData();
    }, []);

    return (
        <DataContext.Provider value={{ savedData }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
