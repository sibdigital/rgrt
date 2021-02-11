import React, { useCallback, useMemo, useState } from 'react';
import { Button, ButtonGroup, Field, Icon, Label, TextAreaInput, TextInput } from '@rocket.chat/fuselage';

import { settings } from '../../../settings/client';
import Page from '../../../../client/components/basic/Page';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { useRoute, useRouteParameter } from '../../../../client/contexts/RouterContext';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import { Mails } from './Mails';
import { Answers } from './Answers';
import { Answer } from './Answer';
import { AddMail } from './AddMail';
import VerticalBar from '../../../../client/components/basic/VerticalBar';
import { GoBackButton } from '../../../utils/client/views/GoBackButton';
import { useFormatDateAndTime } from '../../../../client/hooks/useFormatDateAndTime';

export function DocumentPage() {
	const t = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [cache, setCache] = useState();
	const [currentMail, setCurrentMail] = useState({});
	const [currentAnswer, setCurrentAnswer] = useState({});

	const router = useRoute('working-groups-request');
	const context = useRouteParameter('context');
	const requestId = useRouteParameter('id');

	const query = useMemo(() => ({
		query: JSON.stringify({ _id: requestId }),
	}), [requestId]);

	const data = useEndpointData('working-groups-requests.findOne', query) || { mails: [] };
	const mails = useMemo(() => data.mails ?? [], [data]);
	const answers = useMemo(() => data.answers ?? [], [data]);

	const address = [settings.get('Site_Url'), 'd/', data.inviteLink].join('') || '';

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
		// setCurrentMail(curMail ?? {});
		// router.push({ id: requestId, context: 'answers' });
		FlowRouter.go(`/working-groups-request/${ requestId }/answer/${ curMail._id }`);
	}, []);

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
	}, [router, mails]);

	const onAnswerClick = useCallback((answer) => () => {
		if (answer) {
			setCurrentAnswer(answer);
		}
		router.push({ id: requestId, context: 'answer', tab: 'info' });
	}, [router, currentAnswer]);

	return <Page flexDirection='row'>
		{(context !== 'answers' && context !== 'answer') && <Page>
			<Page.Header>
				<Field width={'100%'} display={'block'} marginBlock={'15px'}>
					<GoBackButton/>
					<Label fontScale='h1'>{t('Working_group_request')}</Label>
				</Field>
				<ButtonGroup>
					<Button primary small aria-label={t('Add')} onClick={handleHeaderButtonClick('add')}>
						{t('Add')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<Field mbe='x8' display='flex' flexDirection='row'>
					<Field mie='x4'>
						<Field.Label>{t('Number')}</Field.Label>
						<Field.Row>
							<TextInput value={data.number} readOnly placeholder={t('Number')} fontScale='p1'/>
						</Field.Row>
					</Field>
					<Field mis='x4'>
						<Field.Label>{t('Date')}</Field.Label>
						<Field.Row>
							<TextInput value={formatDateAndTime(new Date(data?.date ?? ''))} readOnly placeholder={t('Date')} fontScale='p1'/>
						</Field.Row>
					</Field>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Description')}</Field.Label>
					<Field.Row>
						<TextAreaInput rows='3' value={data.desc} readOnly placeholder={t('Description')} fontScale='p1'/>
					</Field.Row>
				</Field>
				<Field mbe='x8'>
					<Field.Label>{t('Working_group_request_invite_link')}</Field.Label>
					<Field.Row>
						<a href={address} is='span' target='_blank'>{address}</a>
					</Field.Row>
				</Field>
				{/*<Mails data={mails} onClick={onMailClick} onEditClick={onEditMailClick} params={params} setParams={setParams}/>*/}
				<Answers mail={data} onClick={onMailClick} editData={answers} onChange={onChange}/>
			</Page.Content>
		</Page>}
		{(context === 'add' || context === 'editMail')
		&& <VerticalBar className='contextual-bar' width='x380' qa-context-name={`admin-user-and-room-context-${ context }`} flexShrink={0}>
			<VerticalBar.Header>
				{ context === 'add' && t('Add') }
				{ context === 'editMail' && t('Edit') }
				<VerticalBar.Close onClick={close}/>
			</VerticalBar.Header>
			{context === 'add' && <AddMail goToNew={onAddMailClick} close={close} requestId={requestId} onChange={onChange}/>}
			{context === 'editMail' && <AddMail data={currentMail} goToNew={onAddMailClick} close={close} requestId={requestId} onChange={onChange}/>}
		</VerticalBar>}
	</Page>;
}

DocumentPage.displayName = 'DocumentPage';

export default DocumentPage;
