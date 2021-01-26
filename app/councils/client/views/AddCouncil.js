import { Meteor } from 'meteor/meteor';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Field, TextAreaInput, Button, ButtonGroup, TextInput, Icon, Label, Callout } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';

import Page from '../../../../client/components/basic/Page';
import { hasPermission } from '../../../authorization';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { validate, createCouncilData } from './lib';
import { Persons } from './Participants/Participants';
import { AddPerson } from './Participants/AddParticipant';
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

const invitedPersonsQuery = ({ itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, email: 1, surname: 1, patronymic: 1, phone: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction), surnames: column === 'surname' ? sortDir(direction) : undefined }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [itemsPerPage, current, column, direction]);

export function AddCouncilPage() {
	const t = useTranslation();
	const [cache, setCache] = useState();
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [persons, setPersons] = useState([]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const personsQuery = invitedPersonsQuery(debouncedParams, debouncedSort);

	const workingGroups = useEndpointData('working-groups.list', useMemo(() => ({ query: JSON.stringify({ type: { $ne: 'subject' } }) }), [])) || { workingGroups: [] };
	// const data = useEndpointData('users.list', query) || { users: [] };
	const { data: personsData, state: personsDataState } = useEndpointDataExperimental('persons.list', personsQuery) || { persons: [] };
	useEffect(() => {
		if (personsData && personsData.persons) {
			setPersons(personsData.persons);
		}
	}, [personsData]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const workingGroupOptions = useMemo(() => {
		const res = [[null, t('Not_chosen')]];
		if (workingGroups && workingGroups.workingGroups?.length > 0) {
			return res.concat(workingGroups.workingGroups.map((workingGroup) => [workingGroup.title, workingGroup.title]));
		}
		return res;
	}, [workingGroups]);

	if ([personsDataState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16' type='danger'>{t('Loading...')}</Callout>;
	}

	if (!hasPermission('edit-councils', Meteor.userId())) {
		console.log('not permision');
		return <Callout m='x16' type='danger'>{t('Not_Permission')}</Callout>;
	}

	return <AddCouncilWithNewData persons={persons} setPersons={setPersons} onChange={onChange} workingGroupOptions={workingGroupOptions}/>;
}

AddCouncilPage.displayName = 'AddCouncilPage';

export default AddCouncilPage;

function AddCouncilWithNewData({ persons, setPersons, onChange, workingGroupOptions }) {
	const t = useTranslation();

	const [context, setContext] = useState('participants');
	const [date, setDate] = useState(new Date());
	const [description, setDescription] = useState('');
	const [invitedPersonsIds, setInvitedPersonsIds] = useState([]);
	// const [invitedUsersIds, setInvitedUsersIds] = useState([]);

	const invitedPersons = useMemo(() => persons.filter((person) => {
		const iPerson = invitedPersonsIds.find((iPerson) => iPerson._id === person._id);
		if (!iPerson) { return; }

		if (!iPerson.ts) {
			person.ts = new Date('January 1, 2021 00:00:00');
		} else {
			person.ts = iPerson.ts;
		}
		return person;
	}), [invitedPersonsIds, persons]);

	const insertOrUpdateCouncil = useMethod('insertOrUpdateCouncil');
	const addCouncilToPersons = useMethod('addCouncilToPersons');

	const dispatchToastMessage = useToastMessageDispatch();

	const goBack = () => {
		window.history.back();
	};

	const hasUnsavedChanges = useMemo(() => description.trim() !== '', [description]);

	const onAddParticipantClick = () => {
		setContext('addParticipants');
	};

	const onParticipantClick = useCallback((context) => () => {
		setContext(context);
	}, [context]);

	const onCreatePersonsClick = useCallback(() => () => {
		setContext('participants');
		onChange();
	}, [onChange]);

	const onClose = () => {
		setContext('participants');
	};

	const saveAction = useCallback(async (date, description, invitedPersonsIds) => {
		const councilData = createCouncilData(date, description, null, invitedPersonsIds);
		const validation = validate(councilData);
		if (validation.length === 0) {
			const council = await insertOrUpdateCouncil(councilData);
			await addCouncilToPersons(council._id, invitedPersonsIds);
			goBack();
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdateCouncil, date, description, invitedPersonsIds, t]);

	const handleSaveCouncil = useCallback(async () => {
		await saveAction(date, description, invitedPersonsIds);
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
				{/*{context === 'participants' && <Participants onChange={onChange} context={'new'} invitedUsers={invitedUsers} setInvitedUsers={setInvitedUsersIds}/>}*/}
				{/*{context === 'addParticipants' && <AddParticipant onChange={onChange} close={onClose} invitedUsers={invitedUsersIds} setInvitedUsers={setInvitedUsersIds} users={users} onNewParticipant={onParticipantClick}/>}*/}
				{/*{context === 'newParticipants' && <CreateParticipant goTo={onCreateParticipantClick} close={onParticipantClick} workingGroupOptions={workingGroupOptions} />}*/}
				{context === 'participants' && <Persons councilId={null} onChange={onChange} invitedPersons={invitedPersons} setInvitedPersons={setInvitedPersonsIds}/>}
				{context === 'addParticipants' && <AddPerson councilId={null} onChange={onChange} close={onClose} persons={persons} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds} onNewParticipant={onParticipantClick}/>}
				{context === 'newParticipants' && <CreateParticipant councilId={null} goTo={onCreatePersonsClick} close={onClose} onChange={onChange} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds}/>}
			</Page.Content>
		</Page>
	</Page>;
}
