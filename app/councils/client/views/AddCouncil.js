import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
	Field,
	TextAreaInput,
	Button,
	ButtonGroup,
	TextInput,
	Label,
	Callout,
	Tabs,
	Select,
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
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
import { useUserId } from '../../../../client/contexts/UserContext';
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
	const userId = useUserId();

	const [cache, setCache] = useState(new Date());
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

	if (!hasPermission('edit-councils', userId)) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	return <AddCouncilWithNewData persons={persons} councilTypeOptions={councilTypeOptions} onChange={onChange} workingGroupOptions={workingGroupOptions}/>;
}

AddCouncilPage.displayName = 'AddCouncilPage';

export default AddCouncilPage;

function AddCouncilWithNewData({ persons, councilTypeOptions, onChange, workingGroupOptions }) {
	const t = useTranslation();
	const mediaQuery = useMediaQuery('(min-width: 520px)');

	const [context, setContext] = useState('participants');
	const [date, setDate] = useState(new Date());
	const [description, setDescription] = useState('');
	const [place, setPlace] = useState('');
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

	const inputStyles = useMemo(() => ({ wordBreak: 'break-word', whiteSpace: 'normal', border: '1px solid #4fb0fc' }), []);

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

	const saveAction = useCallback(async (date, description, councilType, invitedPersonsIds, place) => {
		const councilData = createCouncilData(date, description, councilType, invitedPersonsIds, null, place);
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
			}, invitedPersonsIds, place);
			dispatchToastMessage({ type: 'success', message: t('Council_edited') });
		} catch (error) {
			console.log(error);
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onChange();
		}
	}, [date, description, councilType, place, invitedPersonsIds, saveAction, onChange, dispatchToastMessage]);

	return <Page flexDirection='row'>
		<Page>
			<Page.Header display={mediaQuery ? 'flex' : 'block'}>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Council_Add')}</Label>
				</Field>
				<ButtonGroup display={mediaQuery ? 'flex' : 'block'}>
					<Button primary small aria-label={t('Save')} disabled={!hasUnsavedChanges} onClick={handleSaveCouncil}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Field mbe='x16' display={mediaQuery ? 'flex' : 'block'} flexDirection='row'>
					<Field mis='x4' display='flex' flexDirection='row'>
						<Field.Label maxWidth='100px' alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Council_type')}</Field.Label>
						<Field.Row width='-moz-available'>
							<Select mie='x16' style={inputStyles} options={councilTypeOptions} onChange={(val) => setCouncilType(val)} value={councilType} placeholder={t('Council_type')}/>
						</Field.Row>
					</Field>
					<Field mis='x4' display='flex' flexDirection='row'>
						<Field.Label alignSelf='center' mie='x16' style={{ flex: '0 0 0' }}>{t('Date')}</Field.Label>
						<Field.Row width='-moz-available'>
							<DatePicker
								mie='x16'
								dateFormat='dd.MM.yyyy HH:mm'
								selected={date}
								onChange={(newDate) => setDate(newDate)}
								showTimeSelect
								timeFormat='HH:mm'
								timeIntervals={5}
								timeCaption='Время'
								customInput={<TextInput style={ inputStyles } />}
								locale='ru'
								popperClassName='date-picker'/>
						</Field.Row>
					</Field>
				</Field>
				<Field mbe='x16' display={mediaQuery ? 'flex' : 'block'} flexDirection='row' alignItems='center' mis='x4'>
					<Field display='flex' flexDirection='row' mie='x8' alignItems='center'>
						<Label maxWidth='100px' mie='x8'>{t('Council_Place')}</Label>
						<TextInput mie='x12' fontScale='p1' placeholder={t('Council_Place')} value={place} onChange={(e) => setPlace(e.currentTarget.value)} style={inputStyles} />
					</Field>
				</Field>
				<Field mbe='x8' mis='x4'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput placeholder={t('Description')} style={ inputStyles } value={description} onChange={(e) => setDescription(e.currentTarget.value)} rows='5' fontScale='p1'/>
					</Field.Row>
				</Field>

				<Tabs flexShrink={0} mbe='x8'>
					<Tabs.Item selected={tab === 'persons'} onClick={handleTabClick('persons')}>{t('Council_Invited_Users')}</Tabs.Item>
				</Tabs>
				{context === 'participants' && tab === 'persons' && <Field mbe='x8'>
					<Field.Row marginInlineStart='auto' display={mediaQuery ? 'flex' : 'block'}>
						<Button marginInlineEnd='10px' small primary onClick={onAddParticipantClick} aria-label={t('Add')}>
							{t('Council_Add_Participant')}
						</Button>
					</Field.Row>
				</Field>}
				{context === 'participants' && <Persons councilId={null} onChange={onChange} invitedPersons={invitedPersons} setInvitedPersons={setInvitedPersonsIds}/>}
				{context === 'addParticipants' && <AddPerson councilId={null} onChange={onChange} close={onClose} persons={persons} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds} onNewParticipant={onParticipantClick}/>}
				{context === 'newParticipants' && <CreateParticipant councilId={null} goTo={onCreatePersonsClick} close={onClose} onChange={onChange} invitedPersons={invitedPersonsIds} setInvitedPersons={setInvitedPersonsIds} workingGroupOptions={workingGroupOptions}/>}
			</Page.Content>
		</Page>
	</Page>;
}
