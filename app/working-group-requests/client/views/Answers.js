import React, { useMemo, useState } from 'react';
import { Box, Button, Field, Icon, Label, Table, TextInput, TextAreaInput } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRouteParameter } from '../../../../client/contexts/RouterContext';
import { GenericTable, Th } from '../../../../client/components/GenericTable';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';

export function Answers({ editData, mail, onClick, onChange }) {
	const data = [];

	return <AnswersWithData answers={editData ?? data} mail={mail} onClick={onClick} onChange={onChange}/>;
}

function AnswersWithData({ answers, mail, onClick, onChange }) {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const requestId = useRouteParameter('id');

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const numberLabel = mail.number ? [t('Working_group_mail'), formatDate(mail.ts ?? ''), '№', mail.number ?? ''].join(' ') : t('Working_group_request_mail_not_chosen_answer');
	const descriptionLabel = mail.number ? mail.desc : t('Working_group_request_mail_not_chosen_answer');

	const readAnswer = useMethod('readAnswer');

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const onMouseEnter = async (answerEnter) => {
		if (answerEnter.unread) {
			const index = answers.findIndex((answer) => answer._id === answerEnter._id);
			if (index > -1) {
				answers[index].unread = false;
				// await readAnswer(requestId, mail._id, answerEnter._id);
				await readAnswer(requestId, answerEnter._id);
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
		const { sender, commentary, phone, email, unread, ts } = answer;
		const organization = sender.organization ?? '';
		return <Table.Row onClick={onClick(answer)} onMouseEnter={() => onMouseEnter(answer)} style={{ borderLeft: unread ? '1px solid #4fb0fc' : '' }} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{organization}</Table.Cell>
			<Table.Cell fontScale='p1' color='default' style={{ wordBreak: 'break-all' }}>{commentary}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{formatDate(ts)}</Box></Table.Cell>}
		</Table.Row>;
	};

	return <GenericTable header={header} renderRow={renderRow} results={answers} onChange={onChange} total={answers.length} setParams={setParams} params={params} />;

	// return <Page>
	// 	<Page.Header>
	// 		<Field width={'100%'} display={'block'} marginBlock={'15px'}>
	// 			<GoBackButton/>
	// 			<Label fontScale='h1'>{t('Working_group_received_mails')}</Label>
	// 		</Field>
	// 	</Page.Header>
	// 	<Page.Content>
	// 		<Field mbe='x8'>
	// 			<Field.Label>{t('Number')}</Field.Label>
	// 			<Field.Row>
	// 				<TextInput readOnly placeholder={t('Number')} is='span' fontScale='p1'>{numberLabel}</TextInput>
	// 			</Field.Row>
	// 		</Field>
	// 		<Field mbe='x8'>
	// 			<Field.Label>{t('Description')}</Field.Label>
	// 			<Field.Row>
	// 				<TextAreaInput rows='3' value={descriptionLabel} readOnly placeholder={t('Description')} fontScale='p1'/>
	// 			</Field.Row>
	// 		</Field>
	// 		<GenericTable header={header} renderRow={renderRow} results={answers} onChange={onChange} total={answers.length} setParams={setParams} params={params} />
	// 	</Page.Content>
	// </Page>;
}
