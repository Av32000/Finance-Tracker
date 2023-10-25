import { useLocation, useNavigate } from 'react-router-dom';
import AccountManagerCard from './AccountManagerCard';

const menu = [
	{
		name: 'Home',
		path: '/',
	},
	{
		name: 'Transactions',
		path: '/transactions',
	},
	{
		name: 'Statistics',
		path: '/stats',
	},
	{
		name: 'Monthly Budget',
		path: '/monthly',
	},
	{
		name: 'Settings',
		path: '/settings',
	},
];

const NavBar = () => {
	const location = useLocation();

	const navigate = useNavigate();

	return (
		<div className="w-[280px] h-screen bg-bg-dark">
			<img src="logo.svg" width={50} height={50} className="m-4" />
			<div className="p-6">
				{menu.map(m => (
					<div
						className={`flex items-center px-3 py-1 rounded bg-[#ffffff] cursor-pointer my-2 h-10 ${
							location.pathname == m.path ? 'bg-opacity-10' : 'bg-opacity-0'
						}`}
						onClick={() => navigate(m.path)}
						key={m.name}
					>
						<img
							src={`pages/${m.name.toLowerCase().split(' ').join('_')}.svg`}
							width={30}
							height={30}
						/>
						<p
							className={`pl-2 ${
								location.pathname == m.path
									? 'text-active-text-color'
									: 'text-text-color'
							}`}
						>
							{m.name}
						</p>
					</div>
				))}
			</div>
			<AccountManagerCard />
		</div>
	);
};

export default NavBar;
