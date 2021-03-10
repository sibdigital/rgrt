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
import { useUser, useUserId } from '../../../../client/contexts/UserContext';

registerLocale('ru', ru);
require('react-datepicker/dist/react-datepicker.css');

export function CouncilFiles({ councilId }) {
	const t = useTranslation();
	const [cache, setCache] = useState();
	const userId = useUserId();

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: councilId }),
	}), [councilId]);


	const { data, state } = useEndpointDataExperimental('councils.findOne', query) || {};

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);


	if ([state].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Callout m='x16' type='danger'>{t('Loading...')}</Callout>;
	}

	if (!hasPermission('edit-councils', userId)) {
		console.log('Permissions_access_missing');
		return <Callout m='x16' type='danger'>{t('Permissions_access_missing')}</Callout>;
	}

	return <AddCouncilWithNewData persons={persons} onChange={onChange}/>;
}

CouncilFiles.displayName = 'CouncilFiles';

export default CouncilFiles;

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

	return ;
}
