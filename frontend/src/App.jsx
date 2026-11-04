import { useContext, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { counterContext } from './context/counterContext.js';
import Navbar from './components/Navbar.jsx';
import BottomNav from './components/BottomNav.jsx';
import SearchModal from './components/SearchModal.jsx';
import Descargo from './views/Descargo.jsx';
import Footer from './components/Footer.jsx';
import AdBanner from './components/AdBanner.jsx';
import PwaInstallPrompt from './components/PwaInstallPrompt.jsx';
import AuthModal from './components/AuthModal.jsx';
import ProfileDrawer from './components/ProfileDrawer.jsx';

const ContenidoFarmacos = lazy(() => import('./views/ContenidoFarmacos.jsx'));
const ContenidoFamilia = lazy(() => import('./views/ContenidoFamilia.jsx'));
const DetalleFarmaco = lazy(() => import('./views/DetalleFarmaco.jsx'));
const AboutUs = lazy(() => import('./views/AboutUs.jsx'));
const PrivacyPolicy = lazy(() => import('./views/PrivacyPolicy.jsx'));
const TermsOfUse = lazy(() => import('./views/TermsOfUse.jsx'));
const AdminEditor = lazy(() => import('./views/AdminEditor.jsx'));

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

            <PwaInstallPrompt />
            <Navbar />
            {activeView !== 'adminEditor' && <AdBanner />}
            <SearchModal />
            <AuthModal />
            <ProfileDrawer />
            <Descargo />

            <main className={activeView === 'adminEditor' ? 'mainContentAdmin' : 'mainContent'}>
                <Suspense fallback={<ViewFallback />}>
                    {activeView === 'drugs' && <ContenidoFarmacos />}
                    {activeView === 'families' && <ContenidoFamilia />}
                    {activeView === 'drugDetail' && <DetalleFarmaco key={selectedDrugName} />}
                    {activeView === 'about' && <AboutUs />}
                    {activeView === 'privacy' && <PrivacyPolicy />}
                    {activeView === 'terms' && <TermsOfUse />}
                    {activeView === 'adminEditor' && <AdminEditor />}
                </Suspense>
            </main>

            {activeView !== 'adminEditor' && <Footer />}
            {activeView !== 'adminEditor' && <BottomNav />}
        </>
    );
};

export default App;
