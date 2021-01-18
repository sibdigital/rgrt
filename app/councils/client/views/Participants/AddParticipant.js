import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Icon, TextInput, Tile, Field, Table, Label } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useMethod } from '../../../../../client/contexts/ServerContext';

const SearchByText = ({ setParams, usersData, setUsersData, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		const regExp = new RegExp('^'.concat(text), 'i');
		try {
			setUsersData(usersData.filter((user) => (user.name && user.name.match(regExp))
				|| (user.surname && user.surname.match(regExp))
				|| (user.username && user.username.match(regExp))
				|| text.length === 0));
		} catch (e) {
			setUsersData(usersData);
			console.log(e);
		}
	}, [usersData, setUsersData, text]);

	return <Box mbe='x16' is='form' onSubmit={useCallback((e) => e.preventDefault(), [])} display='flex' flexDirection='column' {...props}>
		<TextInput flexShrink={0} placeholder={t('Search_Users')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1, surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
	query: JSON.stringify({
		$or: [
			{ 'emails.address': { $regex: text || '', $options: 'i' } },
			{ username: { $regex: text || '', $options: 'i' } },
			{ name: { $regex: text || '', $options: 'i' } },
			{ surname: { $regex: text || '', $options: 'i' } },
		],
		$and: [
			{ type: { $ne: 'bot' } },
		],
	}),
	sort: JSON.stringify({ [column]: sortDir(direction), usernames: column === 'name' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, itemsPerPage, current, column, direction]);

export function AddParticipant({ councilId, onChange, close, users, invitedUsers, setInvitedUsers, onNewParticipant, onCreateParticipantId }) {
	let form = {};
	if (councilId) {
		form = <AddParticipantWithData councilId={councilId} onChange={onChange} close={close} users={users} invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsers} onNewParticipant={onNewParticipant} onCreateParticipantId={onCreateParticipantId}/>;
	} else {
		form = <AddParticipantWithoutData onChange={onChange} close={close} invitedUsers={invitedUsers} onNewParticipant={onNewParticipant} setInvitedUsers={setInvitedUsers} users={users} onCreateParticipantId={onCreateParticipantId}/>;
	}

	return form;
}

function AddParticipantWithoutData({ onChange, close, users, invitedUsers, setInvitedUsers, onNewParticipant, onCreateParticipantId }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [countSelectedUsers, setCountSelectedUsers] = useState(0);
	const [usersIdToAdd, setUsersIdToAdd] = useState([]);
	const [findUsers, setFindUsers] = useState([]);

	useEffect(() => {
		if (users) {
			setFindUsers(users.filter((user) => invitedUsers.findIndex((invitedUser) => invitedUser === user._id) < 0));
		}
	}, [users, invitedUsers]);

	// const usersWithoutCurrentCouncil = users ? users.filter((user) =>
	// 	invitedUsers.findIndex((invitedUser) => invitedUser === user._id) < 0)
	// 	: [];

	const handleSave = useCallback(async () => {
		try {
			if (usersIdToAdd.length > 0) {
				setInvitedUsers(invitedUsers ? invitedUsers.concat(usersIdToAdd) : usersIdToAdd);
				setUsersIdToAdd([]);
				dispatchToastMessage({ type: 'success', message: t('Participant_Added_Successfully') });
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onChange();
			close();
		}
	}, []);

	// if create new user
	if (onCreateParticipantId && usersIdToAdd.length === 0) {
		usersIdToAdd.push(onCreateParticipantId);
		handleSave();
	}

	const onAddClick = (_id) => () => {
		const index = usersIdToAdd.indexOf(_id);
		if (index < 0) {
			usersIdToAdd.push(_id);
		} else {
			usersIdToAdd.splice(index, 1);
		}
		setCountSelectedUsers(usersIdToAdd.length);
		onChange();
	};

	return <>
		{!onCreateParticipantId && <Field mbe='x8'>
			<Label fontScale='p1'>{ t('Selected') }: { countSelectedUsers }</Label>
			<ButtonGroup marginInlineStart='auto'>
				<Button onClick={ onNewParticipant('newParticipants') } small primary aria-label={ t('New') }>
					{ t('Participant_Create') }
				</Button>
				<Button onClick={ handleSave } small primary aria-label={ t('Add') }>
					{ t('Add') }
				</Button>
				<Button onClick={ close } small primary aria-label={ t('Cancel') }>
					{ t('Cancel') }
				</Button>
			</ButtonGroup>
		</Field>}
		{!onCreateParticipantId && <SearchByText setParams={ setParams } usersData={users} setUsersData={setFindUsers}/>}
		{ findUsers && !findUsers.length && !onCreateParticipantId
			? <>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{ t('No_data_found') }
				</Tile>
				{ params.text !== '' && <Button
					mbe='x8' primary aria-label={ t('New') } onClick={ onNewParticipant('newParticipants') }>
					{ t('Participant_Create') }
				</Button> }
			</>
			: <>
				<UsersTable invitedUsers={ findUsers } usersIdToAdd={ usersIdToAdd } handleAddUser={ onAddClick }/>
			</>
		}
	</>;
}

function AddParticipantWithData({ councilId, onChange, close, users, invitedUsers, setInvitedUsers, onNewParticipant, onCreateParticipantId }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [countSelectedUsers, setCountSelectedUsers] = useState(0);
	const [usersIdToAdd, setUsersIdToAdd] = useState([]);
	const [findUsers, setFindUsers] = useState([]);

	const addUsersToCouncil = useMethod('addUsersToCouncil');

	// const debouncedParams = useDebouncedValue(params, 500);
	// const debouncedSort = useDebouncedValue(sort, 500);
	// const query = useQuery(debouncedParams, debouncedSort);

	// const data = useEndpointData('users.list', query) || { users: [] };
	console.log(users);
	console.log(invitedUsers);


	useEffect(() => {
		if (users) {
			setFindUsers(invitedUsers && invitedUsers.length > 0 ? users.filter((user) => invitedUsers.findIndex((invitedUsers) => invitedUsers === user._id) < 0) : users);
		}
	}, [users, invitedUsers]);

	const onAddUserCancelClick = () => {
		close();
	};

	const saveAction = useCallback(async () => {
		await addUsersToCouncil(councilId, usersIdToAdd);
	}, [dispatchToastMessage, addUsersToCouncil]);

	const handleSave = useCallback(async () => {
		try {
			if (usersIdToAdd.length > 0) {
				await saveAction();
				setInvitedUsers(invitedUsers ? invitedUsers.concat(usersIdToAdd) : usersIdToAdd);
				setUsersIdToAdd([]);
				dispatchToastMessage({ type: 'success', message: t('Participant_Added_Successfully') });
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onChange();
			close();
		}
	}, [dispatchToastMessage, saveAction, t]);

	// if create new user
	if (onCreateParticipantId && usersIdToAdd.length === 0) {
		usersIdToAdd.push(onCreateParticipantId);
		handleSave();
	}

	const onAddClick = (_id) => () => {
		const index = usersIdToAdd.indexOf(_id);
		if (index < 0) {
			usersIdToAdd.push(_id);
		} else {
			usersIdToAdd.splice(index, 1);
		}
		setCountSelectedUsers(usersIdToAdd.length);
		onChange();
	};

	return <>
		{!onCreateParticipantId && <Field mbe='x8'>
			<Label fontScale='p1'>{t('Selected')}: {countSelectedUsers}</Label>
			<ButtonGroup marginInlineStart='auto'>
				<Button onClick={onNewParticipant('newParticipants')} small primary aria-label={ t('New') }>
					{ t('Participant_Create') }
				</Button>
				<Button onClick={handleSave} small primary aria-label={t('Add')}>
					{t('Add')}
				</Button>
				<Button onClick={onAddUserCancelClick} small primary aria-label={t('Cancel')}>
					{t('Cancel')}
				</Button>
			</ButtonGroup>
		</Field>}
		{!onCreateParticipantId && <SearchByText setParams={ setParams } usersData={users} setUsersData={setFindUsers}/>}
		{ findUsers && !findUsers.length && !onCreateParticipantId
			? <>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{ t('No_data_found') }
				</Tile>
				{ params.text !== '' && <Button
					mbe='x8' primary aria-label={ t('New') } onClick={onNewParticipant('newParticipants')}>
					{ t('Participant_Create') }
				</Button> }
			</>
			: <>
				<UsersTable invitedUsers={ findUsers } usersIdToAdd={ usersIdToAdd } handleAddUser={ onAddClick }/>
			</>
		}
	</>;
}

function UsersTable({ invitedUsers, usersIdToAdd, handleAddUser }) {
	const t = useTranslation();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'fio'} color='default'>{t('Council_participant')}</Th>,
		<Th key={'organization'} color='default'>{t('Organization')}</Th>,
		mediaQuery && <Th key={'position'} color='default'>{t('Position')}</Th>,
		mediaQuery && <Th key={'phone'} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'} color='default'>{t('Email')}</Th>,
	], [mediaQuery]);

	const style = { textOverflow: 'ellipsis', overflow: 'hidden' };
	const styleTableRow = { wordWrap: 'break-word' };

	const getBackgroundColor = (invitedUser) => {
		const index = invitedUsers.findIndex((user) =>
			user.name === invitedUser.name
			&& user.surname === invitedUser.surname
			&& user.patronymic === invitedUser.patronymic
			&& user.username === invitedUser.username
			&& user.organization === invitedUser.organization
			&& user.position === invitedUser.position
			&& user.phone === invitedUser.phone
			&& user.emails === invitedUser.emails
			&& user.ts === invitedUser.ts);
		if (usersIdToAdd && usersIdToAdd.findIndex((userId) => invitedUser._id === userId) > -1) {
			return 'var(--list-selected-element-background-color)';
		}
		if (index > 0 && index % 2 === 1) {
			return 'var(--list-even-element-background-color)';
		}

		return 'var(--list-element-background-color)';
	};

	const renderRow = (invitedUser) => {
		const iu = invitedUser;
		const email = iu.emails ? iu.emails[0].address : '';
		return <Table.Row key={iu._id} style={styleTableRow} onClick={handleAddUser(iu._id)} backgroundColor={getBackgroundColor(invitedUser)} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.surname} {iu.name} {iu.patronymic}</Table.Cell>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.organization}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.position}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{email}</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={invitedUsers} total={invitedUsers.length} setParams={setParams} params={params} />;
}
