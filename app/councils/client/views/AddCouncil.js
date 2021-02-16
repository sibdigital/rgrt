import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
	Field,
	TextAreaInput,
	Button,
	ButtonGroup,
	TextInput,
	Icon,
	Label,
	Callout,
	Tabs, Select,
} from '@rocket.chat/fuselage';
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
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
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

	const councilTypeOptions = useMemo(() => [
		[t('Council_type_meeting'), t('Council_type_meeting')],
		[t('Council_type_conference'), t('Council_type_conference')],
	], [t]);

	if ([personsDataState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16' type='danger'>{t('Loading...')}</Callout>;
	}

	if (!hasPermission('edit-councils', Meteor.userId())) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	return <AddCouncilWithNewData persons={persons} councilTypeOptions={councilTypeOptions} onChange={onChange} workingGroupOptions={workingGroupOptions}/>;
}

AddCouncilPage.displayName = 'AddCouncilPage';

export default AddCouncilPage;

function AddCouncilWithNewData({ persons, councilTypeOptions, onChange, workingGroupOptions }) {
	const t = useTranslation();

	const [context, setContext] = useState('participants');
	const [date, setDate] = useState(new Date());
	const [description, setDescription] = useState('');
	const [councilType, setCouncilType] = useState('');
	const [invitedPersonsIds, setInvitedPersonsIds] = useState([]);
	const [tab, setTab] = useState('persons');

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

	const hasUnsavedChanges = useMemo(() => description.trim() !== '', [description]);

	const handleTabClick = useMemo(() => (tab) => () => setTab(tab), []);

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

	const saveAction = useCallback(async (date, description, councilType, invitedPersonsIds) => {
		const councilData = createCouncilData(date, description, councilType, invitedPersonsIds, null);
		const validation = validate(councilData);
		if (validation.length === 0) {
			const council = await insertOrUpdateCouncil(councilData);
			await addCouncilToPersons(council._id, invitedPersonsIds);
			FlowRouter.go('councils');
		}
		validation.forEach((error) => { throw new Error({ type: 'error', message: t('error-the-field-is-required', { field: t(error) }) }); });
	}, [insertOrUpdateCouncil, addCouncilToPersons, t]);

	const handleSaveCouncil = useCallback(async () => {
		try {
			await saveAction(date, description, {
				_id: '',
				title: councilType,
			}, invitedPersonsIds);
			dispatchToastMessage({ type: 'success', message: t('Council_edited') });
		} catch (error) {
			console.log(error);
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onChange();
		}
	}, [date, description, councilType, invitedPersonsIds, saveAction, onChange, dispatchToastMessage]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
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
					<Field.Label>{t('Date')}</Field.Label>
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
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput style={ { whiteSpace: 'normal' } } row='4' border='1px solid #4fb0fc' value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder={t('Description')} />
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Council_type')}</Field.Label>
					<Field.Row>
						<Select style={ { whiteSpace: 'normal' } } border='1px solid #4fb0fc' options={councilTypeOptions} onChange={(val) => setCouncilType(val)} value={councilType} placeholder={t('Council_type')}/>
					</Field.Row>
				</Field>
				<Tabs flexShrink={0} mbe='x8'>
					<Tabs.Item selected={tab === 'persons'} onClick={handleTabClick('persons')}>{t('Council_Invited_Users')}</Tabs.Item>
					{/*<Tabs.Item selected={tab === 'files'} onClick={handleTabClick('files')}>{t('Files')}</Tabs.Item>*/}
				</Tabs>
				{context === 'participants' && tab === 'persons' && <Field mbe='x8'>
					<Field.Row marginInlineStart='auto'>
						<Button marginInlineEnd='10px' small primary onClick={onAddParticipantClick} aria-label={t('Add')}>
							{t('Council_Add_Participant')}
						</Button>
					</Field.Row>
				</Field>}
				{/*{tab === 'files' && <Field mbe='x8'>*/}
				{/*	<Field.Row marginInlineStart='auto'>*/}
				{/*		<Button onClick={fileUploadClick} mie='10px' small primary aria-label={t('Add')}>*/}
				{/*			{t('Upload_file_question')}*/}
				{/*		</Button>*/}
				{/*	</Field.Row>*/}
				{/*</Field>}*/}
				{context === 'participants' && <Persons councilId={null} onChange={onChange} invitedPersons={invitedPersons} setInvitedPersons={setInvitedPersonsIds}/>}
				{context === 'addParticipants' && <AddPerson councilId={null} onChange={onChange} close={onClose} persons={persons} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds} onNewParticipant={onParticipantClick}/>}
				{context === 'newParticipants' && <CreateParticipant councilId={null} goTo={onCreatePersonsClick} close={onClose} onChange={onChange} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds} workingGroupOptions={workingGroupOptions}/>}
			</Page.Content>
		</Page>
	</Page>;
}
