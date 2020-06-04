import React, { useMemo } from 'react';
import { Box, Table } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { GenericTable, Th } from '../../../ui/client/components/GenericTable';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';

export function Councils({
	data,
	sort,
	onClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();

	const header = useMemo(() => [
		<Th key={'d'} direction={sort[1]} active={sort[0] === 'd'} onClick={onHeaderClick} sort='d'>{t('Date')}</Th>,
		<Th key={'desc'}>{t('Description')}</Th>,
	], [sort]);

	const formatDate = useFormatDate();

	const renderRow = (council) => {
		const { _id, d: date, desc } = council;
		return <Table.Row key={_id} onKeyDown={onClick(_id, council)} onClick={onClick(_id, council)} tabIndex={0} role='link' action qa-user-id={_id}>
			<Table.Cell fontScale='p1' color='default'><Box>{formatDate(date)}</Box></Table.Cell>
			<Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{desc}</Box></Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data.councils} total={data.total} setParams={setParams} params={params} />;
}
