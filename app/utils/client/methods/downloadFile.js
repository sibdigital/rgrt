export const downLoadFile = (file) => async (e) => {
	console.log('downLoadFile');
	// e.preventDefault();
	try {
		const filename = `${ file.title ?? file.name }`;
		if (window.navigator && window.navigator.msSaveOrOpenBlob) {
			console.log('window navigator');
			const blob = new Blob([decodeURIComponent(encodeURI(JSON.stringify(file)))], { type: file.type });
			return navigator.msSaveOrOpenBlob(blob, filename);
		}
		const aElement = document.createElement('a');
		aElement.download = filename;
		aElement.href = `${ file.title_link ?? file.url }`;
		aElement.target = '_blank';
		document.body.appendChild(aElement);
		aElement.click();
		document.body.removeChild(aElement);
	} catch (e) {
		console.error('[index.js].downloadWorkingGroupRequestAnswerFile: ', e);
	}
};
