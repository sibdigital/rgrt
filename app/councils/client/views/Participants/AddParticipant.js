import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Icon, TextInput, Tile, Field, Table, Label } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import Loading from 'react-loading-animation';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { getAnimation } from '../../../../utils/client/index';
import { useEndpointDataExperimental } from '../../../../../client/hooks/useEndpointDataExperimental';

const SlideAnimation = getAnimation({ type: 'slideInRight' });

const FilterByText = ({ setFilter, setIsFetching, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const handleChange = useMutableCallback((event) => { setText(event.currentTarget.value); setIsFetching(true); });
	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		setFilter({ text, offset: 0, current: 0, itemsPerPage: 25 });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
		<Field.Label>{t('Search')}</Field.Label>
		<TextInput flexShrink={0} placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction], personFields) => useMemo(() => ({
	query: JSON.stringify({
		$or: [{
			surname: { $regex: text || '', $options: 'i' },
		}, {
			name: { $regex: text || '', $options: 'i' },
		}, {
			patronymic: { $regex: text || '', $options: 'i' },
		}],
	}),
	fields: JSON.stringify(personFields),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, personFields, column, direction, itemsPerPage, current]);

export function AddPerson({ councilId, onChange, close, persons, invitedPersons, setInvitedPersons, onNewParticipant }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [countSelectedPersons, setCountSelectedPersons] = useState(0);
	const [personsIdToAdd, setPersonsIdToAdd] = useState([]);
	const [findPersons, setFindPersons] = useState([]);
	const [isFetching, setIsFetching] = useState(false);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const personsQuery = useQuery(debouncedParams, debouncedSort, useMemo(() => ({ surname: 1, name: 1, patronymic: 1, phone: 1, email: 1 }), []));

	const { data: personsData } = useEndpointDataExperimental('persons.list', personsQuery);

	const addPersonsToCouncil = useMethod('addPersonsToCouncil');
	const addCouncilToPersons = useMethod('addCouncilToPersons');

	useEffect(() => {
		if (personsData && personsData.persons) {
			setFindPersons(invitedPersons && invitedPersons.length > 0 ? personsData.persons.filter((user) => invitedPersons.findIndex((invitedUsers) => invitedUsers._id === user._id) < 0) : personsData.persons);
		}
		setIsFetching(false);
	}, [personsData, invitedPersons]);

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
	}, [dispatchToastMessage, saveAction, t, personsIdToAdd]);

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
		{<FilterByText setFilter={ setParams } setIsFetching={setIsFetching}/>}
		{ findPersons && !findPersons.length
			? <>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{ t('No_data_found') }
				</Tile>
			</>
			: <Box display='flex' flexDirection='column'>
				{<Loading height='200px' width='200px' margin='1rem 1rem' style={{ alignSelf: 'center', position: 'absolute', zIndex: '40' }} isLoading={isFetching}/>}
				<SlideAnimation style={{ overflow: 'hidden auto' }}>
					<PersonsTable invitedPersons={ findPersons } personsIdToAdd={ personsIdToAdd } handleAddPerson={ onAddClick } isFetching={ isFetching }/>
				</SlideAnimation>
			</Box>
		}
	</Field>;
}

function PersonsTable({ invitedPersons, personsIdToAdd, handleAddPerson, isFetching }) {
	const t = useTranslation();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const style = { textOverflow: 'ellipsis' };

	const styleTableRow = useMemo(() => ({ wordWrap: 'break-word' }), []);

	const isFetchingStyleTableRow = useMemo(() => (isFetching ? { opacity: '20%' } : {}), [isFetching]);

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
		return <Table.Row key={iu._id} style={{ ...styleTableRow, ...isFetchingStyleTableRow }} onClick={handleAddPerson(iu._id)} backgroundColor={getBackgroundColor(invitedPerson._id)} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' style={style} color='default'>{iu.surname} {iu.name} {iu.patronymic}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>{iu.email}</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={invitedPersons} total={invitedPersons.length} setParams={setParams} params={params} />;
}
