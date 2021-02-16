import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Icon, TextInput, Tile, Field, Table, Label, Scrollable } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { getAnimation } from '../../../../utils/client/index';

const SlideAnimation = getAnimation({ type: 'slideInRight' });

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
		<TextInput flexShrink={0} placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

export function AddPerson({ councilId, onChange, close, persons, invitedPersons, setInvitedPersons, onNewParticipant }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [countSelectedPersons, setCountSelectedPersons] = useState(0);
	const [personsIdToAdd, setPersonsIdToAdd] = useState([]);
	const [findPersons, setFindPersons] = useState([]);

	const addPersonsToCouncil = useMethod('addPersonsToCouncil');
	const addCouncilToPersons = useMethod('addCouncilToPersons');

	useEffect(() => {
		if (persons) {
			setFindPersons(invitedPersons && invitedPersons.length > 0 ? persons.filter((user) => invitedPersons.findIndex((invitedUsers) => invitedUsers._id === user._id) < 0) : persons);
		}
	}, [persons, invitedPersons]);

	const onAddUserCancelClick = () => {
		close();
	};

	const saveAction = useCallback(async () => {
		if (councilId) {
			await addPersonsToCouncil(councilId, personsIdToAdd);
			await addCouncilToPersons(councilId, personsIdToAdd);
		}
	}, [addPersonsToCouncil, addCouncilToPersons]);

	const handleSave = useCallback(async () => {
		try {
			if (personsIdToAdd.length > 0) {
				await saveAction();
				setInvitedPersons(invitedPersons ? invitedPersons.concat(personsIdToAdd) : personsIdToAdd);
				setPersonsIdToAdd([]);
				dispatchToastMessage({ type: 'success', message: t('Participant_Added_Successfully') });
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			onChange();
			close();
		}
	}, [dispatchToastMessage, saveAction, t]);

	const onAddClick = (_id) => () => {
		const index = personsIdToAdd.findIndex((iUser) => iUser._id === _id);
		if (index < 0) {
			personsIdToAdd.push({ _id, ts: new Date() });
		} else {
			personsIdToAdd.splice(index, 1);
		}
		setCountSelectedPersons(personsIdToAdd.length);
		onChange();
	};

	return <Field overflowX='hidden'>
		{<Field mb='x8' display='flex' flexDirection='row' alignItems='center'>
			<Label fontScale='p1'>{t('Selected')}: {countSelectedPersons}</Label>
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
		{<SearchByText setParams={ setParams } usersData={persons} setUsersData={setFindPersons}/>}
		{ findPersons && !findPersons.length
			? <>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{ t('No_data_found') }
				</Tile>
				{ params.text !== '' && <Button
					mbe='x8' primary aria-label={ t('New') } onClick={onNewParticipant('newParticipants')}>
					{ t('Participant_Create') }
				</Button> }
			</>
			: <SlideAnimation style={{ overflow: 'hidden auto' }}>
				<PersonsTable invitedPersons={ findPersons } personsIdToAdd={ personsIdToAdd } handleAddPerson={ onAddClick }/>
			</SlideAnimation>

		}
	</Field>;
}

function PersonsTable({ invitedPersons, personsIdToAdd, handleAddPerson }) {
	const t = useTranslation();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const style = { textOverflow: 'ellipsis' };

	const styleTableRow = { wordWrap: 'break-word' };

	const getBackgroundColor = (invitedPersonId) => {
		const index = invitedPersons.findIndex((user) => user._id === invitedPersonId);
		if (personsIdToAdd && personsIdToAdd.findIndex((person) => invitedPersonId === person._id) > -1) {
			return 'var(--list-selected-element-background-color)';
		}
		if (index > 0 && index % 2 === 1) {

			return 'var(--list-even-element-background-color)';
		}

		return 'var(--list-element-background-color)';

	};

	const header = useMemo(() => [
		<Th key={'fio'} color='default'>{t('Council_participant')}</Th>,
		mediaQuery && <Th key={'phone'} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'email'} color='default'>{t('Email')}</Th>,
	], [mediaQuery]);

	const renderRow = (invitedPerson) => {
		const iu = invitedPerson;
		return <Table.Row key={iu._id} style={styleTableRow} onClick={handleAddPerson(iu._id)} backgroundColor={getBackgroundColor(invitedPerson._id)} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.surname} {iu.name} {iu.patronymic}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.email}</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={invitedPersons} total={invitedPersons.length} setParams={setParams} params={params} />;
}
