import { useEffect } from 'react';
import NavBar from '../components/NavBar';

const Home = () => {
	useEffect(() => {
		document.title = 'Finance Tracker - Home';
	});
	return (
		<div className="overflow-hidden flex">
			<NavBar />
			<h1>Home</h1>
		</div>
	);
};

export default Home;
