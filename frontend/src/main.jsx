import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/main.css';
import App from './App.jsx';
import Post from './components/Post';
import ContenidoFarmacos from './views/ContenidoFarmacos';
import ContenidoFamilia from './views/ContenidoFamilia';

ReactDOM.createRoot(document.getElementById('root')).render(
	<BrowserRouter>
		<Routes>
			<Route path='/' element={<App />}>
				<Route index element={<div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '100px', fontSize: '1.2rem' }}>Bienvenido a FarmacoPedia. Selecciona una opción del menú.</div>} />
				<Route path='farmacos' element={<ContenidoFarmacos />} />
				<Route path='familias' element={<ContenidoFamilia />} />
				<Route path='post' element={<Post />} />
			</Route>
		</Routes>
	</BrowserRouter>
);
