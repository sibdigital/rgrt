import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../ui/client/components/GenericTable';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useMethod } from '../../../../client/contexts/ServerContext';

export function Councils({
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

	const downloadCouncilParticipantsMethod = useMethod('downloadCouncilParticipants');

	const downloadCouncilParticipants = (_id) => async (e) => {
		e.preventDefault();
		try {
			const res = await downloadCouncilParticipantsMethod({ _id });
			const url = window.URL.createObjectURL(new Blob([res]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', 'file.docx');
			document.body.appendChild(link);
			link.click();
		} catch (e) {
			console.error('[index.js].downloadCouncilParticipants :', e);
		}
	};

	const header = useMemo(() => [
		<Th key={'d'} direction={sort[1]} active={sort[0] === 'd'} onClick={onHeaderClick} sort='d'>{t('Date')}</Th>,
		<Th key={'desc'}>{t('Description')}</Th>,
		mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '150px' }}>{t('Created_at')}</Th>,
		<Th w='x40' key='action'></Th>,
	], [sort, mediaQuery]);

	const formatDate = useFormatDate();

	const renderRow = (council) => {
		const { _id, d: date, desc, ts } = council;
		return <Table.Row key={_id} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='hint'>{formatDate(date)}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(_id)} color='hint'><Box withTruncatedText>{desc}</Box></Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(_id)} color='hint'>{formatDate(ts)}</Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small onClick={onEditClick(_id)} aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
				<Button small onClick={downloadCouncilParticipants(_id)} aria-label={t('Download')}>
					<Icon name='download'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data.councils} total={data.total} setParams={setParams} params={params} />;
}
