import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Icon, TextInput, Tile, Scrollable, Field } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
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

const FilterByText = ({ setFilter, setIsFetching, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const handleChange = useMutableCallback((event) => { setText(event.currentTarget.value); setIsFetching(true); });
	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		setFilter({ text, current: 0, itemsPerPage: 25 });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
		<Field.Label>{t('Search')}</Field.Label>
		<TextInput flexShrink={0} placeholder={t('Search')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction], cache) => useMemo(() => ({
	fields: JSON.stringify({ name: 1, email: 1, surname: 1, patronymic: 1, organization: 1, position: 1, phone: 1 }),
	query: JSON.stringify({
		$or: [
			{ surname: { $regex: text || '', $options: 'i' } },
			{ name: { $regex: text || '', $options: 'i' } },
			{ patronymic: { $regex: text || '', $options: 'i' } },
		],
	}),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	cache,
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [cache, text, itemsPerPage, current, column, direction]);

export function AddParticipant({ protocolId, close, onCreateParticipant }) {
	console.log('AddParticipant');
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['surname', 'asc']);
	const [findPersons, setFindPersons] = useState([]);
	const [cache, setCache] = useState(new Date());
	const [isFetching, setIsFetching] = useState(false);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort, cache);

	const data = useEndpointData('persons.list', query);

	const participantsData = useEndpointData('protocols.allParticipants', useMemo(() => ({ query: JSON.stringify({ _id: protocolId, cache }) }), [cache, protocolId]));

	useEffect(() => {
		const persons = data?.persons.length > 0 ? participantsData?.users.length > 0 ? data.persons.filter(person => participantsData.users.find(p => p._id === person._id) === undefined) : data.persons : [];
		setFindPersons(persons);
		setIsFetching(false);
	}, [data, participantsData]);

	const insertOrUpdateSection = useMethod('addParticipantToProtocol');

	const saveAction = useCallback(async (userId) => {
		await insertOrUpdateSection(protocolId, userId);
	}, [insertOrUpdateSection, protocolId]);

	const handleSave = useCallback((userId) => async () => {
		try {
			await saveAction(userId);
			dispatchToastMessage({ type: 'success', message: t('Participant_Added_Successfully') });
			setCache(new Date());
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, saveAction, t]);

	const User = (user, borderColor = 'transparent') => <Box
		pb='x4'
		color='default'
		className={clickable}
		onDoubleClick={() => {
			borderColor = 'red';
			handleSave(user._id)();
		}}
		title={t('Participant_Add')}
		borderColor={borderColor}
	>
		<Box fontSize='16px'>{user.surname} {user.name} {user.patronymic}</Box>
		{/* <Box color='hint'>{user.position}, {user.organization}</Box> */}
	</Box>;

	useMemo(() => console.dir({ params }), [params]);

	return <VerticalBar.ScrollableContent>
		<FilterByText setFilter={ setParams } setIsFetching={setIsFetching}/>
		{findPersons && !findPersons.length
			? <Box mb='x8' flexGrow={1} opacity={isFetching && '20%'}>
				<Tile fontScale='p1' elevation='0' color='info' textAlign='center'>
					{t('No_data_found')}
				</Tile>
				{params.text !== '' && <Button
					w='full'
					mbe='x8' primary onClick={onCreateParticipant('create-participant')} aria-label={t('New')}>
					{t('Participant_Create')}
				</Button>
				}
			</Box>
			: <>
				<Scrollable>
					<Box mb='x8' flexGrow={1} opacity={isFetching && '20%'}>
						{data
							? findPersons.map((props, index) => <User key={props._id || index} { ...props}/>)
							: <></>
						}
						{/*{*/}
						{/*	data && data.total > params.current + params.itemsPerPage*/}
						{/*	&& <Button w='99%' mbs='x8' mbe='x16' mie='x4' onClick={() => setParams({ ...params, current: params.current + params.itemsPerPage })}>*/}
						{/*		{t('Load_more')}*/}
						{/*	</Button>*/}
						{/*}*/}
					</Box>
				</Scrollable>
				<ButtonGroup stretch w='full'>
					<Button mie='x4' onClick={close('participants')}>{t('Cancel')}</Button>
				</ButtonGroup>
			</>
		}
	</VerticalBar.ScrollableContent>;
}
