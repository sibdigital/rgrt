import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useMethod } from '../../../../client/contexts/ServerContext';

export function Protocols({
	data,
	sort,
	onClick,
	onEditClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const downloadProtocolParticipantsMethod = useMethod('downloadProtocolParticipants');

	const downloadProtocolParticipants = (_id) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadProtocolParticipantsMethod({ _id });
			const url = window.URL.createObjectURL(new Blob([res]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'file.docx');
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadProtocolParticipants :', e);
		}
	};

	const header = useMemo(() => [
		<Th key={'num'} direction={sort[1]} active={sort[0] === 'num'} onClick={onHeaderClick} sort='num' style={{ width: '80px' }} color='default'>{t('Protocol_Number')}</Th>,
		<Th key={'d'} direction={sort[1]} active={sort[0] === 'd'} onClick={onHeaderClick} sort='d' color='default'>{t('Protocol_Date')}</Th>,
		mediaQuery && <Th key={'place'} color='default'>{t('Protocol_Place')}</Th>,
		mediaQuery && <Th key={'ts'} direction={sort[1]} active={sort[0] === 'ts'} onClick={onHeaderClick} sort='ts' style={{ width: '190px' }} color='default'>{t('Created_at')}</Th>,
		<Th w='x40' key='edit'></Th>,
		// <Th w='x40' key='download'></Th>
	], [sort, mediaQuery]);

	const formatDate = useFormatDate();
	const formatDateAndTime = useFormatDateAndTime();

	const renderRow = (protocol) => {
		const { _id, d: date, num, place, ts } = protocol;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{num}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{formatDate(date)}</Box></Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'><Box withTruncatedText>{place}</Box></Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='default'>{formatDateAndTime(ts)}</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
			{/*<Table.Cell alignItems={'end'}>*/}
			{/*	<Button small onClick={downloadProtocolParticipants(_id)} aria-label={t('Download')}>*/}
			{/*		<Icon name='download'/>*/}
			{/*	</Button>*/}
			{/*</Table.Cell>*/}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data.protocols} total={data.total} setParams={setParams} params={params} />;
}
