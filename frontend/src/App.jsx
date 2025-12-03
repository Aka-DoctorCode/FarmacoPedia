import StateContext from './context/StateContext';

import Descargo from './views/Descargo';
import Frame from './views/Frame';
import BotonPill from './components/BontonPill';

const App = () => {
	return (
		<StateContext>
			<Descargo />
			<Frame />
		</StateContext>
	);
};

export default App;
