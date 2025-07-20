import { useState } from 'react';
import axios from 'axios';

import Styles from './Post.module.css';

const Post = () => {
	const [nombre, setNombre] = useState('');
	const [familia, setFamilia] = useState('');
	const [mecanismoDeAccion, setMecanismoDeAccion] = useState('');
	const [indicaciones, setIndicaciones] = useState('');
	const [presentaciones, setPresentaciones] = useState('');
	const [nombresComercial, setNombresComercial] = useState('');
	const [posologia, setPosologia] = useState('');
	const [riesgo, setRiesgo] = useState('');
	const [contraindicaciones, setContraindicaciones] = useState('');
	const [interacciones, setInteracciones] = useState('');
	const [reaccionesAdversas, setReaccionesAdversas] = useState('');
	const [sobreDosis, setSobreDosis] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		const farmaco = {
			nombre,
			familia,
			mecanismoDeAccion,
			indicaciones,
			presentaciones,
			nombresComercial,
			posologia,
			riesgo,
			contraindicaciones,
			interacciones,
			reaccionesAdversas,
			sobreDosis,
		};
		try {
			const response = await axios.post('/agregarFarmaco', farmaco);
			console.log(response.data);
			alert('Farmaco agregado con éxito');
		} catch (error) {
			console.error(error);
			alert('Error al agregar farmaco');
		}
	};

	return (
		<section id={Styles.contenedor}>
			<h1>Agregar Farmaco</h1>
			<form onSubmit={handleSubmit}>
				<label>
					Nombre:
					<input
						type='text'
						value={nombre}
						onChange={(e) => setNombre(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Familia:
					<input
						type='text'
						value={familia}
						onChange={(e) => setFamilia(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Mecanismo de Acción:
					<input
						type='text'
						value={mecanismoDeAccion}
						onChange={(e) => setMecanismoDeAccion(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Indicaciones:
					<input
						type='text'
						value={indicaciones}
						onChange={(e) => setIndicaciones(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Presentaciones:
					<input
						type='text'
						value={presentaciones}
						onChange={(e) => setPresentaciones(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Nombres Comercial:
					<input
						type='text'
						value={nombresComercial}
						onChange={(e) => setNombresComercial(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Posología:
					<input
						type='text'
						value={posologia}
						onChange={(e) => setPosologia(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Riesgo:
					<input
						type='text'
						value={riesgo}
						onChange={(e) => setRiesgo(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Contraindicaciones:
					<input
						type='text'
						value={contraindicaciones}
						onChange={(e) => setContraindicaciones(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Interacciones:
					<input
						type='text'
						value={interacciones}
						onChange={(e) => setInteracciones(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Reacciones Adversas:
					<input
						type='text'
						value={reaccionesAdversas}
						onChange={(e) => setReaccionesAdversas(e.target.value)}
					/>
				</label>
				<br />
				<label>
					Sobre Dosis:
					<input
						type='text'
						value={sobreDosis}
						onChange={(e) => setSobreDosis(e.target.value)}
					/>
				</label>
				<br />
				<button type='submit'>Agregar Farmaco</button>
			</form>
		</section>
	);
};

export default Post;
