const FormatDate = (date: number) => {
	return new Date(date).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

export { FormatDate };
