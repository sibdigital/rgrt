import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Field,	TextAreaInput, Button, ButtonGroup, TextInput, Icon, Label } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../client/components/basic/Page';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { validate, createCouncilData } from './lib';
import { Participants } from './Participants/Participants';
import { AddParticipant } from './Participants/AddParticipant';
import { CreateParticipant } from './Participants/CreateParticipant';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);
const useQuery = ({ text, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, username: 1, emails: 1,	surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
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

export function AddCouncilPage() {
	const t = useTranslation();
	const [cache, setCache] = useState();
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [users, setUsers] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };
	const data = useEndpointData('users.list', query) || { users: [] };
	useEffect(() => {
		if (data.users) {
			setUsers(data.users);
		}
	}, [data]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, [data]);

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroups && workingGroups.workingGroups?.length > 0) {
			return res.concat(workingGroups.workingGroups.map((workingGroup) => [workingGroup.title, workingGroup.title]));
		}
		return res;
	}, [workingGroups]);

	return <AddCouncilWithNewData users={users} setUsers={setUsers} onChange={onChange} workingGroupOptions={workingGroupOptions}/>;
}

AddCouncilPage.displayName = 'AddCouncilPage';

export default AddCouncilPage;

function AddCouncilWithNewData({ users, setUsers, onChange, workingGroupOptions }) {
	const t = useTranslation();

	const [context, setContext] = useState('participants');
	const [date, setDate] = useState(new Date());
	const [description, setDescription] = useState('');
	const [invitedUsersIds, setInvitedUsersIds] = useState([]);

	// TODO: maybe
	const invitedUsers = useMemo(() => users.filter((user) => invitedUsersIds.findIndex((iUser) => iUser === user._id) > -1), [invitedUsersIds, users]);

	const insertOrUpdateCouncil = useMethod('insertOrUpdateCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

	const goBack = () => {
		window.history.back();
	};

	const hasUnsavedChanges = useMemo(() => description.trim() !== '', [description]);

	const onAddParticipantClick = () => {
		setContext('addParticipants');
	};

	const onCreateParticipantClick = useCallback((user) => () => {
		setInvitedUsersIds(invitedUsersIds.concat(user._id));
		setUsers(users.concat(user));
		onChange();
		setContext('participants');
	}, [invitedUsersIds, context, users]);

	const onParticipantClick = useCallback((context) => () => {
		setContext(context);
	}, [context]);

	const onClose = () => {
		setContext('participants');
	};

	const saveAction = useCallback(async (date, description, invitedUsersIds) => {
		const councilData = createCouncilData(date, description, null, invitedUsersIds);
		const validation = validate(councilData);
		if (validation.length === 0) {
			const _id = await insertOrUpdateCouncil(councilData);
			goBack();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdateCouncil, date, description, invitedUsersIds, t]);

	const handleSaveCouncil = useCallback(async () => {
		await saveAction(date, description, invitedUsersIds);
		dispatchToastMessage({ type: 'success', message: t('Council_edited') });
		onChange();
	}, [saveAction, onChange, dispatchToastMessage]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<Button className='go-back-button' onClick={goBack}>
						<Icon name='back'/>
					</Button>
					<Label fontScale='h1'>{t('Council_edit')}</Label>
				</Field>
				<ButtonGroup>
					<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveCouncil}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8'>
					<Field.Label>{t('Date')} <span style={ { color: 'red' } }>{t('Editing')}</span></Field.Label>
					<Field.Row>
						<DatePicker
							dateFormat='dd.MM.yyyy HH:mm'
							selected={date}
							onChange={(newDate) => setDate(newDate)}
							showTimeSelect
							timeFormat='HH:mm'
							timeIntervals={5}
							timeCaption='Время'
							customInput={<TextInput border='1px solid #4fb0fc' />}
							locale='ru'
							popperClassName='date-picker'
						/>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')} <span style={ { color: 'red' } }>{t('Editing')}</span></Field.Label>
					<Field.Row>
						<TextAreaInput style={ { whiteSpace: 'normal' } } row='4' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
					</Field.Row>
				</Field>
				{context === 'participants' && <Field mbe='x8'>
					<Field.Row marginInlineStart='auto'>
						<Button marginInlineEnd='10px' small primary onClick={onAddParticipantClick} aria-label={t('Add')}>
							{t('Council_Add_Participant')}
						</Button>
					</Field.Row>
				</Field>}
				{context === 'participants' && <Participants onChange={onChange} context={'new'} invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsersIds}/>}
				{context === 'addParticipants' && <AddParticipant onChange={onChange} close={onClose} invitedUsers={invitedUsersIds} setInvitedUsers={setInvitedUsersIds} users={users} onNewParticipant={onParticipantClick}/>}
				{context === 'newParticipants' && <CreateParticipant goTo={onCreateParticipantClick} close={onParticipantClick} workingGroupOptions={workingGroupOptions} />}
			</Page.Content>
		</Page>
	</Page>;
}
