import React, { useMemo, useState, useCallback } from 'react';
import { Field, Button, ButtonGroup, Icon, Label, TextInput, TextAreaInput, Table, Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';

import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { useMethod } from '../../../../client/contexts/ServerContext';
import { useFormatDate } from '../../../../client/hooks/useFormatDate';
import { GenericTable, Th } from '../../../../client/components/GenericTable';

export function MailPage() {
	const t = useTranslation();
	const formatDate = useFormatDate();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [cache, setCache] = useState();
	const [currentMail, setCurrentMail] = useState({});
	const [currentAnswer, setCurrentAnswer] = useState({});

	const router = useRoute('working-groups-request');
	const requestId = useRouteParameter('requestid');
	const mailId = useRouteParameter('mailid');

	const mediaQuery = useMediaQuery('(min-width: 768px)');

	const readAnswer = useMethod('readAnswer');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId, mailId }),
	}), [mailId]);

	const data = useEndpointData('working-groups-requests.findMailOne', query) || { answers: [] };
	const answers = useMemo(() => data.answers, [data]);
	const numberLabel = data.number ? [t('Working_group_mail'), formatDate(data.ts ?? ''), '№', data.number ?? ''].join(' ') : t('Working_group_request_mail_not_chosen_answer');

	useMemo(() => console.log(data), [data]);

	const onChange = useCallback(() => {
		console.log('onchange');
		setCache(new Date());
	}, [cache]);

	const close = useCallback(() => {
		router.push({
			id: requestId,
		});
	}, [router]);

	const handleHeaderButtonClick = useCallback((context) => () => {
		router.push({ id: requestId, context });
	}, [router]);

	const onMailClick = useCallback((curMail) => () => {
		setCurrentMail(curMail ?? {});
		router.push({ id: requestId, context: 'answers' });
	}, [router]);

	const onEditMailClick = useCallback((curMail) => () => {
		setCurrentMail(curMail ?? {});
		router.push({ id: requestId, context: 'editMail' });
	}, [router]);

	const onAddMailClick = useCallback((newMail) => () => {
		if (newMail) {
			console.log(newMail);
			console.log(mails);
			const index = mails.findIndex((mail) => mail._id === newMail._id);
			if (index < 0) {
				mails.push(newMail);
			} else {
				mails[index] = newMail;
			}
		}
		router.push({ id: requestId });
	}, [router]);

	// const onAnswerClick = useCallback((answer) => () => {
	// 	if (answer) {
	// 		setCurrentAnswer(answer);
	// 	}
	// 	router.push({ requestid: requestId, tab: 'info' });
	// }, [router, currentAnswer]);

	const goBack = () => {
		window.history.back();
	};

	const onAnswerClick = (answer) => {
		FlowRouter.go(`/working-groups-request/${ requestId }/mail/${ mailId }/answer/${ answer._id }`);
	};

	const onMouseEnter = async (answerEnter) => {
		if (answerEnter.unread) {
			const index = answers.findIndex((answer) => answer._id === answerEnter._id);
			if (index > -1) {
				answers[index].unread = false;
				await readAnswer(requestId, data._id, answerEnter._id);
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
		return <Table.Row onClick={() => onAnswerClick(answer)} onMouseEnter={() => onMouseEnter(answer)} style={{ borderLeft: unread ? '1px solid #4fb0fc' : '' }} tabIndex={0} role='link' action>
			<Table.Cell fontScale='p1' color='default'>{organization}</Table.Cell>
			<Table.Cell fontScale='p1' color='default'>{commentary}</Table.Cell>
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{phone}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'>{email}</Table.Cell>}
			{ mediaQuery && <Table.Cell fontScale='p1' color='default'><Box withTruncatedText>{formatDate(ts)}</Box></Table.Cell>}
		</Table.Row>;
	};

	return <Page flexDirection='row'>
		<Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<Button className='go-back-button' onClick={goBack}>
						<Icon name='back'/>
					</Button>
					<Label fontScale='h1'>{t('Working_group_received_mails')}</Label>
				</Field>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8'>
					<Field.Label>{t('Number')}</Field.Label>
					<Field.Row>
						<TextInput value={numberLabel} readOnly placeholder={t('Number')} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows='3' value={data.description} readOnly placeholder={t('Description')} fontScale='p1'/>
					</Field.Row>
				</Field>
				<GenericTable header={header} renderRow={renderRow} results={answers ?? []} total={answers?.length || 0} setParams={setParams} params={params} />
				{/*<Answers editData={answers} mail={data} onClick={onAnswerClick} onChange={onChange}/>*/}
			</Page.Content>
		</Page>
		{/*{context === 'answers' && <Answers editData={currentMail.answers} mail={currentMail} onClick={onAnswerClick} onChange={onChange}/>}*/}
		{/*{context === 'answer' && <Answer answer={currentAnswer} router={router} requestId={requestId}/>}*/}
		{/*{(context === 'add' || context === 'editMail')*/}
		{/*&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>*/}
		{/*	<VerticalBar.Header>*/}
		{/*		{ context === 'add' && t('Add') }*/}
		{/*		{ context === 'editMail' && t('Edit') }*/}
		{/*		<VerticalBar.Close onClick={close}/>*/}
		{/*	</VerticalBar.Header>*/}
		{/*	{context === 'add' && <AddMail goToNew={onAddMailClick} close={close} requestId={requestId} onChange={onChange}/>}*/}
		{/*	{context === 'editMail' && <AddMail data={currentMail} goToNew={onAddMailClick} close={close} requestId={requestId} onChange={onChange}/>}*/}
		{/*</VerticalBar>}*/}
	</Page>;
}

MailPage.displayName = 'MailPage';

export default MailPage;
