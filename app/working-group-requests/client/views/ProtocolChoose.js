import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Field, Icon, Table, TextInput } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import DatePicker from 'react-datepicker';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../../../client/hooks/useEndpointDataExperimental';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';

const FilterByText = ({ params, setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const handleChange = useMutableCallback((event) => setText(event.currentTarget.value));
	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		setFilter({ text });
	}, [setFilter, text]);

	return <Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
		<Field.Label>{t('Working_group_request_invite_find_by_number')}</Field.Label>
		<TextInput flexShrink={0} placeholder={t('Working_group_request_invite_find_by_number')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

const FilterByDateRange = ({ params, setFilter, ...props }) => {
	const t = useTranslation();
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const handleStartDateChange = useMutableCallback((selectedDate) => {
		console.dir({ selectedDate });
		setStartDate(new Date(selectedDate));
		console.dir('after select');
		const date = new Date(endDate);
		if (date.getTime() < new Date(startDate).getTime() || !endDate) {
			console.dir('if after select');
			try {
				console.dir({ dt: new Date(new Date(startDate).getTime() + 86400000) });
			} catch (e) {
				console.log(e);
			}
			setEndDate(new Date());
		}
	});

	const handleEndDateChange = useMutableCallback((selectedDate) => {
		if (new Date(selectedDate).getTime() >= new Date(startDate).getTime()) {
			setEndDate(new Date(selectedDate));
		}
	});

	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		console.dir({ startDate, endDate });
		if (startDate !== '' && endDate !== '') {
			setFilter({
				// ...params,
				startDate: new Date(startDate).toISOString(),
				endDate: new Date(endDate).toISOString(),
			});
		}
	}, [setFilter, startDate, endDate]);

	return <Box mb='x16' is='form' onSubmit={onSubmit} display='flex' flexDirection='column' { ...props }>
		<Field.Label>{t('Select_date_range')}</Field.Label>
		<Field.Row>
			<DatePicker
				mie='x8'
				dateFormat={'dd.MM.yyyy'}
				selected={startDate}
				onChange={handleStartDateChange}
				locale='ru'
				placeholder={'start'}
				customInput={<TextInput value={t('Start')} placeholder={'place'}/>}
				popperClassName='date-picker'
			/>
			<DatePicker
				dateFormat='dd.MM.yyyy'
				selected={endDate}
				minDate={startDate}
				onChange={handleEndDateChange}
				locale='ru'
				customInput={<TextInput/>}
				popperClassName='date-picker'
			/>
		</Field.Row>
	</Box>;
};

const Filters = ({ params, setFilter, ...props }) => {
	return <Box display='flex' flexDirection='column'>
		<FilterByText params={params} setFilter={setFilter}/>
		{/*<FilterByDateRange params={params} setFilter={setFilter}/>*/}
	</Box>;
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, startDate, endDate, itemsPerPage, current }, [column, direction], protocolsFields) => useMemo(() => ({
	query: JSON.stringify({
		$or: [
			{ num: { $regex: text || '', $options: 'i' } },
			// { d: { $gte: startDate ?? '', $lt: endDate ?? '' } },
		],
	}),
	fields: JSON.stringify(protocolsFields),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [text, startDate, endDate, protocolsFields, column, direction, itemsPerPage, current]);

export function ProtocolChoose({ setProtocolId, setProtocol, setCouncil, close, protocolsFields = null }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const mediaQuery = useMediaQuery('(max-width: 560px)');

	const [params, setParams] = useState({ text: '', startDate: '', endDate: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['d']);
	const [refProtocolsFields, setRefProtocolsFields] = useState(protocolsFields ?? { place: 1, d: 1, num: 1, council: 1 });

	const debouncedText = useDebouncedValue(params.text, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery({ ...params, text: debouncedText }, debouncedSort, refProtocolsFields);

	const { data: protocolData, state: protocolState } = useEndpointDataExperimental('protocols.list', query);

	const onProtocolClick = useCallback((protocol) => {
		setProtocolId && setProtocolId(protocol._id);
		setProtocol && setProtocol({ ...protocol, label: [t('Protocol'), ' ', t('Date_to'), ' ', formatDate(protocol.d), ' №', protocol.num].join('') });

		// console.dir({ protocol, protocolCouncilId: protocol.council._id });
		// protocol.council?._id && setCouncil({ _id: protocol.council._id, d: protocol.council.d ? new Date(protocol.council.d) : new Date(), typename: protocol.council.typename });
		close();
	}, [setProtocolId, setProtocol, t, formatDate, close]);

	const header = useMemo(() => [
		<Th w='x100' key={'Protocol_Number'} color='default'>
			{ t('Protocol_Number') }
		</Th>,
		<Th w='x160' key={'Date'} color='default'>
			{ t('Date') }
		</Th>,
		!mediaQuery && <Th w='x200' key={'Protocol_Place'} color='default'>
			{ t('Protocol_Place') }
		</Th>,
	], [t]);

	const renderRow = (protocol) => {
		const { _id, place, d, num } = protocol;
		return <Table.Row key={_id} tabIndex={0} role='link' action onClick={() => onProtocolClick(protocol)}>
			<Table.Cell fontScale='p1' color='default'>{num ?? ''}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{formatDate(d ?? '')}</Table.Cell>
			{!mediaQuery && <Table.Cell fontScale='p1' color='default'>{place ?? ''}</Table.Cell>}
		</Table.Row>;
	};

	return <Box>
		<Filters params={params} setFilter={setParams}/>
		<GenericTable header={header} renderRow={renderRow} results={protocolData?.protocols ?? []} total={protocolData?.total ?? 0} setParams={setParams} params={params}/>
	</Box>;
}

export default ProtocolChoose;
