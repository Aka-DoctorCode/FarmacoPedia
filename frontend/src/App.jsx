import { useContext, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from './context/counterContext.js';
import Navbar from './components/Navbar.jsx';
import BottomNav from './components/BottomNav.jsx';
import SearchModal from './components/SearchModal.jsx';
import ContenidoFarmacos from './views/ContenidoFarmacos.jsx';
import ContenidoFamilia from './views/ContenidoFamilia.jsx';
import DetalleFarmaco from './views/DetalleFarmaco.jsx';
import Descargo from './views/Descargo.jsx';
import Footer from './components/Footer.jsx';

const App = () => {
    const { activeView, selectedDrugName, t } = useContext(counterContext);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeView, selectedDrugName]);

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
                {activeView === 'drugs' && <ContenidoFarmacos />}
                {activeView === 'families' && <ContenidoFamilia />}
                {activeView === 'drugDetail' && <DetalleFarmaco key={selectedDrugName} />}
            </main>

            <Footer />
            <BottomNav />
        </>
    );
};

export default App;
