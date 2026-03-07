import { useContext } from 'react';
import { Helmet } from 'react-helmet-async';
import { counterContext } from './context/counterContext.js';
import Descargo from './views/Descargo';
import Frame from './views/Frame';
import Menu from './components/Menu';
import BotonPill from './components/BontonPill';

import ContenidoFarmacos from './views/ContenidoFarmacos';
import ContenidoFamilia from './views/ContenidoFamilia';
import SearchOn from './components/SearchOn';
import SearchOff from './components/SearchOff';
import Footer from './components/Footer';
const App = () => {
	const { descargoVisible, descargoOcultar } = useContext(counterContext);
	const cargar = true;

	return (
        <>
            <Helmet>
                <title>FarmacoPedia | Home</title>
                <meta name="description" content="Welcome to FarmacoPedia, your encyclopedia for pharmacology and drugs." />
                <meta property="og:title" content="FarmacoPedia" />
                <meta property="og:type" content="website" />
            </Helmet>
            <BotonPill />
            {descargoVisible && <Descargo ocultar={descargoOcultar} />}
            <Frame
                cargar={cargar}
                showMenu={() => <Menu cargar={cargar} />}
                showContenidoFarmacos={() => <ContenidoFarmacos cargar={cargar} />}
                showContenidoFamilia={() => <ContenidoFamilia cargar={cargar} />}
                showSearchOn={() => <SearchOn cargar={cargar} />}
                showSearchOff={() => <SearchOff cargar={cargar} />}
            ></Frame>
            <Footer />
        </>
    );
};

export default App;
