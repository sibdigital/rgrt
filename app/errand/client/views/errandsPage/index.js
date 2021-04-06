import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Icon,
	Table,
	Button,
	Label,
	Field,
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
import { useMethod } from '../../../../../client/contexts/ServerContext';
import { SuccessModal, WarningModal } from '../../../../utils/index';
import { useToastMessageDispatch } from '../../../../../client/contexts/ToastMessagesContext';
import { GoBackButton } from '../../../../utils/client/views/GoBackButton';
import { settings } from '../../../../settings';
import { constructPersonFullFIO } from '../../../../utils/client/methods/constructPersonFIO';
import { useUserId } from '/client/contexts/UserContext';
import { hasPermission } from '/app/authorization';
import { Meteor } from "meteor/meteor";

const style = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };

function Errands({
	type,
	data,
	sort,
	onClick,
	onHeaderClick,
	onChange,
	setParams,
	params,
}) {
	const _t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const formatDate = useFormatDate();

	const setModal = useSetModal();

	const deleteErrand = useMethod('deleteErrand');

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const onDeleteConfirm = useCallback(async (_id) => {
		try {
			await deleteErrand(_id);
			setModal(() => <SuccessModal title={_t('Deleted')} contentText={_t('Errand_Has_Been_Deleted')} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteErrand, dispatchToastMessage, onChange]);

	const onDel = (_id) => () => { onDeleteConfirm(_id); };

	const onDeleteClick = (_id) => () => setModal(() => <WarningModal title={_t('Are_you_sure')} contentText={_t('Errand_Delete_Warning')} onDelete={onDel(_id)} onCancel={() => setModal(undefined)}/>);

	const header = useMemo(() => [
		type === 'initiated_by_me' || <Th key={'initiatedBy._id'} color='default'>{_t('Errand_Initiated_by')}</Th>,
		type === 'charged_to_me' || <Th key={'chargedTo._id'} color='default'>{_t('Errand_Charged_to')}</Th>,
		mediaQuery && <Th key={'base'} color='default'>{_t('Errand_Base')}</Th>,
		mediaQuery && <Th key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' style={{ width: '150px' }} color='default'>{_t('Errand_Created_At')}</Th>,
		mediaQuery && <Th key={'expireAt'} direction={sort[1]} active={sort[0] === 'expireAt'} onClick={onHeaderClick} sort='expireAt' style={{ width: '150px' }} color='default'>{_t('Errand_Expired_date')}</Th>,
		<Th key={'t'} direction={sort[1]} active={sort[0] === 't'} onClick={onHeaderClick} sort='t' style={{ width: '100px' }} color='default'>{_t('Status')}</Th>,
		mediaQuery && <Th w='x40' key='delete'/>,
	].filter(Boolean), [type, sort, mediaQuery]);

	const renderRow = (item) => {
		const baseUrl = item.protocol ? [ 'protocol/', item.protocol._id ].join('') : undefined;
		const baseTitle = item.protocol ? _t('Protocol') + ' от ' + formatDate(item.protocol.d) + ' № ' + item.protocol.num : undefined;
		const initiatedBy = constructPersonFullFIO(item.initiatedBy ?? '');
		const chargedTo = constructPersonFullFIO(item.chargedTo ?? '');

		return <Table.Row key={item._id} role='link' action>
			{ type === 'initiated_by_me' || <Table.Cell fontScale='p1' onClick={onClick(item._id)} style={style} color='default'>
				{initiatedBy}
			</Table.Cell> }
			{type === 'charged_to_me' || <Table.Cell fontScale='p1' onClick={onClick(item._id)} style={style} color='default'>
				{chargedTo}
			</Table.Cell> }
			{ mediaQuery && <Table.Cell fontScale='p1' style={style} color='default'>
				{ baseUrl ? <a href={baseUrl}>{baseTitle}</a> : '' }
			</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(item._id)} style={style} color='default'>
				{item.ts && formatDate(item.ts)}
			</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(item._id)} style={style} color='default'>
				{item.expireAt && formatDate(item.expireAt)}
			</Table.Cell>}
			<Table.Cell fontScale='p1' style={style} onClick={onClick(item._id)} color='default'>
				{item.status?.i18nLabel ?? _t(item.t ?? '')}
			</Table.Cell>
			{ mediaQuery && <Table.Cell alignItems={'end'}>
				<Button small aria-label={_t('Delete')} onClick={onDeleteClick(item._id)}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	}

	return <GenericTable key='ErrandsTable' header={header} renderRow={renderRow} results={data.result} total={data.total} setParams={setParams} params={params} />;
}

export function ErrandPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const reactUserId = useUserId();
	const meteorUserId = Meteor.userId();
	console.dir({ react: hasPermission('manage-errands-from-me', reactUserId), meteor: hasPermission('manage-errands-from-me', meteorUserId) });

	const type = useRouteParameter('type');

	const [sort, setSort] = useState(['ts', 'asc']);
	const [params, setParams] = useState({ type, current: 0, itemsPerPage: 100 });
	const [cache, setCache] = useState(new Date());
	const [tab, setTab] = useState('errands');

	const mediaQuery = useMediaQuery('(min-width: 520px)');

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
	}), [type, sort, params]);

	const data = useEndpointData('errands', query) || { result: [], total: 0 };

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const onChange = useCallback(() => {
		setCache(new Date());
	}, []);

	const onClick = (_id) => () => {
		FlowRouter.go(`/errand/${ _id }`);
	};

	const onSendRequestAnswer = () => {
		window.open([settings.get('Site_Url'), 'd/all'].join(''), '_blank');
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title=''>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale={mediaQuery ? 'h1' : 'h2'}>{t(title)}</Label>
				</Field>
				{ title === 'Tasks_for_me' && <Button width='x160' primary small onClick={onSendRequestAnswer} aria-label={t('Send_request_answer')}>
					{ t('Send_request_answer') }
				</Button>}
			</Page.Header>
			<Page.Content>
				<Errands type={type} setParam={setParams} params={params} onHeaderClick={onHeaderClick} data={data} onClick={onClick} onChange={onChange} sort={sort}/>
			</Page.Content>
		</Page>
	</Page>;
}

ErrandPage.displayName = 'ErrandsPage';

export default ErrandPage;
