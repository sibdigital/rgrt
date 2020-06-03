import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Icon, Table, TextInput } from '@rocket.chat/fuselage';
import { useMediaQuery, useSafely } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { GenericTable, Th } from '../../../../ui/client/components/GenericTable';
import { usePermission } from '../../../../../client/contexts/AuthorizationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';

import { Modal } from '../../../../../client/components/basic/Modal';
import { EditErrandContextBar } from './EditErrand';


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

function renderEditModal({ onCancel, erid, onChange, ...props }) {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Modal.Title>{t('Errand_details')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<EditErrandContextBar erid={erid} onChange={onChange}/>
		</Modal.Content>
	</Modal>;
}

function renderErrandTable(type) {
	const _t = useTranslation();
	const [sort, setSort] = useState(['ts', 'asc']);
	const [modalData, setModalData] = useState(null);
	const [params, setParams] = useState({ current: 0, itemsPerPage: 100 });

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const query = useMemo(() => ({
		query: JSON.stringify({
			type,
		}),
		sort: JSON.stringify({ [sort[0]]: sort[1] === 'asc' ? 1 : -1 }),
		...params.itemsPerPage && { count: params.itemsPerPage },
		...params.current && { offset: params.current },
	}), [params.itemsPerPage, params.current, sort, type, params.text]);

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = useMemo(() => [
		type === 'initiated_by_me' || <Th key={'initiatedBy.username'} direction={sort[1]} active={sort[0] === 'initiatedBy.username'} onClick={onHeaderClick} sort='initiatedBy.username'>{_t('Errand_Initiated_by')}</Th>,
		type === 'charged_to_me' || <Th key={'chargedToUser.username'} direction={sort[1]} active={sort[0] === 'chargedToUser.username'} onClick={onHeaderClick} sort='chargedToUser.username'>{_t('Errand_Charged_to')}</Th>,
		mediaQuery && <Th key={'desc'} direction={sort[1]} active={sort[0] === 'desc'} onClick={onHeaderClick} sort='desc'>{_t('Description')}</Th>,
		mediaQuery && <Th key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' style={{ width: '150px' }}>{_t('Started_At')}</Th>,
		<Th key={'expireAt'} direction={sort[1]} active={sort[0] === 'expireAt'} onClick={onHeaderClick} sort='expireAt' style={{ width: '150px' }}>{_t('Errand_Expired_date')}</Th>,
		<Th key={'t'} direction={sort[1]} active={sort[0] === 't'} onClick={onHeaderClick} sort='t'>{_t('Status')}</Th>,
	].filter(Boolean), [sort, mediaQuery]);

	/* const routeName = 'errands';
	const router = useRoute(routeName);
	const onClick = useCallback((errand) => () => router.push({
		type: 'charged_to_me',
		props: {
			id: errand._id,
		},
	}), []);*/

	const canViewPublicRooms = usePermission('view-c-room');

	const data = (canViewPublicRooms && useEndpointData('errands', query)) || { result: [], total: 0 };
	const [errands, setErrands] = useSafely(useState(data));
	useEffect(() => {
		setErrands(data);
	}, [data]);

	// const onClick = useCallback((errand) => () => changeContext(errand), [changeContext]);
	const onClick = useCallback((errand) => () => setModalData(errand), []);
	const cancelModal = useCallback(() => setModalData(null), []);
	const updateErrandsData = useCallback((oldErrand) => (newErrand) => {
		errands.result[oldErrand.index] = { ...oldErrand, ...newErrand };
		setErrands(errands);
		setModalData(null);
	}, [errands]);

	const formatDate = useFormatDate();
	const renderRow = useCallback((item) => <Table.Row key={item._id} onKeyDown={onClick(item.initiatedBy.username)} onClick={onClick(item)} role='link' action>
		{ type === 'initiated_by_me' || <Table.Cell fontScale='p1' color='hint' style={style}>
			{item.initiatedBy.username}
		</Table.Cell> }
		{type === 'charged_to_me' || <Table.Cell fontScale='p1' color='hint' style={style}>
			{item.chargedToUser.username}
		</Table.Cell> }
		{ mediaQuery && <Table.Cell fontScale='p1' color='hint' style={style}>
			{item.desc}
		</Table.Cell> }
		{ mediaQuery && <Table.Cell fontScale='p1' color='hint' style={style}>
			{formatDate(item.ts)}
		</Table.Cell>}
		<Table.Cell fontScale='p1' color='hint' style={style}>
			{formatDate(item.expireAt)}
		</Table.Cell>
		<Table.Cell fontScale='p1' color='hint' style={style}>
			{_t(item.t)}
		</Table.Cell>
	</Table.Row>
	, [mediaQuery]);


	return [modalData && renderEditModal({ onCancel: cancelModal, erid: modalData._id, onChange: updateErrandsData(modalData), key: 'modal-errand' }), <GenericTable key='ErrandsTable' header={header} renderRow={renderRow} results={errands.result} total={errands.total} setParams={setParams} />];
}


export function ErrandPage() {
	const t = useTranslation();


	const type = useRouteParameter('type');
	let title = 'Errands';
	switch (type) {
		case 'initiated_by_me':
			title = 'Errands_from_me';
			break;
		case 'charged_to_me':
			title = 'Errands_for_me';
			break;
	}

	/* const [context, setContext] = useState(null);
*/
	/* const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const errandsRoute = useRoute('errands');

	const handleVerticalBarCloseButtonClick = () => {
		errandsRoute.push({ type });
	};*/

	/* const handleVerticalBarCloseButtonClick = () => {
		setContext(null);
	};*/

	return <Page flexDirection='row'>

		<Page>
			<Page.Header title={t(title)} />
			<Page.Content>
				{renderErrandTable(type)}
			</Page.Content>
		</Page>
		{/* {context && <VerticalBar>
			<VerticalBar.Header>
				{t('Errand_details')}
				<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
			</VerticalBar.Header>
			<VerticalBar.Content>
				<EditErrandContextBar erid={context._id}/>
			</VerticalBar.Content>
		</VerticalBar>}*/}
	</Page>;
}


ErrandPage.displayName = 'ErrandsPage';

export default ErrandPage;
