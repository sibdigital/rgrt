import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Icon, TextInput, Tile, Scrollable } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';

const clickable = css`
		cursor: pointer;
		// border-bottom: 2px solid #F2F3F5 !important;

		&:hover,
		&:focus {
			background: #F7F8FA;
		}
	`;

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
	}, [setUsersData, text]);

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

export function AddParticipant({ protocolId, close, onCreateParticipant }) {
	console.log('AddParticipant');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [findUsers, setFindUsers] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const data = useEndpointData('persons.list', query) || { persons: [] };

	const participantsData = useEndpointData('protocols.allParticipants', useMemo(() => ({ query: JSON.stringify({ _id: protocolId }) }), [protocolId] )) || { users: [] };

	useEffect(() => {
		const persons = data?.persons.length > 0 ? participantsData?.users.length > 0 ? data.persons.filter(person => participantsData.users.find(p => p._id === person._id) === undefined) : data.persons : [];
		setFindUsers(persons);
	}, [data, participantsData]);

	const insertOrUpdateSection = useMethod('addParticipantToProtocol');

	const saveAction = useCallback(async (userId) => {
		await insertOrUpdateSection(protocolId, userId);
	}, [dispatchToastMessage, insertOrUpdateSection]);

	const handleSave = useCallback((userId) => async () => {
		try {
			await saveAction(userId);
			dispatchToastMessage({ type: 'success', message: t('Participant_Added_Successfully') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, saveAction, t]);

	const User = (user) => <Box
		pb='x4'
		color='default'
		className={clickable}
		onClick={handleSave(user._id)}
		title={t('Participant_Add')}
	>
		<Box fontSize={"16px"}>{user.surname} {user.name} {user.patronymic}</Box>
		{/* <Box color='hint'>{user.position}, {user.organization}</Box> */}
	</Box>;

	return <VerticalBar.ScrollableContent>
		<SearchByText setParams={ setParams } usersData={data.persons} setUsersData={setFindUsers}/>
		{findUsers && !findUsers.length
			? <>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{t('No_data_found')}
				</Tile>
				{params.text !== '' && <Button
					mbe='x8' primary onClick={onCreateParticipant('create-participant')} aria-label={t('New')}>
					{t('Participant_Create')}
				</Button>
				}
			</>
			: <>
				<Scrollable>
					<Box mb='x8' flexGrow={1}>
						{data
							? findUsers.map((props, index) => <User key={props._id || index} { ...props}/>)
							: <></>
						}
					</Box>
				</Scrollable>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close('participants')}>{t('Cancel')}</Button>
				</ButtonGroup>
			</>
		}
	</VerticalBar.ScrollableContent>;
}
