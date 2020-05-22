import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {Avatar, Box, Button, ButtonGroup, Icon, Table, TextInput} from '@rocket.chat/fuselage';
import {useMediaQuery, useSafely} from '@rocket.chat/fuselage-hooks';
import _ from 'underscore';

import Page from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../../client/contexts/RouterContext';
import { useSetting } from '../../../../../client/contexts/SettingsContext';
import { useQuery } from '../../../../ui/client/views/app/components/hooks';
import { GenericTable, Th } from '../../../../ui/client/components/GenericTable';
import { usePermission } from '../../../../../client/contexts/AuthorizationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import MarkdownText from '../../../../../client/components/basic/MarkdownText';

import { modal } from '/app/ui-utils';
import { t } from '/app/utils';
import { useEndpoint } from '/client/contexts/ServerContext';
import { useToastMessageDispatch } from "/client/contexts/ToastMessagesContext";
import {Modal} from "/client/components/basic/Modal";

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


function renderErrandTable(type) {
	const _t = useTranslation();
	const [sort, setSort] = useState(['ts', 'asc']);
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

	const errandRoute = useRoute('errand');

	const canViewPublicRooms = usePermission('view-c-room');

	const [isLoading, setLoading] = useSafely(useState(true));
	const errands = (canViewPublicRooms && useEndpointData('errands', query)) || { result: [], total: 0 };
	const [updater, setUpdater] = useSafely(useState({ result: [], total: 0 }));
	const dispatchToastMessage = useToastMessageDispatch();



	const updateRecord = useCallback((oldErrand, data) => (newRecord) => {
		console.log('updateRecord errands', errands);
		console.log('updateRecord data', data);
		console.log(oldErrand);
		if (oldErrand._id !== newRecord._id) {
			console.log('Изменяется не тот объект!', 'Новый', newRecord._id, 'старый:', oldErrand._id);
		} else {
			oldErrand.t = newRecord.t;

			//this.errands.set(errands);
		}
	}, [errands, errands.result, errands.total]);

	const onClick = useCallback((errand, data) => (e) => {
		console.log('onClick errands', errands);
		console.log('onClick data', data);
		modal.open({
			title: t('Errand_details'),
			modifier: 'modal',
			content: 'ErrandDetails',
			data: {
				errand,
				updateRecord: updateRecord(errand,data),
				onCreate() {
					modal.close();
				},
			},
			showConfirmButton: false,
			showCancelButton: false,
			confirmOnEnter: false,
		});
	}, [errands, updateRecord, errands.result, errands.total]);


	const formatDate = useFormatDate();
	const renderRow = useCallback((item) => <Table.Row key={item._id} onKeyDown={onClick(item.initiatedBy.username)} onClick={onClick(item, errands)} role='link' action>
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

	return <GenericTable header={header} renderRow={renderRow} results={errands.result} total={errands.total} setParams={setParams} />;
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

	return <Page>
		<Page.Header title={t(title)} />
		<Page.Content>
			{renderErrandTable(type)}
		</Page.Content>
	</Page>;
}


ErrandPage.displayName = 'ErrandsPage';

export default ErrandPage;
