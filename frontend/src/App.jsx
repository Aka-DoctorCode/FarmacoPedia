import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from './context/counterContext.js';
import Navbar from './components/Navbar.jsx';
import SearchModal from './components/SearchModal.jsx';
import ContenidoFarmacos from './views/ContenidoFarmacos.jsx';
import ContenidoFamilia from './views/ContenidoFamilia.jsx';
import DetalleFarmaco from './views/DetalleFarmaco.jsx';
import Descargo from './views/Descargo.jsx';
import Footer from './components/Footer.jsx';

const App = () => {
    const { activeView, t } = useContext(counterContext);

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

            <main style={{ flex: 1, minHeight: 'calc(100vh - 200px)' }}>
                {activeView === 'drugs' && <ContenidoFarmacos />}
                {activeView === 'families' && <ContenidoFamilia />}
                {activeView === 'drugDetail' && <DetalleFarmaco />}
            </main>

            <Footer />
        </>
    );
};

export default App;
