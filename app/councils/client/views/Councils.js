import React, { useCallback, useMemo, Children } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useSetModal } from '../../../../client/contexts/ModalContext';
import { useToastMessageDispatch } from '../../../../client/contexts/ToastMessagesContext';
import { hasPermission } from '../../../authorization';
import { useUserId } from '../../../../client/contexts/UserContext';
import { SuccessModal, WarningModal } from '../../../utils/index';
import { downloadCouncilParticipantsForm } from './lib';
import { useRoute, useRouteParameter } from '/client/contexts/RouterContext';

require('moment/locale/ru.js');

const getDateStatus = (date) => {
	const today = new Date();
	const dt = new Date(date);
	let result = 'to-be';
	if (dt.getDate() === today.getDate() && dt.getMonth() === today.getMonth() && dt.getFullYear() === today.getFullYear()) {
		result = 'today';
	} else if (dt < today) {
		result = 'held';
	}
	return result;
};

const colorBackgroundCouncil = (date) => {
	const status = getDateStatus(date);
	let color = 'var(--rc-color-councils-background-to-be)';
	if (status === 'today') {
		color = 'var(--rc-color-councils-background-today)';
	} else if (status === 'held') {
		color = 'var(--rc-color-councils-background-held)';
	}
	return color;
};

const colorTextCouncil = (date) => {
	const status = getDateStatus(date);
	let color = 'var(--rc-color-councils-text-color-to-be)';
	if (status === 'today') {
		color = 'var(--rc-color-councils-text-color-today)';
	} else if (status === 'held') {
		color = 'var(--rc-color-councils-text-color-held)';
	}
	return color;
};

export function Councils({
	displayMode = 'table',
	data,
	sort,
	onClick,
	onEditClick,
	onHeaderClick,
	onChange,
	setParams,
	params,
}) {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const setModal = useSetModal();

	const isAllow = hasPermission('edit-councils', useUserId());

	const deleteCouncil = useMethod('deleteCouncil');

	const dispatchToastMessage = useToastMessageDispatch();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const downloadCouncilParticipantsMethod = useMethod('downloadCouncilParticipants');

	const downloadCouncilParticipants = (_id, type, date) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadCouncilParticipantsMethod({ _id, dateString: formatDateAndTime(data.d) });
			const fileName = [type, ' ', moment(new Date(date)).format('DD MMMM YYYY'), '.docx'].join('');
			if (res) {
				downloadCouncilParticipantsForm({ res, fileName });
			}
		} catch (e) {
			console.error('[councils.js].downloadCouncilParticipants :', e);
		}
	};

	const statusCouncil = (date) => {
		const status = getDateStatus(date);
		let statusText = t('To_be');
		if (status === 'today') {
			statusText = t('Today');
		} else if (status === 'held') {
			statusText = t('Held');
		}
		return statusText;
	};

	const styleTr = { borderBottomWidth: '10px', borderBottomColor: 'var(--color-white)' };

	const onDeleteCouncilConfirm = useCallback(async (_id) => {
		try {
			await deleteCouncil(_id);
			setModal(() => <SuccessModal title={'Delete'} contentText={t('Deleted')} onClose={() => { setModal(undefined); onChange(); }}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [deleteCouncil, dispatchToastMessage, onChange]);

	const onDel = (_id) => () => { onDeleteCouncilConfirm(_id); };

	const onDeleteCouncilClick = (_id) => () => setModal(() => <WarningModal title={t('Council_Delete_Warning')} contentText={t('Are_you_sure')} onDelete={onDel(_id)} onCancel={() => setModal(undefined)}/>);

	const header = useMemo(() => [
		<Th key={'d'} direction={sort[1]} active={sort[0] === 'd'} onClick={onHeaderClick} sort='d' style={{ width: '190px' }} color='default'>{t('Date')}</Th>,
		<Th key={'desc'} color='default'>{t('Description')}</Th>,
		// mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '190px' }} color='default'>{t('Created_at')}</Th>,
		mediaQuery && <Th key={'Council_type'} style={{ width: '190px' }} color='default'>{t('Council_type')}</Th>,
		isAllow && <Th w='x40' key='edit'/>,
		isAllow && <Th w='x40' key='delete'/>,
		<Th w='x40' key='download'/>,
	], [sort, mediaQuery]);

	const renderRow = (council) => {
		const { _id, d: date, desc, type } = council;
		return <Table.Row key={_id} tabIndex={0} role='link' action style={styleTr} backgroundColor={colorBackgroundCouncil(date)}>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color={colorTextCouncil(date)}>{formatDateAndTime(date)} {statusCouncil(date)}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color={colorTextCouncil(date)}><Box withTruncatedText>{desc}</Box></Table.Cell>
			{/*{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color={colorTextCouncil(date)}>{formatDateAndTime(ts)}</Table.Cell>}*/}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color={colorTextCouncil(date)}>{type?.title ?? ''}</Table.Cell>}
			{ isAllow && <Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')} color={colorTextCouncil(date)}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>}
			{ isAllow && <Table.Cell alignItems={'end'}>
				<Button small aria-label={t('Delete')} onClick={onDeleteCouncilClick(_id)} color={colorTextCouncil(date)}>
					<Icon name='trash'/>
				</Button>
			</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={downloadCouncilParticipants(_id, type?.title ?? '', date)} aria-label={t('Download')} color={colorTextCouncil(date)}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return useMemo(() => {
		switch (displayMode) {
			case 'table':
				return <GenericTable
					header={ header } renderRow={ renderRow } results={ data.councils }
					total={ data.total } setParams={ setParams } params={ params }/>;
			case 'calendar':
				return <CouncilsCalendar data={data} onClick={onClick} onChange={onChange}/>;
			default:
				return <Box/>;
		}
	}, [displayMode, data, header, renderRow, setParams, params]);
}

function CouncilsCalendar({
	data,
	onClick,
	onChange,
}) {
	const t = useTranslation();
	const localizer = momentLocalizer(moment);

	const router = useRoute('councils');
	const context = useRouteParameter('context');

	const myEventsList = useMemo(() =>
		data?.councils?.length > 0
			? data.councils.map((council) => ({ _id: council._id, title: council.desc, start: new Date(council.d), end: new Date(council.d) }))
			: []
	, [data]);
	const councilsDateArray = useMemo(() =>
			data?.councils?.length > 0
				? data.councils.map((council) => {
					const dt = new Date(council.d);
					return { year: dt.getFullYear(), month: dt.getMonth(), day: dt.getDate() };
				})
				: []
	, [data]);

	const onSelect = useCallback((one) => {
		onClick(one._id)();
	}, [onClick]);

	const getBackgroundColor = (children, value) => {
		let color = '';
		const findDate = new Date(value);

		if (councilsDateArray.find((cDate) => cDate.year === findDate.getFullYear() && cDate.month === findDate.getMonth() && cDate.day === findDate.getDate())) {
			color = colorBackgroundCouncil(findDate);
		}
		return color;
	};

	const ColoredDateCellWrapper = ({ children, value }) =>
		React.cloneElement(Children.only(children), {
			style: {
				...children.style,
				backgroundColor: getBackgroundColor(children, value),
			},
		});

	const eventHoverWrapper = ({ children }) =>
		React.cloneElement(Children.only(children), {
			className: 'custom-calendar-event',
			style: {
				...children.style,
				color: 'white',
				borderRadius: '10px',
				backgroundColor: 'var(--sidebar-background)',
				padding: '2px 4px',
				height: '45px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			},
		});

	return <Box overflow='auto' height='700px' maxHeight='700px'><Calendar
		views={['month', 'week', 'day']}
		culture={'ru'}
		localizer={localizer}
		events={myEventsList}
		startAccessor='start'
		endAccessor='end'
		onSelectEvent={onSelect}
		messages={{
			today: t('Today'),
			previous: t('Back'),
			next: t('Next'),
			month: t('Month'),
			week: t('Week'),
			day: t('Day'),
			showMore: (target) => <a href={[router.getUrl(), context].join('/')}>{`+ёще ${ target }`}</a>,
		}}

		components={{
			dateCellWrapper: ColoredDateCellWrapper,
			eventWrapper: eventHoverWrapper,
		}}
	/></Box>;
}
