import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './styles/main.css';
import App from './App.jsx';
import StateContext from './context/StateContext';


ReactDOM.createRoot(document.getElementById('root')).render(
    <HelmetProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <StateContext>
                <Routes>
                    <Route path='/' element={<App />} />
                </Routes>
            </StateContext>
        </BrowserRouter>
    </HelmetProvider>
);