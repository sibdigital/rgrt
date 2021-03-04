import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Box,
	Icon,
	Table,
	TextInput,
	Modal,
	Button,
	Label,
	Field,
	Tabs,
	TextAreaInput,
	ButtonGroup,
} from '@rocket.chat/fuselage';
import { useMediaQuery, useSafely } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import { useFormatDateAndTime } from '../../../../../client/hooks/useFormatDateAndTime';
import { useSetModal } from '../../../../../client/contexts/ModalContext';
import { EditErrandContextBar } from './EditErrand';
import { modal } from '../../../../ui-utils/client';
import { GoBackButton } from '../../../../utils/client/views/GoBackButton';
import { useUserId } from '../../../../../client/contexts/UserContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../../../client/hooks/useEndpointDataExperimental';
import { settings } from '../../../../settings';
import VerticalBar from '../../../../../client/components/basic/VerticalBar';


const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

const FilterByText = ({ setFilter, ...props }) => {
	const _t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text]);

	return <Box flexShrink={0} mb='x16' is='form' display='flex' flexDirection='row' {...props}>
		<TextInput flexShrink={0} placeholder={_t('Errand_Search_Charged_to')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
		<TextInput flexShrink={0} placeholder={_t('Errand_Search_Initiated_by')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
		<TextInput flexShrink={0} placeholder={_t('Errand_Search_Expired_date')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
		<TextInput flexShrink={0} placeholder={_t('Errand_Search_Created_at')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
		<TextInput flexShrink={0} placeholder={_t('Errand_Search_Status')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

function renderRequestModal({ onCancel, request, formatDateAndTime, ...props }) {
	const t = useTranslation();
	// const formatDate = useFormatDate();

	const goToSendAnswer = () => {
		window.open([settings.get('Site_Url'), 'd/', request.inviteLink].join(''), '_blank');
	};

	return <Modal {...props}>
		<Modal.Header>
			<Modal.Title>{t('Working_group_request')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<VerticalBar.ScrollableContent is='form'>
				<Field>
					<Field.Label>{t('Number')}</Field.Label>
					<Field.Row>
						<TextInput disabled value={request.number} key='number' placeholder={t('Number')} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows='3' disabled value={request.desc} key='desc' placeholder={t('Description')} />
					</Field.Row>
				</Field>
				<Field>
					<Field.Label>{t('Date')}</Field.Label>
					<Field.Row>
						{/*<TextInput disabled value={formatDate(request.date)} key='date' placeholder={t('Date')} />*/}
						<TextInput disabled value={formatDateAndTime(request.date)} key='date' placeholder={t('Date')} />
					</Field.Row>
				</Field>
				<Field>
					<ButtonGroup>
						<Button flexGrow={1} onClick={onCancel}>{t('Cancel')}</Button>
						<Button primary mie='none' flexGrow={1} onClick={goToSendAnswer}>{t('Send_request_answer')}</Button>
					</ButtonGroup>
				</Field>
			</VerticalBar.ScrollableContent>
		</Modal.Content>
	</Modal>;
}

function renderEditModal({ onCancel, erid, onChange, ...props }) {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Modal.Title>{t('Errand_details')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<EditErrandContextBar erid={erid} onChange={onChange} onClose={onCancel}/>
		</Modal.Content>
	</Modal>;
}

function renderAddErrandModal({ onChange }) {
	const t = useTranslation();
	modal.open({
		title: t('Errand_title'),
		modifier: 'modal',
		content: 'CreateErrand',
		data: {
			onCreate() {
				modal.close();
				onChange();
			},
		},
		confirmOnEnter: false,
		showConfirmButton: false,
		showCancelButton: false,
	});
}

function Errands({
	type,
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const _t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		type === 'initiated_by_me' || <Th key={'initiatedBy.username'} direction={sort[1]} active={sort[0] === 'initiatedBy.username'} onClick={onHeaderClick} sort='initiatedBy.username' color='default'>{_t('Errand_Initiated_by')}</Th>,
		type === 'charged_to_me' || <Th key={'chargedToUser.username'} direction={sort[1]} active={sort[0] === 'chargedToUser.username'} onClick={onHeaderClick} sort='chargedToUser.username' color='default'>{_t('Errand_Charged_to')}</Th>,
		mediaQuery && <Th key={'desc'} direction={sort[1]} active={sort[0] === 'desc'} onClick={onHeaderClick} sort='desc' color='default'>{_t('Description')}</Th>,
		mediaQuery && <Th key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' style={{ width: '150px' }} color='default'>{_t('Started_At')}</Th>,
		<Th key={'expireAt'} direction={sort[1]} active={sort[0] === 'expireAt'} onClick={onHeaderClick} sort='expireAt' style={{ width: '150px' }} color='default'>{_t('Errand_Expired_date')}</Th>,
		<Th key={'t'} direction={sort[1]} active={sort[0] === 't'} onClick={onHeaderClick} sort='t' color='default'>{_t('Status')}</Th>,
	].filter(Boolean), [type, sort, mediaQuery]);

	const formatDate = useFormatDate();
	const renderRow = useCallback((item) => <Table.Row key={item._id} onKeyDown={onClick(item.initiatedBy.username)} onClick={onClick(item)} role='link' action>
		{ type === 'initiated_by_me' || <Table.Cell fontScale='p1' style={style} color='default'>
			{item.initiatedBy.username}
		</Table.Cell> }
		{type === 'charged_to_me' || <Table.Cell fontScale='p1' style={style} color='default'>
			{item.chargedToUser.username}
		</Table.Cell> }
		{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>
			{item.desc}
		</Table.Cell> }
		{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>
			{formatDate(item.ts)}
		</Table.Cell>}
		<Table.Cell fontScale='p1' style={style} color='default'>
			{formatDate(item.expireAt)}
		</Table.Cell>
		<Table.Cell fontScale='p1' style={style} color='default'>
			{_t(item.t)}
		</Table.Cell>
	</Table.Row>
	, [mediaQuery]);

	return <GenericTable key='ErrandsTable' header={header} renderRow={renderRow} results={data.result} total={data.total} setParams={setParams} params={params} />;
}

function Requests({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const _t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const formatDate = useFormatDate();

	const header = useMemo(() => [
		mediaQuery && <Th key={'number'} onClick={onHeaderClick} color='default'>{_t('Number')}</Th>,
		mediaQuery && <Th key={'desc'} onClick={onHeaderClick} color='default'>{_t('Description')}</Th>,
		mediaQuery && <Th key={'date'} onClick={onHeaderClick} style={{ width: '150px' }} color='default'>{_t('Date')}</Th>,
	].filter(Boolean), [sort, mediaQuery]);

	const renderRow = useCallback((item) =>
		<Table.Row key={item._id} onClick={onClick(item)} role='link' action>
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>
				{item.number}
			</Table.Cell> }
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>
				{item.desc}
			</Table.Cell> }
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>
				{formatDate(item.date)}
			</Table.Cell>}
		</Table.Row>
	, [mediaQuery]);

	return <GenericTable key='RequestsTable' header={header} renderRow={renderRow} results={data.requests} total={data.total} setParams={setParams} params={params} />;
}

export function ErrandPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const userId = useUserId();
	const setModal = useSetModal();

	const type = useRouteParameter('type');

	const [sort, setSort] = useState(['ts', 'asc']);
	const [params, setParams] = useState({ type, current: 0, itemsPerPage: 100 });
	const [cache, setCache] = useState();
	const [tab, setTab] = useState('errands');

	let title = 'Errands';
	switch (type) {
		case 'initiated_by_me':
			title = 'Errands_from_me';
			tab !== 'errands' && setTab('errands');
			break;
		case 'charged_to_me':
			title = 'Tasks_for_me';
			tab !== 'requests' && setTab('requests');
			break;
	}

	const query = useMemo(() => ({
		query: JSON.stringify({
			type,
		}),
		sort: JSON.stringify({ [sort[0]]: sort[1] === 'asc' ? 1 : -1 }),
		...params.itemsPerPage && { count: params.itemsPerPage },
		...params.current && { offset: params.current },
	}), [params.itemsPerPage, params.current, sort, type, params.text, cache]);

	const currentUserPersonData = useEndpointData('users.getPerson', useMemo(() => ({ query: JSON.stringify({ userId }) }), [userId]));
	const data = useEndpointData('errands', query) || { result: [], total: 0 };

	const currentUserPersonQuery = useMemo(() => currentUserPersonData || { _id: '' }, [currentUserPersonData]);
	const { data: resData, state: resState } = useEndpointDataExperimental('protocolItemsPersonsResponsible.list', useMemo(() => ({
		query: JSON.stringify({ persons: { $elemMatch: { _id: currentUserPersonQuery._id } } }),
		fields: JSON.stringify({ persons: 0 }),
	}), [currentUserPersonQuery]));

	const requestsQuery = useMemo(() => resData?.protocolItemsPersonsResponsible?.map((protocol) => protocol.itemId) || [], [resData]);
	const { data: requests, state } = useEndpointDataExperimental('working-groups-requests.list', useMemo(() => ({
		query: JSON.stringify({ answers: { $elemMatch: { sectionItemId: { $in: requestsQuery } } } }),
		fields: JSON.stringify({ answers: 0 }),
	}), [requestsQuery]));

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const onChange = useCallback(() => {
		setModal(undefined);
		setCache(new Date());
	}, []);

	const cancelModal = useCallback(() => setModal(undefined), []);

	const onClick = useCallback((errand) => () => setModal(() => renderEditModal({ onCancel: cancelModal, erid: errand._id, onChange, key: 'modal-errand' })), []);

	const onRequestClick = useCallback((request) => () => setModal(() => renderRequestModal({ onCancel: cancelModal, request, formatDateAndTime, key: 'modal-request' })), []);

	const addErrand = useCallback(() => () => setModal(() => renderAddErrandModal({ onChange })), []);

	if ([state, resState].includes(ENDPOINT_STATES.LOADING)) {
		console.log('loading');
		return <Field>{t('Loading')}</Field>;
	}

	const onSendRequestAnswer = () => {
		window.open([settings.get('Site_Url'), 'd/all'].join(''), '_blank');
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t(title)}</Label>
				</Field>
				{ title === 'Errands_from_me' && <Button width='200px' primary small onClick={addErrand()} aria-label={t('Add')}>
					{ t('Add') }
				</Button> }
				{ title === 'Tasks_for_me' && <Button width='x160' primary small onClick={onSendRequestAnswer} aria-label={t('Send_request_answer')}>
					{ t('Send_request_answer') }
				</Button>}
			</Page.Header>
			<Page.Content>
				{type === 'charged_to_me' && <Tabs flexShrink={0} mbe='x8'>
					{/*<Tabs.Item selected={tab === 'errands'} onClick={() => setTab('errands')}>{t('Errands_for_me')}</Tabs.Item>*/}
					<Tabs.Item selected={tab === 'requests'} onClick={() => setTab('requests')}>{t('Working_group_requests')}</Tabs.Item>
				</Tabs>}
				{tab === 'errands' && <Errands type={type} setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onClick} sort={sort}/>}
				{tab === 'requests' && <Requests setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={requests} onClick={onRequestClick} sort={sort}/>}
			</Page.Content>
		</Page>
	</Page>;
}

ErrandPage.displayName = 'ErrandsPage';

export default ErrandPage;
