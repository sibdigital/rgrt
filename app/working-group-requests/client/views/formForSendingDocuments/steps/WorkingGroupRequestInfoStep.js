import { Box, Field, Margins, TextInput, TextAreaInput, Table, Accordion, Icon } from '@rocket.chat/fuselage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import s from 'underscore.string';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { Pager } from '../../../../../../client/views/setupWizard/Pager';
import { Step } from '../../../../../../client/views/setupWizard/Step';
import { StepHeader } from '../../../../../../client/views/setupWizard/StepHeader';
import { useFormatDate } from '../../../../../../client/hooks/useFormatDate';
import GenericTable, { Th } from '../../../../../../client/components/GenericTable';
import { useEndpointDataExperimental } from '../../../../../../client/hooks/useEndpointDataExperimental';
import { useInvitePageContext } from '../InvitePageState';

registerLocale('ru', ru);

function WorkingGroupRequestInfoStep({ stepStyle, step, title, active, setWorkingGroupRequestData }) {
	const { goToNextStep, workingGroupRequestState } = useInvitePageContext();
	const t = useTranslation();
	const formatDate = useFormatDate();

	const [isSelectWGRequest, setIsSelectWGRequest] = useState(false);
	const [number, setNumber] = useState('');
	const [desc, setDesc] = useState('');

	const constructNumber = (request) => ['От ', formatDate(request.date ?? request.ts), ' № ', request.number ?? ' '].join('');

	useEffect(() => {
		if (workingGroupRequestState.data && workingGroupRequestState.data.number && workingGroupRequestState.data.desc) {
			setNumber(constructNumber(workingGroupRequestState.data));
			setDesc(workingGroupRequestState.data.desc);
		}
		if (workingGroupRequestState.workingGroupRequestId === 'all') {
			setIsSelectWGRequest(true);
		}
	}, [workingGroupRequestState]);

	const allFieldAreFilled = useMemo(() => s.trim(number) !== '' && s.trim(desc) !== '', [number, desc]);

	const onClick = useCallback((request) => {
		setNumber(constructNumber(request));
		setDesc(request.desc);
		setWorkingGroupRequestData(request);
	}, []);

	const handleSubmit = async (event) => {
		event.preventDefault();
		goToNextStep();
	};

	return <Step active={active} onSubmit={handleSubmit} style={stepStyle}>
		<StepHeader number={step} title={title} />

		<Margins blockEnd='x32'>
			<Box>
				<Box is='p' fontScale='p1' marginBlockEnd='x16'>{t('Working_group_request_invite_description')}</Box>
				{isSelectWGRequest
				&& <Accordion mbs='x16' mbe='x32'>
					<Accordion.Item overflowY='auto' maxHeight='x450' title={t('Working_group_requests')}>
						<Box maxHeight='x300' overflowY='auto' overflowX='hidden'>
							<RequestsTable onClick={onClick}/>
						</Box>
					</Accordion.Item>
				</Accordion>
				}
				<Field>
					<Field.Label>{t('Query')}</Field.Label>
					<Field.Row>
						<TextInput flexGrow={1} readOnly fontScale='p1' value={number}/>
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput flexGrow={1} value={desc} readOnly style={ { whiteSpace: 'normal', wordBreak: 'break-word' } } fontScale='p1' rows='8'/>
					</Field.Row>
				</Field>
			</Box>
		</Margins>

		<Pager isContinueEnabled={allFieldAreFilled || !workingGroupRequestState.data.workingGroupRequestId === 'all'}/>
	</Step>;
}

export default WorkingGroupRequestInfoStep;

const FilterByNumberAndDesc = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [desc, setDesc] = useState('');
	const [number, setNumber] = useState('');

	const handleDescChange = useMutableCallback((event) => setDesc(event.currentTarget.value));
	const handleNumberChange = useMutableCallback((event) => setNumber(event.currentTarget.value));
	const onSubmit = useMutableCallback((e) => e.preventDefault());

	useEffect(() => {
		setFilter({ desc, number });
	}, [setFilter, number, desc]);

	return <Box mb='x16' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
		<Box mb='x16' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
			<Field.Label>{t('Working_group_request_invite_find_by_number')}</Field.Label>
			<TextInput flexShrink={0} placeholder={t('Working_group_request_invite_find_by_number')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleNumberChange} value={number} />
		</Box>
		<Box mb='x16' onSubmit={onSubmit} display='flex' flexDirection='column' {...props}>
			<Field.Label>{t('Working_group_request_invite_find_by_desc')}</Field.Label>
			<TextInput flexShrink={0} placeholder={t('Working_group_request_invite_find_by_desc')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleDescChange} value={desc} />
		</Box>
	</Box>;
};

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ number, desc, itemsPerPage, current }, [column, direction]) => useMemo(() => ({
	query: JSON.stringify({
		$and: [
			number !== '' ? { number: { $regex: number || '', $options: 'i' } } : {},
			desc !== '' ? { desc: { $regex: desc || '', $options: 'i' } } : {},
		],
	}),
	fields: JSON.stringify({ number: 1, desc: 1, date: 1, ts: 1 }),
	sort: JSON.stringify({ [column]: sortDir(direction) }),
	...itemsPerPage && { count: itemsPerPage },
	...current && { offset: current },
}), [number, desc, column, direction, itemsPerPage, current]);

function RequestsTable({ onClick }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const mediaQuery = useMediaQuery('(max-width: 660px)');

	const [params, setParams] = useState({ number: '', desc: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['date']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);

	const query = useQuery(debouncedParams, debouncedSort);

	const { data, state } = useEndpointDataExperimental('working-groups-requests.list', query);

	const header = useMemo(() => [
		<Th key={'Number'} color='default'>
			{t('Number')}
		</Th>,
		!mediaQuery && <Th key={'Description'} color='default'>
			{ t('Description') }
		</Th>,
		!mediaQuery && <Th w='x200' key={'Date'} color='default'>
			{ t('Date') }
		</Th>,
	], [t, mediaQuery]);

	const renderRow = (request) => {
		const { _id, number, desc, date, ts } = request;

		return <Table.Row key={_id} tabIndex={0} role='link' action onClick={() => onClick(request)}>
			<Table.Cell fontScale='p1' color='default'>{number}</Table.Cell>
			{!mediaQuery && <Table.Cell fontScale='p1' color='default'>{desc}</Table.Cell>}
			{!mediaQuery && <Table.Cell fontScale='p1' color='default'>{formatDate(new Date(date ?? ts))}</Table.Cell>}
		</Table.Row>;
	};

	const onSubmit = useCallback((event) => {
		event.preventDefault();
		event.stopPropagation();
	}, []);

	return <Box is='form' onSubmit={onSubmit}>
		<GenericTable FilterComponent={FilterByNumberAndDesc} header={header} renderRow={renderRow} results={data?.requests ?? []} total={data?.total ?? 0} setParams={setParams} params={params}/>
	</Box>;
}
