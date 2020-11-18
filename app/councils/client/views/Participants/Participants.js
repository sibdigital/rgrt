import React, { useCallback, useMemo, useState } from 'react';
import { Box, Button, Icon, Tile, ButtonGroup, Modal, Table, Field } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { useSetModal } from '../../../../../client/contexts/ModalContext';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';

const clickable = css`
		cursor: pointer;
		// border-bottom: 2px solid #F2F3F5 !important;

		&:hover,
		&:focus {
			background: #F7F8FA;
		}
	`;

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ _id, itemsPerPage, current }, [ column, direction ], cache) => useMemo(() => ({
	query: JSON.stringify({ _id }),
	fields: JSON.stringify({ name: 1, username: 1, emails: 1,
		surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
	// TODO: remove cache. Is necessary for data invalidation
}), [_id, itemsPerPage, current, column, direction, cache]);

const DeleteWarningModal = ({ onDelete, onCancel, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Participant_Delete_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary danger onClick={onDelete}>{t('Delete')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const SuccessModal = ({ onClose, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='checkmark-circled' size={20}/>
			<Modal.Title>{t('Deleted')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{t('Participant_Has_Been_Deleted')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export function Participants({ councilId, onChange, context, invitedUsers, setInvitedUsers }) {
	console.log('Participants');
	let form = {};
	if (councilId || context === undefined || context === '') {
		form = <ParticipantsWithData councilId={councilId} onChange={onChange}/>;
	}
	if (context === 'new') {
		form = <ParticipantsWithoutData onChange={onChange} invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsers}/>;
	}
	return form;
}

function ParticipantsWithoutData({ onChange, invitedUsers, setInvitedUsers }) {
	const onDeleteUserFromCouncilClick = (userId) => () => {
		const users = invitedUsers.filter((user) => user._id !== userId).map((user) => user._id);
		setInvitedUsers(users);
		onChange();
	};

	return <InvitedUsersTable invitedUsers={invitedUsers} onDelete={onDeleteUserFromCouncilClick}/>;
}

function ParticipantsWithData({ councilId, onChange }) {
	const t = useTranslation();
	const [params, setParams] = useState({ _id: councilId, current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [cache, setCache] = useState();

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('councils.invitedUsers', query) || { invitedUsers: [] };

	const deleteUserFromCouncil = useMethod('deleteUserFromCouncil');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const onDeleteUserFromCouncilConfirm = useCallback(async (userId) => {
		try {
			await deleteUserFromCouncil(councilId, userId);
			data.invitedUsers = data.invitedUsers.filter((invitedUser) => invitedUser !== userId);
			setModal(() => <SuccessModal title={'Delete'} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteUserFromCouncil, dispatchToastMessage, onChange]);

	const onDel = (userId) => () => { onDeleteUserFromCouncilConfirm(userId); };

	const onDeleteUserFromCouncilClick = (userId) => () => setModal(() => <DeleteWarningModal title={t('Council_user_delete_warning')} onDelete={onDel(userId)} onCancel={() => setModal(undefined)}/>);

	return <InvitedUsersTable invitedUsers={data.invitedUsers} onDelete={onDeleteUserFromCouncilClick}/>;
}

export function InvitedUsersTable({ invitedUsers, onDelete }) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'fio'} color='default'>{t('Council_participant')}</Th>,
		<Th key={'position'} color='default'>{t('Council_Organization_Position')}</Th>,
		mediaQuery && <Th key={'contact'} color='default'>{t('Council_Contact_person')}</Th>,
		mediaQuery && <Th key={'phone'} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'} color='default'>{t('Email')}</Th>,
		mediaQuery && <Th key={'createdAt'} style={{ width: '190px' }} color='default'>{t('Joined_at')}</Th>,
		<Th w='x40' key='edit'></Th>,
		<Th w='x40' key='delete'></Th>,
	], [mediaQuery]);

	const styleTableRow = { wordWrap: 'break-word' };
	const style = { textOverflow: 'ellipsis', overflow: 'hidden' };

	const getBackgroundColor = (invitedUser) => {
		const index = invitedUsers.findIndex((user) => (
			user.name === invitedUser.name
			&& user.surname === invitedUser.surname
			&& user.patronymic === invitedUser.patronymic
			&& user.username === invitedUser.username
			&& user.position === invitedUser.position
			&& user.organization === invitedUser.organization
			&& user.contactPersonFirstName === invitedUser.contactPersonFirstName
			&& user.contactPersonLastName === invitedUser.contactPersonLastName
			&& user.contactPersonPatronymicName === invitedUser.contactPersonPatronymicName
			&& user.phone === invitedUser.phone
			&& user.emails === invitedUser.emails
			&& user.ts === invitedUser.ts
		));
		if (index > 0 && index % 2 === 1) {
			return 'var(--color-lighter-blue)';
		}

		return '';
	};

	const renderRow = (invitedUser) => {
		const iu = invitedUser;
		const email = iu.emails ? iu.emails[0].address : '';
		return <Table.Row key={iu._id} style={styleTableRow} backgroundColor={getBackgroundColor(invitedUser)} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.surname} {iu.name} {iu.patronymic}</Table.Cell>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.position}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.contactPersonLastName} {iu.contactPersonFirstName} {iu.contactPersonPatronymicName}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{formatDateAndTime(iu.ts)}</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small aria-label={t('Edit_User')} >
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
			<Table.Cell alignItems={'end'}>
				<Button small aria-label={t('Delete')} onClick={onDelete(iu._id)}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={invitedUsers} total={invitedUsers.length} setParams={setParams} params={params} />;
}
