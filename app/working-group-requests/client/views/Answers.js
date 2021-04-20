import React, { useMemo, useState } from 'react';
import { Box, Table } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';

export function Answers({ editData, mail, onClick, onChange }) {
	const data = [];

	return <AnswersWithData answers={editData ?? data} mail={mail} onClick={onClick} onChange={onChange}/>;
}

function AnswersWithData({ answers, mail, onClick, onChange }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const requestId = useRouteParameter('id');

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });

	const readAnswer = useMethod('readAnswer');

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const onMouseEnter = async (answerEnter) => {
		if (answerEnter.unread) {
			const index = answers.findIndex((answer) => answer._id === answerEnter._id);
			if (index > -1) {
				answers[index].unread = false;
				await readAnswer(answerEnter._id);
				onChange();
			}
		}
	};

	const header = useMemo(() => [
		<Th key={'Sender'} color='default'>
			{ t('Sender') }
		</Th>,
		mediaQuery && <Th key={'Commentary'} color='default'>
			{t('Commentary')}
		</Th>,
		mediaQuery && <Th key={'Phone_number'} style={{ width: '190px' }} color='default'>{t('Phone_number')}</Th>,
		mediaQuery && <Th key={'Email'} color='default'>{t('Email')}</Th>,
		mediaQuery && <Th key={'Date'} color='default'>{t('Date')}</Th>,
	], [mediaQuery]);

	const renderRow = (answer) => {
		const { sender, commentary, unread, ts, _id } = answer;
		const organization = sender.organization ?? '';
		const phone = sender.phone ?? '';
		const email = sender.email ?? '';
		return <Table.Row onClick={onClick(_id)} onMouseEnter={() => onMouseEnter(answer)} style={{ borderLeft: unread ? '1px solid #4fb0fc' : '' }} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{organization}</Table.Cell>
			<Table.Cell fontScale='p1' color='default' style={{ wordBreak: 'break-all' }}>{commentary}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{formatDate(ts)}</Box></Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={answers} onChange={onChange} total={answers.length} setParams={setParams} params={params} />;
}
