import { useContext, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { counterContext } from './context/counterContext.js';
import Navbar from './components/Navbar.jsx';
import BottomNav from './components/BottomNav.jsx';
import SearchModal from './components/SearchModal.jsx';
import Descargo from './views/Descargo.jsx';
import Footer from './components/Footer.jsx';

const ContenidoFarmacos = lazy(() => import('./views/ContenidoFarmacos.jsx'));
const ContenidoFamilia = lazy(() => import('./views/ContenidoFamilia.jsx'));
const DetalleFarmaco = lazy(() => import('./views/DetalleFarmaco.jsx'));

const ViewFallback = () => (
    <div className="viewLoadingFallback" role="status" aria-live="polite">
        <div className="fallbackSpinner" />
        <span>Cargando contenido...</span>
    </div>
);

const App = () => {
    const { activeView, selectedDrugName, t } = useContext(counterContext);
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <>
            <Helmet>
                <title>{`${t.appName} | ${t.appTagline}`}</title>
                <meta name="description" content={t.allDrugsSubtitle} />
                <meta property="og:title" content={t.appName} />
                <meta property="og:type" content="website" />
            </Helmet>

            <Navbar />
            <SearchModal />
            <Descargo />

            <main className="mainContent">
                <Suspense fallback={<ViewFallback />}>
                    {activeView === 'drugs' && <ContenidoFarmacos />}
                    {activeView === 'families' && <ContenidoFamilia />}
                    {activeView === 'drugDetail' && <DetalleFarmaco key={selectedDrugName} />}
                </Suspense>
            </main>

            <Footer />
            <BottomNav />
        </>
    );
};

export default App;
