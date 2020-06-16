import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../ui/client/components/GenericTable';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

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

	const header = useMemo(() => [
		<Th key={'d'} direction={sort[1]} active={sort[0] === 'd'} onClick={onHeaderClick} sort='d'>{t('Date')}</Th>,
		<Th key={'desc'}>{t('Description')}</Th>,
		mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '150px' }}>{t('Created_at')}</Th>,
		<Th w='x40' key='action'></Th>
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
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data.councils} total={data.total} setParams={setParams} params={params} />;
}
