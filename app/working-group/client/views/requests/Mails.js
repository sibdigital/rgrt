import React, { useMemo } from 'react';
import { Box, Button, Icon, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useFormatDate } from '../../../../../client/hooks/useFormatDate';
import { GenericTable, Th } from '../../../../../client/components/GenericTable';

export function Mails({
	data,
	sort,
	onClick,
	onEditClick,
	onHeaderClick,
	setParams,
	params,
}) {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const header = useMemo(() => [
		<Th key={'Number'} color='default'>
			{ t('Number') }
		</Th>,
		// mediaQuery && <Th key={'Description'} style={{ width: '190px' }} color='default'>
		// 	{t('Description')}
		// </Th>,
		<Th key={'Answers'} style={{ width: '190px' }} color='default'>
			{t('Answers')}
		</Th>,
		mediaQuery && <Th key={'Created_at'} color='default'>
			{t('Created_at')}
		</Th>,
		<Th w='x40' key='edit'></Th>,
	], [mediaQuery]);

	const renderRow = (mail) => {
		const { number, description, answers, ts } = mail;
		const countAnswers = answers?.filter((answer) => answer.unread).length || 0;
		const labelAnswers = t('Unread');
		return <Table.Row tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(mail)} color='default'>{number}</Table.Cell>
			{/*{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(mail)} color='default'>{description}</Table.Cell>}*/}
			<Table.Cell fontScale='p1' onClick={onClick(mail)} color='default'><Box withTruncatedText>{labelAnswers}: {countAnswers}</Box></Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(mail)} color='default'><Box withTruncatedText>{formatDate(ts)}</Box></Table.Cell>}
			<Table.Cell alignItems={'end'}>
				<Button small aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data} total={data.length} setParams={setParams} params={params} />;
}
