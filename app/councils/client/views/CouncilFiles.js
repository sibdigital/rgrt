import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button, Icon, Table, Box } from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import _ from 'underscore';
import { Tooltip } from '@material-ui/core';

import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { downLoadFile } from '../../../utils/client/methods/downloadFile';
import { SuccessModal, WarningModal } from '../../../utils';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction]);

export function CouncilFiles({ councilId, isSecretary, mediaQuery, isReload = false, onNewFileAdded, onNewFileAddedIds, handleTagChanged }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const [cache, setCache] = useState(new Date());
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	// const [sort, setSort] = useState(['title', 'asc']);
	const [currentMovedFiles, setCurrentMovedFiles] = useState({ upIndex: -1, downIndex: -1 });
	const [filesArray, setFilesArray] = useState([]);
	const [filesIdTagChangedArray, setFilesIdTagChangedArray] = useState([]);

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
		// sort: JSON.stringify({ title: sortDir('asc') }),
		fields: JSON.stringify({ documents: 1 }),
		cache: JSON.stringify({ cache }),
		isReload: JSON.stringify({ isReload }),
	}), [councilId, cache, isReload]);

	const { data, state } = useEndpointDataExperimental('councils.findOne', query) || {};

	useEffect(() => {
		if (data && data.documents) {
			setFilesArray(data.documents);
		}
	}, [data]);

	useMemo(() => {
		if (onNewFileAdded && _.isArray(onNewFileAdded)) {
			setFilesArray(filesArray.concat(onNewFileAdded));
		}
	}, [onNewFileAdded]);

	useMemo(() => setFilesIdTagChangedArray([]), [isReload]);

	const updateCouncilFilesOrder = useMethod('updateCouncilFilesOrder');
	const deleteFileFromCouncil = useMethod('deleteFileFromCouncil');

	const onChange = useCallback(() => {
		console.log(cache.toString());
		setCache(new Date());
	}, [cache]);

	const moveFileUpOrDown = useCallback(async (type, index) => {
		const arr = data.documents;
		if ((index > 0 && type === 'up') || (index < data.documents.length - 1 && type === 'down')) {
			if (type === 'up') {
				setCurrentMovedFiles({ downIndex: index, upIndex: index - 1 });
				[arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
			} else {
				setCurrentMovedFiles({ downIndex: index + 1, upIndex: index });
				[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
			}
			const filesArray = await updateCouncilFilesOrder(councilId, arr);
			// setAttachedFiles(arr);
			// onChange();
		}
	}, [councilId, data, onChange, updateCouncilFilesOrder]);

	const onDownloadFileClick = (file) => async (e) => {
		console.log('onDownloadFileClick');
		await downLoadFile(file)(e);
	};

	const onFileDeleteConfirm = async (fileId, orderIndex) => {
		try {
			console.dir({ fileId, orderIndex, onNewFileAddedIds });
			if (!fileId && onNewFileAddedIds) {
				fileId = onNewFileAddedIds.find((file) => file.orderIndex === orderIndex)._id;
				console.dir({ fileId });
			}
			await deleteFileFromCouncil(councilId, fileId);

			await updateCouncilFilesOrder(councilId, data.documents.filter((file) => file._id !== fileId));

			setModal(() => <SuccessModal title={t('Deleted')} contentText={t('File_has_been_deleted')} onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	};

	const openFileDeleteConfirm = (fileId, orderIndex) => setModal(() => <WarningModal title={t('Are_you_sure')} onDelete={() => onFileDeleteConfirm(fileId, orderIndex) } onCancel={() => setModal(undefined)}/>);

	const onDeleteFileConfirmDel = (fileId, orderIndex) => async (e) => {
		e.preventDefault();
		try {
			openFileDeleteConfirm(fileId, orderIndex);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const header = useMemo(() => [
		// <Th w='x40' key={'Index'} color='default'>
		// 	{'№' }
		// </Th>,
		<Th w='x40' key='index'>
			{'#'}
		</Th>,
		<Th key={'File_name'} color='default'>
			{ t('File_name') }
		</Th>,
		mediaQuery && <Th w='x200' key={'File_uploaded_uploadedAt'} color='default'>
			{ t('File_uploaded_uploadedAt') }
		</Th>,
		mediaQuery && isSecretary && <Th w='x200' key={'Region'} color='default'>
			{ t('Region') }
		</Th>,
		mediaQuery && isSecretary && <Th w='x40' key='edit'/>,
		mediaQuery && isSecretary && <Th w='x40' key='moveUp'/>,
		mediaQuery && isSecretary && <Th w='x40' key='moveDown'/>,
		mediaQuery && <Th w='x40' key='download'/>,
		isSecretary && <Th w='x40' key='delete'/>,
	], [mediaQuery, isSecretary]);

	const renderRow = (document) => {
		const { _id, title, ts, tag } = document;

		const getStyle = (index) => {
			let style = {};
			if (index === currentMovedFiles.upIndex) {
				style = { animation: 'slideDown 0.3s linear' };
			} else if (index === currentMovedFiles.downIndex) {
				style = { animation: 'slideUp 0.3s linear' };
			}
			return { ...style, ...filesIdTagChangedArray.includes(_id) && { border: '1px solid #4fb0fc' } };
		};

		const style = getStyle(document.index);

		return <Table.Row width='99%' key={_id} tabIndex={0} role='link' action style={style}>
			<Table.Cell fontScale='p1' color='default'>{document.index + 1}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{title}</Table.Cell>
			{mediaQuery && <Table.Cell fontScale='p1' color='default'>{formatDateAndTime(ts ?? new Date())}</Table.Cell>}
			{mediaQuery && isSecretary && <Table.Cell alignItems={'end'}>
				{tag?.name ?? ''}
			</Table.Cell>}
			{mediaQuery && isSecretary && <Table.Cell alignItems='end'>
				<Tooltip title={t('Region_Change')} arrow placement='top'>
					<Button
						onClick={() => {
							handleTagChanged(document);
							setFilesIdTagChangedArray([_id]);
							// tag?._id && setCurrentTag(tag);
							// setContext('uploadFiles');
							// setCurrentUploadedFiles([document]);
						}}
						small
						aria-label={t('Region_Change')}
					>
						<Icon name='edit'/>
					</Button>
				</Tooltip>
			</Table.Cell>}
			{mediaQuery && isSecretary && <Table.Cell alignItems={'end'}>
				<Button small aria-label={t('moveUp')} onClick={() => moveFileUpOrDown('up', document.index)} style={{ transform: 'rotate(180deg)', transition: 'all 0s' }}>
					<Icon name='arrow-down'/>
				</Button>
			</Table.Cell>}
			{mediaQuery && isSecretary && <Table.Cell alignItems={'end'}>
				<Button small aria-label={t('moveDown')} onClick={() => moveFileUpOrDown('down', document.index)}>
					<Icon name='arrow-down'/>
				</Button>
			</Table.Cell>}
			{mediaQuery && <Table.Cell alignItems={'end'}>
				<Button small aria-label={t('download')} onClick={onDownloadFileClick(document)}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>}
			{isSecretary && <Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteFileConfirmDel(document._id, document.orderIndex)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	};

	return <Box overflowX='hidden'>
		<GenericTable header={header} renderRow={renderRow} results={filesArray} total={filesArray?.length ?? 0} setParams={setParams} params={params}/>
	</Box>;
}

CouncilFiles.displayName = 'CouncilFiles';

export default CouncilFiles;
