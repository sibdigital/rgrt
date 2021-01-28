import { Meteor } from 'meteor/meteor';
import React, { useCallback, useMemo } from 'react';
import { Box, Button, ButtonGroup, Icon, Modal, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { hasPermission } from '../../../authorization';
import { downloadCouncilParticipantsForm } from './lib';

const DeleteWarningModal = ({ title, onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{title}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ title, onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{title}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function Councils({
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
	const formatDateAndTime = useFormatDateAndTime();

	const setModal = useSetModal();

	const isAllow = hasPermission('edit-councils', Meteor.userId());

	const deleteCouncil = useMethod('deleteCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const downloadCouncilParticipantsMethod = useMethod('downloadCouncilParticipants');

	const downloadCouncilParticipants = (_id, type, date) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadCouncilParticipantsMethod({ _id, dateString: formatDateAndTime(data.d) });
			const fileName = [type, ' ', moment(new Date(date)).format('DD MMMM YYYY'), '.docx'].join('');
			if (res) {
				downloadCouncilParticipantsForm({ res, fileName });
			}
		} catch (e) {
			console.error('[councils.js].downloadCouncilParticipants :', e);
		}
	};

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

	const colorTextCouncil = (date) => {
		const status = getDateStatus(date);
		let color = 'var(--rc-color-councils-background-to-be)';
		if (status === 'today') {
			color = 'var(--rc-color-councils-text-color-held)';
		} else if (status === 'held') {
			color = 'var(--rc-color-councils-text-color-to-be)';
		}
		return color;
	};

	const statusCouncil = (date) => {
		const status = getDateStatus(date);
		let statusText = t('To_be');
		if (status === 'today') {
			statusText = t('Today');
		} else if (status === 'held') {
			statusText = t('Held');
		}
		return statusText;
	};

	const styleTr = { borderBottomWidth: '10px', borderBottomColor: 'var(--color-white)' };

	const onDeleteCouncilConfirm = useCallback(async (_id) => {
		try {
			await deleteCouncil(_id);
			setModal(() => <SuccessModal title={'Delete'} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteCouncil, dispatchToastMessage, onChange]);

	const onDel = (_id) => () => { onDeleteCouncilConfirm(_id); };

	const onDeleteCouncilClick = (_id) => () => setModal(() => <DeleteWarningModal title={t('Council_Delete_Warning')} onDelete={onDel(_id)} onCancel={() => setModal(undefined)}/>);

	const header = useMemo(() => [
		<Th key={'d'} direction={sort[1]} active={sort[0] === 'd'} onClick={onHeaderClick} sort='d' style={{ width: '190px' }} color='default'>{t('Date')}</Th>,
		<Th key={'desc'} color='default'>{t('Description')}</Th>,
		// mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '190px' }} color='default'>{t('Created_at')}</Th>,
		mediaQuery && <Th key={'Council_type'} style={{ width: '190px' }} color='default'>{t('Council_type')}</Th>,
		isAllow && <Th w='x40' key='edit'/>,
		isAllow && <Th w='x40' key='delete'/>,
		<Th w='x40' key='download'/>,
	], [sort, mediaQuery]);

	const renderRow = (council) => {
		const { _id, d: date, desc, type } = council;
		return <Table.Row key={_id} tabIndex={0} role='link' action style={styleTr} backgroundColor={colorBackgroundCouncil(date)}>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color={colorTextCouncil(date)}>{formatDateAndTime(date)} {statusCouncil(date)}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color={colorTextCouncil(date)}><Box withTruncatedText>{desc}</Box></Table.Cell>
			{/*{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color={colorTextCouncil(date)}>{formatDateAndTime(ts)}</Table.Cell>}*/}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color={colorTextCouncil(date)}>{type?.title ?? ''}</Table.Cell>}
			{ isAllow && <Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')} color={colorTextCouncil(date)}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>}
			{ isAllow && <Table.Cell alignItems={'end'}>
				<Button small aria-label={t('Delete')} onClick={onDeleteCouncilClick(_id)} color={colorTextCouncil(date)}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={downloadCouncilParticipants(_id, type?.title ?? '', date)} aria-label={t('Download')} color={colorTextCouncil(date)}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data.councils} total={data.total} setParams={setParams} params={params} />;
}
