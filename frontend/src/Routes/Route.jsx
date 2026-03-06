import Frame from '../views/Frame';
import StateContext from '../context/StateContext';
import BotonPill from '../components/BontonPill';
import Footer from '../components/Footer';
const PostRoute = () => {
	return (
		<StateContext>
			<BotonPill />
			<Frame />
			<Footer />
		</StateContext>
	);
};

export default PostRoute;
