import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/main.css';
import App from './App.jsx';
import Post from './Routes/Route.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
	<BrowserRouter>
		<Routes>
			<Route path='/' element={<App />} />
			<Route path='/post' element={<Post />} />
		</Routes>
	</BrowserRouter>
);
