import { useEffect, useState } from 'react';
import { useBearStore } from '../../GlobalState';
import { ChartFrequency, DistributionChartType, FTChart } from '../../account';
import { FilterTransactions } from '../../Utils';
import EvolutionChart from './EvolutionChart';
import DistributionPieChart from './DistributionPieChart';
import { ChartProps } from '../../ChartProps';

const ChartBuilder = ({ chart }: { chart: FTChart }) => {
	const { account } = useBearStore();
	const [transactions, setTransactions] = useState<string[]>([]);

	useEffect(() => {
		if (account) {
			setTransactions(FilterTransactions(account, chart.filter));
		}
	}, [chart, account]);

	return (
		<div className="flex items-center justify-center h-full max-h-full max-w-full">
			{chart.type === 'EvolutionChart' && (
				<EvolutionChart
					frequency={
						(chart.options?.find(o => o.name === 'frequency')
							?.value as ChartFrequency) ||
						ChartProps.EvolutionChart.frequency.default
					}
					transactions={transactions}
				/>
			)}
			{chart.type === 'DistributionPieChart' && (
				<DistributionPieChart
					type={
						(chart.options?.find(o => o.name === 'distributionType')
							?.value as DistributionChartType) ||
						ChartProps.DistributionPieChart.distributionType.default
					}
					transactions={transactions}
				/>
			)}
		</div>
	);
};

export default ChartBuilder;
