import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './views/Home';
import { useEffect, useState } from 'react';
import Loading from './views/Loading';
import NoBackend from './views/NoBackend';

const router = createBrowserRouter([
	{
		path: '/',
		element: <Home />,
	},
	{
		path: '/transactions',
		element: <Home />,
	},
	{
		path: '/stats',
		element: <Home />,
	},
	{
		path: '/monthly',
		element: <Home />,
	},
	{
		path: '/settings',
		element: <Home />,
	},
]);

const BACKEND_STATUS = {
	LOADING: -1,
	CONNECTED: 1,
	DISCONNECTED: 0,
};

function App() {
	const [backendStatus, setbackendStatus] = useState(BACKEND_STATUS.LOADING);

	const pingBackend = () => {
		fetch('http://localhost:3000')
			.then(() => setbackendStatus(BACKEND_STATUS.CONNECTED))
			.catch(() => setbackendStatus(BACKEND_STATUS.DISCONNECTED));
	};

	useEffect(() => {
		pingBackend();

		setInterval(() => {
			pingBackend();
		}, 3000);
	}, []);

	return (
		<div>
			{backendStatus == BACKEND_STATUS.LOADING && <Loading />}

			{backendStatus == BACKEND_STATUS.CONNECTED && (
				<RouterProvider router={router} />
			)}

			{backendStatus == BACKEND_STATUS.DISCONNECTED && <NoBackend />}
		</div>
	);
}

export default App;
