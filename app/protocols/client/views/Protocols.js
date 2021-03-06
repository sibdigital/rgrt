import React, { useCallback, useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { SuccessModal, WarningModal } from '../../../utils/index';
import { useToastMessageDispatch } from "/client/contexts/ToastMessagesContext";
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';

const getDateStatus = (date) => {
	const today = new Date();
	const dt = new Date(date);
	let result = 'to-be';
	if (dt.getDate() === today.getDate() && dt.getMonth() === today.getMonth() && dt.getFullYear() === today.getFullYear()) {
		result = 'today';
	} else if (dt < today) {
		result = 'held';
	}
	return result;
};

const colorBackgroundCouncil = (date) => {
	const status = getDateStatus(date);
	let color = 'var(--rc-color-councils-background-to-be)';
	if (status === 'today') {
		color = 'var(--rc-color-councils-background-today)';
	} else if (status === 'held') {
		color = 'var(--rc-color-councils-background-held)';
	}
	return color;
};

export function Protocols({
	data,
	sort,
	onClick,
	onEditClick,
	onHeaderClick,
	onChange,
	setParams,
	params,
}) {
	const t = useTranslation();
	const isAllowedEdit = hasPermission('manage-protocols', useUserId());

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const setModal = useSetModal();

	const deleteProtocol = useMethod('deleteProtocol');

	const dispatchToastMessage = useToastMessageDispatch();

	const onDeleteConfirm = useCallback(async (_id) => {
		try {
			await deleteProtocol(_id);
			setModal(() => <SuccessModal title={t('Deleted')} contentText={t('Protocol_Has_Been_Deleted')} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteProtocol, dispatchToastMessage, onChange]);

	const onDel = (_id) => () => { onDeleteConfirm(_id); };

	const onDeleteClick = (_id) => () => setModal(() => <WarningModal title={t('Are_you_sure')} contentText={t('Protocol_Delete_Warning')} onDelete={onDel(_id)} onCancel={() => setModal(undefined)}/>);

	const downloadProtocolParticipantsMethod = useMethod('downloadProtocolParticipants');

	const downloadProtocolParticipants = (_id) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadProtocolParticipantsMethod({ _id });
			const url = window.URL.createObjectURL(new Blob([res]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'file.docx');
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadProtocolParticipants :', e);
		}
	};

	const header = useMemo(() => [
		<Th key={'num'} direction={sort[1]} active={sort[0] === 'num'} onClick={onHeaderClick} sort='num' style={{ width: '80px' }} color='default'>{t('Protocol_Number')}</Th>,
		<Th key={'d'} direction={sort[1]} active={sort[0] === 'd'} onClick={onHeaderClick} sort='d' color='default'>{t('Protocol_Date')}</Th>,
		mediaQuery && <Th key={'place'} color='default'>{t('Protocol_Place')}</Th>,
		mediaQuery && <Th key={'typename'} color='default'>{t('Council')}</Th>,
		// mediaQuery && <Th key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' style={{ width: '190px' }} color='default'>{t('Created_at')}</Th>,
		isAllowedEdit && <Th w='x40' key='edit'/>,
		isAllowedEdit && <Th w='x40' key='delete'/>,
	], [sort, mediaQuery]);

	const formatDate = useFormatDate();
	const formatDateAndTime = useFormatDateAndTime();

	const renderRow = (protocol) => {
		const { _id, d: date, num, place, council } = protocol;

		return <Table.Row key={_id} tabIndex={0} role='link' action backgroundColor={colorBackgroundCouncil(date)}>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>№ {num}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{formatDate(date)}</Box></Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{place}</Box></Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{council?.typename}</Box></Table.Cell>}
			{/*{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{formatDateAndTime(ts)}</Table.Cell>}*/}
			{ isAllowedEdit && <Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>}
			{ isAllowedEdit && <Table.Cell alignItems={'end'}>
				<Button small onClick={onDeleteClick(_id)} aria-label={t('Delete')}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
			{/*<Table.Cell alignItems={'end'}>*/}
			{/*	<Button small onClick={downloadProtocolParticipants(_id)} aria-label={t('Download')}>*/}
			{/*		<Icon name='download'/>*/}
			{/*	</Button>*/}
			{/*</Table.Cell>*/}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data.protocols} total={data.total} setParams={setParams} params={params} />;
}
