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
		<Th key={'Working_group_request_answers_count'} style={{ width: '190px' }} color='default'>
			{t('Working_group_request_answers_count')}
		</Th>,
		mediaQuery && <Th key={'Created_at'} color='default'>
			{t('Created_at')}
		</Th>,
		<Th w='x40' key='edit'/>,
	], [mediaQuery]);

	const renderRow = (mail) => {
		const { number, answers, ts } = mail;
		const countAnswers = answers?.filter((answer) => answer.unread).length || 0;
		const labelAnswers = t('Unread');
		const labelNumber = number ?? t('Working_group_request_mail_not_chosen_answer');
		return <Table.Row tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' onClick={onClick(mail)} color='default'>{labelNumber}</Table.Cell>
			<Table.Cell fontScale='p1' onClick={onClick(mail)} color='default'><Box withTruncatedText>{labelAnswers}: {countAnswers}</Box></Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' onClick={onClick(mail)} color='default'><Box withTruncatedText>{formatDate(ts)}</Box></Table.Cell>}
			{number && <Table.Cell alignItems={'end'}>
				<Button onClick={onEditClick(mail)} small aria-label={t('Edit')}>
					<Icon name='edit'/>
				</Button>
			</Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={data} total={data.length} setParams={setParams} params={params} />;
}
