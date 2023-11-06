import { useBearStore } from '../../GlobalState';
import { FormatDateWithoutHours } from '../../Utils';
import { ChartFrequency } from '../../account';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import tailwindConfig from '../../../tailwind.config.js';

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
);

type EvolutionChartProps = {
	frequency: ChartFrequency;
	transactions?: string[];
	title?: string;
};

const EvolutionChart = ({
	frequency,
	transactions,
	title,
}: EvolutionChartProps) => {
	const { account } = useBearStore();

	const options: ChartOptions = {
		responsive: true,
		scales: {
			x: {
				ticks: {
					color: tailwindConfig.theme.colors['text-color'],
				},
			},
			y: {
				type: 'linear',
				ticks: {
					color: tailwindConfig.theme.colors['text-color'],
				},
			},
		},
		plugins: {
			legend: {
				display: false,
			},
			title: {
				display: true,
				text: title || `Balance Evolution by ${frequency}`,
				color: tailwindConfig.theme.colors['active-text-color'],
				font: { weight: 'normal' },
			},
			tooltip: {
				displayColors: false,
			},
		},
	};

	const GetBalanceAtDay = (day: string) => {
		let date = new Date(day);
		date.setDate(date.getDate() + 1);

		let result = 0;
		account!.transactions.forEach(t => {
			let cdate = new Date(t.date);
			if (cdate < date) {
				result += t.amount;
			}
		});

		return result;
	};

	const GenerateData = () => {
		const labels: string[] = [];
		const data: number[] = [];

		switch (frequency) {
			case 'Days':
			case 'Weeks':
			case 'Months':
			case 'Years':
				// Get Date With Transaction
				let datesWithTransactions: string[] = [];
				account!.transactions.forEach(t => {
					if (!transactions || (transactions && transactions.includes(t.id))) {
						let currentDate = new Date(t.date);
						if (!datesWithTransactions.includes(currentDate.toDateString()))
							datesWithTransactions.push(currentDate.toDateString());
					}
				});

				datesWithTransactions.sort((a, b) => {
					return new Date(a).getTime() - new Date(b).getTime();
				});

				datesWithTransactions.forEach(d => {
					labels.push(FormatDateWithoutHours(new Date(d).getTime()));
					data.push(GetBalanceAtDay(d));
				});
				break;
		}

		return {
			labels,
			datasets: [
				{
					label: 'Balance',
					data,
					borderColor: tailwindConfig.theme.colors['cta-primarly'],
					backgroundColor: `${
						tailwindConfig.theme.colors['cta-primarly']
					}${Math.round(0.6 * 255).toString(16)}`,
					tension: 0.1,
				},
			],
		};
	};

	return (
		<div className="w-full h-full p-4">
			{account ? (
				<Line
					// @ts-ignore
					options={options}
					data={GenerateData()}
					className="w-full h-full"
				></Line>
			) : (
				<p className="text-text-color">Loading...</p>
			)}
		</div>
	);
};

export default EvolutionChart;
