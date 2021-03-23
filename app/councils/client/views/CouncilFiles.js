import React, { useState, useCallback, useMemo } from 'react';
import { Button, Icon, Callout, Table } from '@rocket.chat/fuselage';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import { hasPermission } from '../../../authorization';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { useUserId } from '../../../../client/contexts/UserContext';
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

export function CouncilFiles({ councilId, isSecretary, mediaQuery, isReload = false }) {
	const t = useTranslation();
	const userId = useUserId();
	const formatDateAndTime = useFormatDateAndTime();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const [cache, setCache] = useState(new Date());
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	// const [sort, setSort] = useState(['title', 'asc']);
	const [currentMovedFiles, setCurrentMovedFiles] = useState({ upIndex: -1, downIndex: -1 });
	const [maxOrderFileIndex, setMaxOrderFileIndex] = useState(0);

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
		// sort: JSON.stringify({ title: sortDir('asc') }),
		fields: JSON.stringify({ documents: 1 }),
		cache: JSON.stringify({ cache }),
		isReload: JSON.stringify({ isReload }),
	}), [councilId, cache, isReload]);

	const { data, state } = useEndpointDataExperimental('councils.findOne', query) || {};

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

	const onFileDeleteConfirm = async (fileId) => {
		console.log(fileId);
		try {
			await deleteFileFromCouncil(councilId, fileId);
			setMaxOrderFileIndex(data.documents.length);

			const arr = await updateCouncilFilesOrder(councilId, data.documents.filter((file) => file._id !== fileId));
			// setAttachedFiles(arr);

			setModal(() => <SuccessModal title={t('Deleted')} contentText={t('File_has_been_deleted')} onClose={() => { setModal(undefined); close(); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onChange();
		}
	};

	const openFileDeleteConfirm = (fileId) => setModal(() => <WarningModal title={t('Are_you_sure')} onDelete={() => onFileDeleteConfirm(fileId) } onCancel={() => setModal(undefined)}/>);

	const onDeleteFileConfirmDel = (fileId) => async (e) => {
		e.preventDefault();
		try {
			openFileDeleteConfirm(fileId);
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
		<Th w='x200' key={'File_uploaded_uploadedAt'} color='default'>
			{ t('File_uploaded_uploadedAt') }
		</Th>,
		isSecretary && <Th w='x40' key='moveUp'/>,
		isSecretary && <Th w='x40' key='moveDown'/>,
		<Th w='x40' key='download'/>,
		isSecretary && <Th w='x40' key='delete'/>,
	], [mediaQuery, isSecretary]);

	const renderRow = (document) => {
		const { _id, title, ts, orderIndex } = document;

		const getStyle = (index) => {
			let style = {};
			if (index === currentMovedFiles.upIndex) {
				style = { animation: 'slideDown 0.3s linear' };
			} else if (index === currentMovedFiles.downIndex) {
				style = { animation: 'slideUp 0.3s linear' };
			}
			return style;
		};

		const style = getStyle(document.index);

		return <Table.Row key={_id} tabIndex={0} role='link' action style={style}>
			<Table.Cell fontScale='p1' color='default'>{document.index + 1}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{title}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{formatDateAndTime(ts ?? new Date())}</Table.Cell>
			{isSecretary && <Table.Cell alignItems={'end'}>
				<Button small aria-label={t('moveUp')} onClick={() => moveFileUpOrDown('up', document.index)} style={{ transform: 'rotate(180deg)', transition: 'all 0s' }}>
					<Icon name='arrow-down'/>
				</Button>
			</Table.Cell>}
			{isSecretary && <Table.Cell alignItems={'end'}>
				<Button small aria-label={t('moveDown')} onClick={() => moveFileUpOrDown('down', document.index)}>
					<Icon name='arrow-down'/>
				</Button>
			</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small aria-label={t('download')} onClick={onDownloadFileClick(document)}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
			{isSecretary && <Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteFileConfirmDel(document._id)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data?.documents ?? []} total={data?.documents?.length ?? 0} setParams={setParams} params={params}/>;
}

CouncilFiles.displayName = 'CouncilFiles';

export default CouncilFiles;
